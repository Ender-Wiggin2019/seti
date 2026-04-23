import { randomUUID } from 'node:crypto';
import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { buildTestGame, getPlayer } from '../helpers/TestGameBuilder.js';
import { applyDebugReplayPreset } from '@/debug/debugReplayPresets.js';
import { deserializeGame } from '@/persistence/serializer/GameDeserializer.js';
import { serializeGame } from '@/persistence/serializer/GameSerializer.js';

describe('DB snapshot replay (engine-level)', () => {
  it('serialized game round-trips and remains playable', () => {
    const game = buildTestGame();
    const dto = serializeGame(game);

    dto.gameId = randomUUID();
    const restored = deserializeGame(dto);

    expect(restored.id).toBe(dto.gameId);
    expect(restored.id).not.toBe(game.id);
    expect(restored.phase).toBe(game.phase);
    expect(restored.round).toBe(game.round);
    expect(restored.players).toHaveLength(game.players.length);
  });

  it('deserialized game can apply anomaly-discovery preset and resolve discovery', () => {
    const original = buildTestGame();
    const dto = serializeGame(original);
    dto.gameId = randomUUID();
    const game = deserializeGame(dto);

    const replay = applyDebugReplayPreset(game, {
      presetId: 'anomaly-discovery',
      checkpointId: 'before-end-turn',
      fieldValues: { alienType: String(EAlienType.ANOMALIES) },
    });

    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES)!;
    expect(board.isFullyMarked()).toBe(true);

    game.processEndTurn(replay.currentPlayerId);

    expect(board.discovered).toBe(true);
    expect(board.faceUpAlienCardId).not.toBeNull();
    expect(
      board.slots.some((s) => s.slotId.includes('anomaly-token')),
    ).toBe(true);
  });

  it('snapshot preserves player state through round-trip', () => {
    const game = buildTestGame();
    const p1 = getPlayer(game, 'p1');
    p1.score = 42;

    const dto = serializeGame(game);
    dto.gameId = randomUUID();
    const restored = deserializeGame(dto);
    const restoredP1 = restored.players.find((p) => p.id === 'p1')!;

    expect(restoredP1.score).toBe(42);
    expect(restoredP1.hand.length).toBe(p1.hand.length);
  });

  it('snapshot preserves alien state through round-trip', () => {
    const game = buildTestGame();
    expect(game.alienState.boards.length).toBeGreaterThan(0);

    const dto = serializeGame(game);
    dto.gameId = randomUUID();
    const restored = deserializeGame(dto);

    expect(restored.alienState.boards.length).toBe(
      game.alienState.boards.length,
    );
    for (let i = 0; i < game.alienState.boards.length; i++) {
      expect(restored.alienState.boards[i].alienType).toBe(
        game.alienState.boards[i].alienType,
      );
      expect(restored.alienState.boards[i].discovered).toBe(
        game.alienState.boards[i].discovered,
      );
    }
  });

  it('snapshot preserves RNG state for deterministic replay', () => {
    const game = buildTestGame();
    const dto = serializeGame(game);
    dto.gameId = randomUUID();
    const restored = deserializeGame(dto);

    const originalNext = game.random.nextInt(1000);
    const restoredNext = restored.random.nextInt(1000);
    expect(restoredNext).toBe(originalNext);
  });
});
