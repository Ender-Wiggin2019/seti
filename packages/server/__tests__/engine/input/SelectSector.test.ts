import { ESector } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectSector } from '@/engine/input/SelectSector.js';

describe('SelectSector', () => {
  it('accepts valid sector', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectSector(
      { id: 'p1' } as never,
      [ESector.BLUE, ESector.RED],
      onSelect,
    );

    input.process({ type: EPlayerInputType.SECTOR, sector: ESector.RED });
    expect(onSelect).toHaveBeenCalledWith(ESector.RED);
  });

  it('rejects invalid sector', () => {
    const input = new SelectSector(
      { id: 'p1' } as never,
      [ESector.BLUE],
      () => undefined,
    );

    expect(() =>
      input.process({ type: EPlayerInputType.SECTOR, sector: ESector.YELLOW }),
    ).toThrow();
  });
});
