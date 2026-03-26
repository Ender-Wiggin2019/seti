import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectEndOfRoundCard } from '@/engine/input/SelectEndOfRoundCard.js';

describe('SelectEndOfRoundCard', () => {
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
