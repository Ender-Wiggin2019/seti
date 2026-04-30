import { ETech } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectTech } from '@/engine/input/SelectTech.js';

describe('SelectTech', () => {
  it('accepts valid tech option', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectTech(
      { id: 'p1' } as never,
      [ETech.PROBE, ETech.SCAN],
      onSelect,
    );

    input.process({ type: EPlayerInputType.TECH, tech: ETech.SCAN });
    expect(onSelect).toHaveBeenCalledWith(ETech.SCAN);
  });

  it('throws for tech outside options', () => {
    const input = new SelectTech(
      { id: 'p1' } as never,
      [ETech.PROBE],
      () => undefined,
    );

    expect(() =>
      input.process({ type: EPlayerInputType.TECH, tech: ETech.COMPUTER }),
    ).toThrow();
  });
});
