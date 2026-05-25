import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectCard } from '@/engine/input/SelectCard.js';

describe('SelectCard', () => {
  it('projects string and id-only card options to full card models', () => {
    const input = new SelectCard({ id: 'p1' } as never, {
      cards: ['128', { id: 'synthetic-128', cardId: '128' }],
      onSelect: () => undefined,
    });

    const model = input.toModel();

    expect(model.cards[0]).toMatchObject({
      id: '128',
      name: expect.any(String),
      price: expect.any(Number),
      effects: expect.any(Array),
    });
    expect(model.cards[1]).toMatchObject({
      id: 'synthetic-128',
      cardId: '128',
      name: expect.any(String),
      price: expect.any(Number),
      effects: expect.any(Array),
    });
  });

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
