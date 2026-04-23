import { Test } from '@nestjs/testing';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import { vi } from 'vitest';
import { DebugController } from '@/debug/debug.controller.js';
import { DebugService } from '@/debug/debug.service.js';

const MOCK_STATE = { gameId: 'debug-game' } as IPublicGameState;
const MOCK_REPLAY_PRESETS = [
  {
    id: 'anomaly-discovery',
    label: 'Alien Discovery Replay',
    description: 'Replay into an alien discovery checkpoint',
    fields: [],
    checkpoints: [],
  },
];
const MOCK_REPLAY_SESSION = {
  gameId: 'debug-game',
  accessToken: 'token',
  user: {
    id: 'player-1',
    name: 'Commander Ada',
    email: 'player-1@debug.local',
  },
  replay: {
    presetId: 'anomaly-discovery',
    checkpointId: 'before-end-turn',
    currentPlayerId: 'player-1',
    phase: 'await_end_turn',
    summary: 'Ready to resolve alien discovery on end turn',
  },
};

const mockDebugService = {
  listReplayPresets: vi.fn().mockReturnValue(MOCK_REPLAY_PRESETS),
  createReplaySession: vi.fn().mockResolvedValue(MOCK_REPLAY_SESSION),
  processEndTurn: vi.fn().mockResolvedValue(MOCK_STATE),
  solarRotate: vi.fn().mockResolvedValue(MOCK_STATE),
  placeProbeDirect: vi.fn().mockResolvedValue(MOCK_STATE),
};

describe('DebugController', () => {
  let controller: DebugController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [DebugController],
      providers: [{ provide: DebugService, useValue: mockDebugService }],
    }).compile();

    controller = module.get(DebugController);
  });

  it('POST /debug/server/game/:gameId/end-turn forwards payload', async () => {
    const result = await controller.processEndTurn('game-1', {
      playerId: 'player-1',
    });

    expect(mockDebugService.processEndTurn).toHaveBeenCalledWith(
      'game-1',
      'player-1',
      'player-1',
    );
    expect(result).toBe(MOCK_STATE);
  });

  it('GET /debug/replay-presets returns available replay presets', async () => {
    const result = controller.listReplayPresets();

    expect(mockDebugService.listReplayPresets).toHaveBeenCalledTimes(1);
    expect(result).toBe(MOCK_REPLAY_PRESETS);
  });

  it('POST /debug/server/replay-session forwards replay payload', async () => {
    const result = await controller.createReplaySession({
      presetId: 'anomaly-discovery',
      checkpointId: 'before-end-turn',
      fieldValues: { alienType: '1' },
    });

    expect(mockDebugService.createReplaySession).toHaveBeenCalledWith({
      presetId: 'anomaly-discovery',
      checkpointId: 'before-end-turn',
      fieldValues: { alienType: '1' },
    });
    expect(result).toBe(MOCK_REPLAY_SESSION);
  });

  it('POST /debug/server/game/:gameId/solar-rotate uses empty viewer fallback', async () => {
    const result = await controller.solarRotate('game-1', { discIndex: 2 });

    expect(mockDebugService.solarRotate).toHaveBeenCalledWith('game-1', 2, '');
    expect(result).toBe(MOCK_STATE);
  });

  it('POST /debug/server/game/:gameId/place-probe forwards player fallback', async () => {
    const result = await controller.placeProbeDirect('game-1', {
      playerId: 'player-1',
      spaceId: 'space-4',
    });

    expect(mockDebugService.placeProbeDirect).toHaveBeenCalledWith(
      'game-1',
      'player-1',
      'space-4',
      'player-1',
    );
    expect(result).toBe(MOCK_STATE);
  });
});
