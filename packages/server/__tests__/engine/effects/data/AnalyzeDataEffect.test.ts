import { vi } from 'vitest';
import { AnalyzeDataEffect } from '@/engine/effects/data/AnalyzeDataEffect.js';

describe('AnalyzeDataEffect', () => {
  it('clears placed computer data and reports cleared count', () => {
    const player = {
      computer: {
        isConnected: () => true,
        getPlacedCount: () => 3,
        clear: vi.fn(),
      },
    };

    expect(AnalyzeDataEffect.canExecute(player as never)).toBe(true);
    const result = AnalyzeDataEffect.execute(player as never);

    expect(result).toEqual({ dataCleared: 3 });
    expect(player.computer.clear).toHaveBeenCalledOnce();
  });
});
