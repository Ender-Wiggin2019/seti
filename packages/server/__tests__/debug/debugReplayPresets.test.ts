import {
  EAlienType,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { buildTestGame } from '../helpers/TestGameBuilder.js';
import {
  applyDebugReplayPreset,
  listDebugReplayPresets,
} from '@/debug/debugReplayPresets.js';

describe('debugReplayPresets', () => {
  it('lists the anomaly discovery replay preset with selectable checkpoints', () => {
    const presets = listDebugReplayPresets();
    const anomalyPreset = presets.find(
      (preset) => preset.id === 'anomaly-discovery',
    );
    const triggerPreset = presets.find(
      (preset) => preset.id === 'anomaly-trigger-resolution',
    );

    expect(anomalyPreset).toBeDefined();
    expect(anomalyPreset?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alienType',
          kind: 'select',
        }),
      ]),
    );
    expect(anomalyPreset?.checkpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'before-end-turn' }),
      ]),
    );
    expect(triggerPreset).toBeDefined();
    expect(triggerPreset?.checkpoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'before-pass-rotation' }),
      ]),
    );
  });

  it('replays anomaly discovery to the before-end-turn checkpoint', () => {
    const game = buildTestGame();

    const replay = applyDebugReplayPreset(game, {
      presetId: 'anomaly-discovery',
      checkpointId: 'before-end-turn',
      fieldValues: { alienType: String(EAlienType.ANOMALIES) },
    });

    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);

    expect(replay.presetId).toBe('anomaly-discovery');
    expect(replay.checkpointId).toBe('before-end-turn');
    expect(replay.phase).toBe(EPhase.AWAIT_END_TURN);
    expect(game.phase).toBe(EPhase.AWAIT_END_TURN);
    expect(board).toBeDefined();
    expect(board?.discovered).toBe(false);
    expect(board?.isFullyMarked()).toBe(true);

    game.processEndTurn(replay.currentPlayerId);

    expect(board?.discovered).toBe(true);
    expect(
      board?.slots.some((slot) => slot.slotId.includes('anomaly-token')),
    ).toBe(true);
  });

  it('can retarget the replay to another alien module', () => {
    const game = buildTestGame();

    const replay = applyDebugReplayPreset(game, {
      presetId: 'anomaly-discovery',
      checkpointId: 'before-end-turn',
      fieldValues: { alienType: String(EAlienType.CENTAURIANS) },
    });

    const board = game.alienState.getBoard(replay.alienIndex);

    expect(replay.selectedAlienType).toBe(EAlienType.CENTAURIANS);
    expect(board?.alienType).toBe(EAlienType.CENTAURIANS);
    expect(board?.isFullyMarked()).toBe(true);
  });

  it('replays anomaly trigger resolution to the before-pass-rotation checkpoint', () => {
    const game = buildTestGame();

    const replay = applyDebugReplayPreset(game, {
      presetId: 'anomaly-trigger-resolution',
      checkpointId: 'before-pass-rotation',
      fieldValues: { alienType: String(EAlienType.ANOMALIES) },
    });

    const currentPlayer = game.players.find(
      (player) => player.id === replay.currentPlayerId,
    );
    const board = game.alienState.getBoardByType(EAlienType.ANOMALIES);
    const scoreBefore = currentPlayer?.score ?? 0;

    expect(replay.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(board?.discovered).toBe(true);
    expect(currentPlayer).toBeDefined();

    game.solarSystem?.rotateNextDisc();
    game.alienState.onSolarSystemRotated(game);

    const recentEvents = game.eventLog.toArray();

    expect(currentPlayer?.score).toBeGreaterThan(scoreBefore);
    expect(
      recentEvents.some(
        (event) => event.type === 'ACTION' && event.action === 'ANOMALY_TRIGGERED',
      ),
    ).toBe(true);
  });
});
