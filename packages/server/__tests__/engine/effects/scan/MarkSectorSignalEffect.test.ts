import { vi } from 'vitest';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';

describe('MarkSectorSignalEffect', () => {
  it('marks sector and applies player rewards', () => {
    const player = {
      id: 'p1',
      score: 0,
      resources: { gain: vi.fn() },
    };
    const sector = {
      id: 's1',
      completed: false,
      markSignal: vi.fn(() => ({ dataGained: { token: true }, vpGained: 2 })),
    };

    const result = MarkSectorSignalEffect.markOnSector(player as never, sector);

    expect(result).toEqual({
      sectorId: 's1',
      dataGained: true,
      vpGained: 2,
      completed: false,
    });
    expect(player.score).toBe(2);
    expect(player.resources.gain).toHaveBeenCalledWith({ data: 1 });
  });
});
