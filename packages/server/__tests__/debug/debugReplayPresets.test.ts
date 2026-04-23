import { ETrace } from '@seti/common/types/element';
import {
  EAlienType,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { buildTestGame, getPlayer } from '../helpers/TestGameBuilder.js';
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

  describe('anomaly-discovery: full discovery chain', () => {
    function applyAnomalyDiscovery() {
      const game = buildTestGame();
      const replay = applyDebugReplayPreset(game, {
        presetId: 'anomaly-discovery',
        checkpointId: 'before-end-turn',
        fieldValues: { alienType: String(EAlienType.ANOMALIES) },
      });
      const board = game.alienState.getBoardByType(EAlienType.ANOMALIES)!;
      const player = getPlayer(game, replay.currentPlayerId);
      return { game, replay, board, player };
    }

    it('fills all 3 discovery slots with the active player traces', () => {
      const { board, player } = applyAnomalyDiscovery();
      const discoverySlots = board.getDiscoverySlots();

      expect(discoverySlots).toHaveLength(3);
      for (const slot of discoverySlots) {
        expect(slot.occupants).toHaveLength(1);
        expect(slot.occupants[0].source).toEqual({ playerId: player.id });
        expect(slot.occupants[0].traceColor).toBe(slot.traceColor);
      }
    });

    it('triggers full Anomalies discovery on end-turn: column slots, token slots, deck, face-up card', () => {
      const { game, replay, board } = applyAnomalyDiscovery();

      game.processEndTurn(replay.currentPlayerId);

      expect(board.discovered).toBe(true);

      const columnSlots = board.slots.filter((s) =>
        s.slotId.includes('anomaly-column'),
      );
      expect(columnSlots).toHaveLength(3);
      const columnColors = new Set(columnSlots.map((s) => s.traceColor));
      expect(columnColors).toEqual(
        new Set([ETrace.RED, ETrace.YELLOW, ETrace.BLUE]),
      );

      const tokenSlots = board.slots.filter((s) =>
        s.slotId.includes('anomaly-token'),
      );
      expect(tokenSlots.length).toBeGreaterThanOrEqual(3);

      expect(board.faceUpAlienCardId).not.toBeNull();
    });

    it('gives discoverers alien cards from the deck', () => {
      const { game, replay, player } = applyAnomalyDiscovery();
      const handBefore = player.hand.length;

      game.processEndTurn(replay.currentPlayerId);

      expect(player.hand.length).toBeGreaterThan(handBefore);
    });

    it('logs ALIEN_DISCOVERED event after end-turn', () => {
      const { game, replay } = applyAnomalyDiscovery();

      game.processEndTurn(replay.currentPlayerId);

      const events = game.eventLog.toArray();
      expect(
        events.some(
          (e) =>
            e.type === 'ACTION' &&
            e.action === 'ALIEN_DISCOVERED' &&
            e.details?.alienType === EAlienType.ANOMALIES,
        ),
      ).toBe(true);
    });

    it('anomaly token slots have VP:2 reward and maxOccupants 0', () => {
      const { game, replay, board } = applyAnomalyDiscovery();

      game.processEndTurn(replay.currentPlayerId);

      const tokenSlots = board.slots.filter((s) =>
        s.slotId.includes('anomaly-token'),
      );
      for (const slot of tokenSlots) {
        expect(slot.maxOccupants).toBe(0);
        expect(slot.rewards).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: 'VP', amount: 2 }),
          ]),
        );
      }
    });

    it('column slots are unlimited capacity with no rewards', () => {
      const { game, replay, board } = applyAnomalyDiscovery();

      game.processEndTurn(replay.currentPlayerId);

      const columnSlots = board.slots.filter((s) =>
        s.slotId.includes('anomaly-column'),
      );
      for (const slot of columnSlots) {
        expect(slot.maxOccupants).toBe(-1);
        expect(slot.rewards).toHaveLength(0);
      }
    });
  });

  describe('error cases', () => {
    it('throws on invalid checkpoint id', () => {
      const game = buildTestGame();
      expect(() =>
        applyDebugReplayPreset(game, {
          presetId: 'anomaly-discovery',
          checkpointId: 'nonexistent',
          fieldValues: { alienType: String(EAlienType.ANOMALIES) },
        }),
      ).toThrow();
    });

    it('throws on invalid alien type', () => {
      const game = buildTestGame();
      expect(() =>
        applyDebugReplayPreset(game, {
          presetId: 'anomaly-discovery',
          checkpointId: 'before-end-turn',
          fieldValues: { alienType: '999' },
        }),
      ).toThrow();
    });
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
