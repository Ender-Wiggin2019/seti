import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectEndOfRoundCard } from '@/engine/input/SelectEndOfRoundCard.js';

describe('SelectEndOfRoundCard', () => {
  it('projects string card options to full card models', () => {
    const input = new SelectEndOfRoundCard(
      { id: 'p1' } as never,
      ['128'],
      () => undefined,
    );

    expect(input.toModel().cards[0]).toMatchObject({
      id: '128',
      name: expect.any(String),
      price: expect.any(Number),
      effects: expect.any(Array),
    });
  });

  it('calls onSelect with selected card id', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectEndOfRoundCard(
      { id: 'p1' } as never,
      [{ id: 'c1' }, { id: 'c2' }],
      onSelect,
    );

    input.process({ type: EPlayerInputType.END_OF_ROUND, cardId: 'c2' });
    expect(onSelect).toHaveBeenCalledWith('c2');
  });

  it('throws for unknown card id', () => {
    const input = new SelectEndOfRoundCard(
      { id: 'p1' } as never,
      [{ id: 'c1' }],
      () => undefined,
    );

    expect(() =>
      input.process({ type: EPlayerInputType.END_OF_ROUND, cardId: 'missing' }),
    ).toThrow();
  });
});
