import { Test } from '@nestjs/testing';
import type { IPublicGameState } from '@seti/common/types/protocol/gameState';
import { vi } from 'vitest';
import { DebugController } from '@/debug/debug.controller.js';
import { DebugService } from '@/debug/debug.service.js';

const MOCK_STATE = { gameId: 'debug-game' } as IPublicGameState;

const mockDebugService = {
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
