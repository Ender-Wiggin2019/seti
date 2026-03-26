import { vi } from 'vitest';
import { ScanEffect } from '@/engine/effects/scan/ScanEffect.js';

describe('ScanEffect', () => {
  it('finishes immediately when card row is empty', () => {
    const player = { id: 'p1', score: 0, resources: { gain: vi.fn() } };
    const game = {
      sectors: [
        {
          id: 'earth-sector',
          completed: false,
          markSignal: () => ({ dataGained: null, vpGained: 0 }),
        },
      ],
      cardRow: [],
    };
    const onComplete = vi.fn(() => undefined);

    const result = ScanEffect.execute(player as never, game as never, {
      onComplete,
    });

    expect(result).toBeUndefined();
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
