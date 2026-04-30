import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectCard } from '@/engine/input/SelectCard.js';

describe('SelectCard', () => {
  it('returns selected card ids via callback', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectCard({ id: 'p1' } as never, {
      cards: [{ id: 'c1' }, { id: 'c2' }],
      onSelect,
    });

    input.process({
      type: EPlayerInputType.CARD,
      cardIds: ['c2'],
    });

    expect(onSelect).toHaveBeenCalledWith(['c2']);
  });

  it('throws when selected id is not in options', () => {
    const input = new SelectCard({ id: 'p1' } as never, {
      cards: [{ id: 'c1' }],
      onSelect: () => undefined,
    });

    expect(() =>
      input.process({ type: EPlayerInputType.CARD, cardIds: ['cX'] }),
    ).toThrow();
  });
});
