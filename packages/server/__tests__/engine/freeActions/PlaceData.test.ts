import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import type { Deck } from '@/engine/deck/Deck.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { EComputerRow } from '@/engine/player/Computer.js';
import { Player } from '@/engine/player/Player.js';
import { resolveSetupTucks } from '../../helpers/TestGameBuilder.js';

const SIMPLE_3_COL: IComputerColumnConfig[] = [
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
  { topReward: null, techSlotAvailable: true },
];

function createTestPlayer(overrides?: Record<string, unknown>): Player {
  return new Player({
    id: 'p1',
    name: 'Alice',
    color: 'red',
    seatIndex: 0,
    dataPoolCount: 3,
    ...overrides,
  });
}

function createMockGame(deckCards: string[] = []): IGame {
  return {
    mainDeck: {
      drawWithReshuffle(): string | undefined {
        return deckCards.shift();
      },
    } as unknown as Deck<string>,
    lockCurrentTurn(): void {
      // no-op for unit tests
    },
  } as unknown as IGame;
}

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function createIntegrationGame(seed: string): Game {
  const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, seed, seed);
  resolveSetupTucks(game);
  return game;
}

describe('PlaceDataFreeAction', () => {
  describe('canExecute', () => {
    it('returns true when data in pool and computer has space', () => {
      const player = createTestPlayer();
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        true,
      );
    });

    it('returns false when data pool is empty', () => {
      const player = createTestPlayer({ dataPoolCount: 0 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });

    it('returns false when top full and no bottom slots available', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeData({ row: 'TOP' as never, index: 0 });
      player.computer.placeData({ row: 'TOP' as never, index: 1 });
      player.computer.placeData({ row: 'TOP' as never, index: 2 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        false,
      );
    });

    it('returns true when top full and bottom slot available via tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      player.computer.placeData({ row: 'TOP' as never, index: 0 });
      player.computer.placeData({ row: 'TOP' as never, index: 1 });
      player.computer.placeData({ row: 'TOP' as never, index: 2 });
      expect(PlaceDataFreeAction.canExecute(player, createMockGame())).toBe(
        true,
      );
    });
  });

  describe('execute - basic placement', () => {
    it('places data from pool to first top slot', () => {
      const player = createTestPlayer();
      const initialPoolCount = player.dataPool.count;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(0);
      expect(player.dataPool.count).toBe(initialPoolCount - 1);
      expect(player.computer.getTopSlots()[0]).toBe(true);
    });

    it('fills top slots left to right across 6 default columns', () => {
      const player = createTestPlayer({ dataPoolCount: 6 });

      for (let i = 0; i < 6; i++) {
        const result = PlaceDataFreeAction.execute(player, createMockGame());
        expect(result.row).toBe('top');
        expect(result.index).toBe(i);
      }
      expect(player.computer.getTopSlots().every(Boolean)).toBe(true);
    });

    it('throws when data pool is empty', () => {
      const player = createTestPlayer({ dataPoolCount: 0 });

      expect(() =>
        PlaceDataFreeAction.execute(player, createMockGame()),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INSUFFICIENT_RESOURCES }),
      );
    });
  });

  describe('execute - bottom slot via tech placement', () => {
    it('fills bottom slot after top is full', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
    });

    it('skips columns without tech when looking for bottom slot', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(2, {
        techId: ETechId.COMPUTER_VP_CARD,
        bottomReward: { drawCard: 1 },
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(2);
    });

    it('throws when top full and no bottom slots available', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });

      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      expect(() =>
        PlaceDataFreeAction.execute(player, createMockGame()),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_ACTION }),
      );
    });
  });

  describe('execute - rewards', () => {
    it('grants 2VP when placing on top slot with tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ vp: 2 });
      expect(player.score).toBe(initialScore + 2);
    });

    it('grants built-in top reward (publicity) from default config', () => {
      const player = createTestPlayer({ dataPoolCount: 6 });
      const publicityBefore = player.resources.publicity;

      PlaceDataFreeAction.execute(player, createMockGame());
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('top');
      expect(result.index).toBe(1);
      expect(result.reward).toEqual({ publicity: 1 });
      expect(player.resources.publicity).toBe(publicityBefore + 1);
    });

    it('grants no reward for top slot without reward or tech', () => {
      const player = createTestPlayer({
        computerColumnConfigs: SIMPLE_3_COL,
      });
      const initialScore = player.score;

      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.reward).toBeUndefined();
      expect(player.score).toBe(initialScore);
    });

    it('grants credit for bottom slot of credit tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { credits: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const creditsBefore = player.resources.credits;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ credits: 1 });
      expect(player.resources.credits).toBe(creditsBefore + 1);
    });

    it('grants energy for bottom slot of energy tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(1, {
        techId: ETechId.COMPUTER_VP_ENERGY,
        bottomReward: { energy: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const energyBefore = player.resources.energy;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(1);
      expect(result.reward).toEqual({ energy: 1 });
      expect(player.resources.energy).toBe(energyBefore + 1);
    });

    it('draws card for bottom slot of card tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(2, {
        techId: ETechId.COMPUTER_VP_CARD,
        bottomReward: { drawCard: 1 },
      });
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));
      PlaceDataFreeAction.execute(player, createMockGame(['card-a']));

      const handBefore = player.hand.length;
      const game = createMockGame(['reward-card']);
      const result = PlaceDataFreeAction.execute(player, game);

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(2);
      expect(result.reward).toEqual({ drawCard: 1 });
      expect(player.hand.length).toBe(handBefore + 1);
      expect(player.hand).toContain('reward-card');
    });

    it('grants publicity for bottom slot of publicity tech', () => {
      const player = createTestPlayer({
        dataPoolCount: 5,
        computerColumnConfigs: SIMPLE_3_COL,
      });
      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_PUBLICITY,
        bottomReward: { publicity: 2 },
      });
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());
      PlaceDataFreeAction.execute(player, createMockGame());

      const publicityBefore = player.resources.publicity;
      const result = PlaceDataFreeAction.execute(player, createMockGame());

      expect(result.row).toBe('bottom');
      expect(result.index).toBe(0);
      expect(result.reward).toEqual({ publicity: 2 });
      expect(player.resources.publicity).toBe(publicityBefore + 2);
    });
  });

  describe('integration with real game flow', () => {
    it('does not allow another free action while a place-data reward input is still pending', () => {
      const game = createIntegrationGame('place-data-pending-input-lock');
      const player = game.players[0];

      player.computer.placeTech(0, {
        techId: ETechId.COMPUTER_VP_CREDIT,
        bottomReward: { tuckIncome: 1 },
      });
      for (let index = 0; index < player.computer.columnCount; index += 1) {
        player.computer.placeData({ row: EComputerRow.TOP, index });
      }
      player.dataPool.add(1);

      game.processFreeAction(player.id, {
        type: EFreeAction.PLACE_DATA,
        slotIndex: 0,
      });

      expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

      expect(() =>
        game.processFreeAction(player.id, {
          type: EFreeAction.BUY_CARD,
          fromDeck: true,
        }),
      ).toThrowError(
        expect.objectContaining({ code: EErrorCode.INVALID_INPUT_RESPONSE }),
      );
    });
  });

  describe('Phase 3.2: Integration tests with real Deck', () => {
    describe('3.2 main path', () => {
      it('3.2.1 [integration] places data left to right using real game', () => {
        const game = createIntegrationGame('place-data-left-to-right');
        const player = game.players[0];

        player.dataPool.add(6);

        for (let i = 0; i < 6; i++) {
          const result = PlaceDataFreeAction.execute(player, game);
          expect(result.row).toBe('top');
          expect(result.index).toBe(i);
          const topSlots = player.computer.getTopSlots();
          expect(topSlots[i]).toBe(true);
        }

        expect(player.dataPool.count).toBe(0);
        const finalTopSlots = player.computer.getTopSlots();
        expect(finalTopSlots.every(Boolean)).toBe(true);
      });

      it('3.2.2 [integration] resolves reward immediately when placing on slot with effect (real deck)', () => {
        const game = createIntegrationGame('place-data-reward-immediate');
        const player = game.players[0];

        player.computer.placeTech(2, {
          techId: ETechId.COMPUTER_VP_CARD,
          bottomReward: { drawCard: 1 },
        });

        for (let i = 0; i < 6; i++) {
          player.dataPool.add(1);
          PlaceDataFreeAction.execute(player, game);
        }

        const handBefore = player.hand.length;
        const deckSizeBefore = game.mainDeck.drawSize;

        player.dataPool.add(1);
        const result = PlaceDataFreeAction.execute(player, game, 2);

        expect(result.row).toBe('bottom');
        expect(result.index).toBe(2);
        expect(result.reward).toEqual({ drawCard: 1 });
        expect(player.hand.length).toBe(handBefore + 1);
        expect(game.mainDeck.drawSize).toBe(deckSizeBefore - 1);
        expect(typeof player.hand[player.hand.length - 1]).toBe('string');
      });

      it('3.2.3 [integration] tech column top slot must be filled before bottom slot', () => {
        const game = createIntegrationGame('tech-top-before-bottom');
        const player = game.players[0];

        player.computer.placeTech(0, {
          techId: ETechId.COMPUTER_VP_CREDIT,
          bottomReward: { credits: 1 },
        });

        const added = player.dataPool.add(10);
        expect(added).toBe(6);
        expect(player.dataPool.count).toBe(6);

        const result1 = PlaceDataFreeAction.execute(player, game);
        expect(result1.row).toBe('top');
        expect(result1.index).toBe(0);

        player.dataPool.add(10);
        for (let i = 1; i < 6; i++) {
          PlaceDataFreeAction.execute(player, game);
        }

        const availableBottom = player.computer.getAvailableBottomIndices();
        expect(availableBottom).toEqual([0]);

        const result2 = PlaceDataFreeAction.execute(player, game, 0);
        expect(result2.row).toBe('bottom');
        expect(result2.index).toBe(0);

        const bottomStates = player.computer.getBottomSlotStates();
        expect(bottomStates[0]).toBe(true);
      });

      it('3.2.4 [integration] data pool cap is 6, overflow is discarded', () => {
        const game = createIntegrationGame('data-pool-cap-six');
        const player = game.players[0];

        expect(player.dataPool.max).toBe(6);
        expect(player.dataPool.count).toBe(0);

        const actualAdded = player.dataPool.add(10);
        expect(actualAdded).toBe(6);
        expect(player.dataPool.count).toBe(6);
        expect(player.dataPool.isFull()).toBe(true);

        const moreAdded = player.dataPool.add(5);
        expect(moreAdded).toBe(0);
        expect(player.dataPool.count).toBe(6);
      });

      it('3.2.5 [integration] FAQ: cannot interrupt place-data effect resolution', () => {
        const game = createIntegrationGame('no-interrupt-place-data');
        const player = game.players[0];

        player.computer.placeTech(0, {
          techId: ETechId.COMPUTER_VP_CREDIT,
          bottomReward: { tuckIncome: 1 },
        });
        for (let i = 0; i < 6; i++) {
          player.computer.placeData({ row: EComputerRow.TOP, index: i });
        }
        player.dataPool.add(1);

        game.processFreeAction(player.id, {
          type: EFreeAction.PLACE_DATA,
          slotIndex: 0,
        });

        expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

        expect(() =>
          game.processFreeAction(player.id, {
            type: EFreeAction.BUY_CARD,
            fromDeck: true,
          }),
        ).toThrowError(
          expect.objectContaining({ code: EErrorCode.INVALID_INPUT_RESPONSE }),
        );
      });

      it('3.2.6 [integration] comp-0 (credit tech) grants 2VP top + 1 credit bottom', () => {
        const game = createIntegrationGame('comp-credit-tech');
        const player = game.players[0];

        player.computer.placeTech(0, {
          techId: ETechId.COMPUTER_VP_CREDIT,
          bottomReward: { credits: 1 },
        });

        const scoreBefore = player.score;
        const creditsBefore = player.resources.credits;

        player.dataPool.add(1);
        const resultTop = PlaceDataFreeAction.execute(player, game);
        expect(resultTop.row).toBe('top');
        expect(resultTop.index).toBe(0);
        expect(resultTop.reward).toEqual({ vp: 2 });
        expect(player.score).toBe(scoreBefore + 2);

        player.dataPool.add(5);
        for (let i = 1; i < 6; i++) {
          PlaceDataFreeAction.execute(player, game);
        }

        player.dataPool.add(1);
        const resultBottom = PlaceDataFreeAction.execute(player, game, 0);
        expect(resultBottom.row).toBe('bottom');
        expect(resultBottom.index).toBe(0);
        expect(resultBottom.reward).toEqual({ credits: 1 });
        expect(player.resources.credits).toBe(creditsBefore + 1);
      });

      it('3.2.7 [integration] comp-1 (energy tech) grants 2VP top + 1 energy bottom', () => {
        const game = createIntegrationGame('comp-energy-tech');
        const player = game.players[0];

        player.computer.placeTech(2, {
          techId: ETechId.COMPUTER_VP_ENERGY,
          bottomReward: { energy: 1 },
        });

        const scoreBefore = player.score;
        const energyBefore = player.resources.energy;

        player.dataPool.add(3);
        PlaceDataFreeAction.execute(player, game);
        PlaceDataFreeAction.execute(player, game);

        const resultTop2 = PlaceDataFreeAction.execute(player, game);
        expect(resultTop2.row).toBe('top');
        expect(resultTop2.index).toBe(2);
        expect(resultTop2.reward).toEqual({ vp: 2 });
        expect(player.score).toBe(scoreBefore + 2);

        player.dataPool.add(4);
        for (let i = 3; i < 6; i++) {
          PlaceDataFreeAction.execute(player, game);
        }

        player.dataPool.add(1);
        const resultBottom = PlaceDataFreeAction.execute(player, game, 2);
        expect(resultBottom.row).toBe('bottom');
        expect(resultBottom.index).toBe(2);
        expect(resultBottom.reward).toEqual({ energy: 1 });
        expect(player.resources.energy).toBe(energyBefore + 1);
      });

      it('3.2.8 [integration] comp-2 (card tech) grants 2VP top + draws 1 card bottom', () => {
        const game = createIntegrationGame('comp-card-tech');
        const player = game.players[0];

        player.computer.placeTech(4, {
          techId: ETechId.COMPUTER_VP_CARD,
          bottomReward: { drawCard: 1 },
        });

        const scoreBefore = player.score;

        player.dataPool.add(5);
        for (let i = 0; i < 4; i++) {
          PlaceDataFreeAction.execute(player, game);
        }

        const resultTop4 = PlaceDataFreeAction.execute(player, game);
        expect(resultTop4.row).toBe('top');
        expect(resultTop4.index).toBe(4);
        expect(resultTop4.reward).toEqual({ vp: 2 });
        expect(player.score).toBe(scoreBefore + 2);

        player.dataPool.add(2);
        PlaceDataFreeAction.execute(player, game);

        const handBefore = player.hand.length;
        const deckBefore = game.mainDeck.drawSize;
        const resultBottom = PlaceDataFreeAction.execute(player, game, 4);
        expect(resultBottom.row).toBe('bottom');
        expect(resultBottom.index).toBe(4);
        expect(resultBottom.reward).toEqual({ drawCard: 1 });
        expect(player.hand.length).toBe(handBefore + 1);
        expect(game.mainDeck.drawSize).toBe(deckBefore - 1);
      });

      it('3.2.9 [integration] comp-3 (publicity tech) grants 2VP top + 2 publicity bottom', () => {
        const game = createIntegrationGame('comp-publicity-tech');
        const player = game.players[0];

        player.computer.placeTech(5, {
          techId: ETechId.COMPUTER_VP_PUBLICITY,
          bottomReward: { publicity: 2 },
        });

        const scoreBefore = player.score;

        player.dataPool.add(6);
        for (let i = 0; i < 5; i++) {
          PlaceDataFreeAction.execute(player, game);
        }

        const resultTop5 = PlaceDataFreeAction.execute(player, game);
        expect(resultTop5.row).toBe('top');
        expect(resultTop5.index).toBe(5);
        expect(resultTop5.reward).toEqual({ vp: 2 });
        expect(player.score).toBe(scoreBefore + 2);

        player.dataPool.add(1);
        const publicityBefore = player.resources.publicity;
        const resultBottom = PlaceDataFreeAction.execute(player, game, 5);
        expect(resultBottom.row).toBe('bottom');
        expect(resultBottom.index).toBe(5);
        expect(resultBottom.reward).toEqual({ publicity: 2 });
        expect(player.resources.publicity).toBe(publicityBefore + 2);
      });
    });

    describe('3.2E error path', () => {
      it('3.2E.1 [error] cannot place data when pool is empty', () => {
        const game = createIntegrationGame('empty-pool-error');
        const player = game.players[0];

        expect(player.dataPool.count).toBe(0);
        expect(PlaceDataFreeAction.canExecute(player, game)).toBe(false);

        expect(() => PlaceDataFreeAction.execute(player, game)).toThrowError(
          expect.objectContaining({
            code: EErrorCode.INSUFFICIENT_RESOURCES,
            message: 'No data in pool to place',
          }),
        );
      });

      it('3.2E.2 [error] cannot place data when all slots full', () => {
        const game = createIntegrationGame('full-computer-error');
        const player = game.players[0];

        for (let i = 0; i < 6; i++) {
          player.dataPool.add(1);
          PlaceDataFreeAction.execute(player, game);
        }

        expect(player.computer.getTopSlots().every(Boolean)).toBe(true);
        expect(PlaceDataFreeAction.canExecute(player, game)).toBe(false);

        player.dataPool.add(1);
        expect(() => PlaceDataFreeAction.execute(player, game)).toThrowError(
          expect.objectContaining({
            code: EErrorCode.INVALID_ACTION,
            message: 'Computer is full, no available slot',
          }),
        );
      });

      it('3.2E.3 [error] rejects requesting non-sequential top slot index', () => {
        const game = createIntegrationGame('skip-top-slot-error');
        const player = game.players[0];

        player.dataPool.add(3);
        PlaceDataFreeAction.execute(player, game);

        const nextTop = player.computer.getNextTopIndex();
        expect(nextTop).toBe(1);

        expect(() => PlaceDataFreeAction.execute(player, game, 3)).toThrowError(
          expect.objectContaining({
            code: EErrorCode.INVALID_ACTION,
            message:
              'Top row must be filled left-to-right. Next available top slot is 1',
          }),
        );
      });
    });
  });
});
