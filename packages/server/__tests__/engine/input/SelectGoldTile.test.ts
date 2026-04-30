import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectGoldTile } from '@/engine/input/SelectGoldTile.js';

describe('SelectGoldTile', () => {
  it('accepts valid tile option', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectGoldTile(
      { id: 'p1' } as never,
      ['tech', 'mission'],
      onSelect,
    );

    input.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'mission' });
    expect(onSelect).toHaveBeenCalledWith('mission');
  });

  it('throws for tile outside options', () => {
    const input = new SelectGoldTile(
      { id: 'p1' } as never,
      ['tech'],
      () => undefined,
    );

    expect(() =>
      input.process({ type: EPlayerInputType.GOLD_TILE, tileId: 'other' }),
    ).toThrow();
  });
});
