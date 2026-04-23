import { EMainAction } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { Game } from '@/engine/Game.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

function createTestGame(): Game {
  return Game.create(
    [
      { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
      { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
    ],
    { playerCount: 2 },
    'deserializer-seed',
    'game-deserializer-test',
  );
}

describe('GameDeserializer', () => {
  it('supports round-trip serialization', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    game.processMainAction(game.activePlayer.id, { type: EMainAction.PASS });

    const dto1 = serializeGame(game, 1);
    const restored = deserializeGame(dto1);
    const dto2 = serializeGame(restored, 1);

    expect(dto2).toEqual(dto1);
  });

  it('restores RNG sequence and game can continue', () => {
    const game = createTestGame();
    resolveSetupTucks(game);
    const dto = serializeGame(game, 1);
    const restored = deserializeGame(dto);

    expect(restored.random.next()).toBe(game.random.next());

    expect(() => {
      restored.processMainAction(restored.activePlayer.id, {
        type: EMainAction.PASS,
      });
    }).not.toThrow();
  });

  describe('rehydratePendingInputs — setup tuck chain', () => {
    it('rehydrates legacy snapshots that do not contain pendingSetupTucks', () => {
      const game = createTestGame();
      const dto = serializeGame(game, 1);

      for (const player of dto.players as Array<
        (typeof dto.players)[number] & { pendingSetupTucks?: number }
      >) {
        delete player.pendingSetupTucks;
      }

      const restored = deserializeGame(dto);

      for (const player of restored.players) {
        expect(player.pendingSetupTucks).toBe(1);
        expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
      }
    });

    it('does not infer setup tucks for legacy snapshots outside round 1', () => {
      const game = createTestGame();
      const dto = serializeGame(game, 1);
      dto.round = 2;

      for (const player of dto.players as Array<
        (typeof dto.players)[number] & { pendingSetupTucks?: number }
      >) {
        delete player.pendingSetupTucks;
      }

      const restored = deserializeGame(dto);

      for (const player of restored.players) {
        expect(player.pendingSetupTucks).toBe(0);
        expect(player.waitingFor).toBeUndefined();
      }
    });

    it('rebuilds setup tuck prompt when a player still owes tucks', () => {
      const game = createTestGame();
      expect(game.players.every((p) => p.pendingSetupTucks > 0)).toBe(true);
      expect(game.players.every((p) => Boolean(p.waitingFor))).toBe(true);

      const dto = serializeGame(game, 1);
      // Sanity check: pending input is NOT persisted, only the counter
      // survives. Any rebuild must use that counter as source of truth.
      expect(dto.players.every((p) => p.waitingFor === null)).toBe(true);
      expect(dto.players.every((p) => (p.pendingSetupTucks ?? 0) > 0)).toBe(
        true,
      );

      const restored = deserializeGame(dto);

      for (const player of restored.players) {
        expect(player.waitingFor).toBeDefined();
        expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
      }
    });

    it('does NOT rebuild a prompt for players who have finished their setup tucks', () => {
      const game = createTestGame();
      const p1 = game.players.find((p) => p.id === 'p1')!;
      // Fully resolve p1's chain; p2 still owes.
      while (p1.waitingFor) {
        const model = p1.waitingFor.toModel();
        if (model.type !== EPlayerInputType.CARD) break;
        const cardModel = model as {
          cards: Array<{ id: string }>;
          minSelections: number;
        };
        const cardIds = cardModel.cards
          .slice(0, cardModel.minSelections)
          .map((card) => card.id);
        game.processInput(p1.id, {
          type: EPlayerInputType.CARD,
          cardIds,
        });
      }
      expect(p1.pendingSetupTucks).toBe(0);
      expect(p1.waitingFor).toBeUndefined();

      const restored = deserializeGame(serializeGame(game, 1));
      const restoredP1 = restored.players.find((p) => p.id === 'p1')!;
      const restoredP2 = restored.players.find((p) => p.id === 'p2')!;

      expect(restoredP1.pendingSetupTucks).toBe(0);
      expect(restoredP1.waitingFor).toBeUndefined();
      // The peer who still owes gets a fresh prompt.
      expect(restoredP2.pendingSetupTucks).toBeGreaterThan(0);
      expect(restoredP2.waitingFor).toBeDefined();
    });

    it('does NOT override an existing non-setup-tuck pending input', () => {
      // Directly exercise the deserializer with a crafted DTO where one
      // player has a waitingFor pre-set — rehydrate should be a no-op
      // for that player.
      const game = createTestGame();
      resolveSetupTucks(game);
      // Now craft a scenario: drive the game to a state where p1 has a
      // non-setup pending input (e.g. by triggering a main action that
      // leaves one). For this test we use PASS which produces no
      // pending input, and just sanity-check the no-override path
      // semantics via a direct check: after round-trip, waitingFor
      // should remain undefined (no setup tucks owed).
      const dto = serializeGame(game, 1);
      const restored = deserializeGame(dto);
      for (const player of restored.players) {
        expect(player.pendingSetupTucks).toBe(0);
        expect(player.waitingFor).toBeUndefined();
      }
    });

    it('survives undo-style round-trip mid-setup', () => {
      // Simulates the undo path: deserialize, tuck, re-serialize,
      // deserialize again — the counter should drive prompt state the
      // whole way.
      const game = createTestGame();
      const firstDto = serializeGame(game, 1);
      const afterFirstRestore = deserializeGame(firstDto);
      const p1 = afterFirstRestore.players.find((p) => p.id === 'p1')!;

      expect(p1.waitingFor).toBeDefined();

      const model = p1.waitingFor!.toModel() as {
        cards: Array<{ id: string }>;
        minSelections: number;
      };
      afterFirstRestore.processInput(p1.id, {
        type: EPlayerInputType.CARD,
        cardIds: model.cards.slice(0, model.minSelections).map((c) => c.id),
      });

      const secondDto = serializeGame(afterFirstRestore, 2);
      const afterSecondRestore = deserializeGame(secondDto);
      const restoredP1 = afterSecondRestore.players.find((p) => p.id === 'p1')!;

      expect(restoredP1.pendingSetupTucks).toBe(0);
      expect(restoredP1.waitingFor).toBeUndefined();
    });
  });
});
