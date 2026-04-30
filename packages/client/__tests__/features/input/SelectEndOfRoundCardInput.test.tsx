import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectEndOfRoundCardInput } from '@/features/input/SelectEndOfRoundCardInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('SelectEndOfRoundCardInput', () => {
  it('renders cards and submits selected card id', () => {
    const onSubmit = vi.fn();
    render(
      <SelectEndOfRoundCardInput
        model={{
          inputId: 'input-eor',
          type: EPlayerInputType.END_OF_ROUND,
          cards: [
            { id: 'card-a', name: 'Alpha' },
            { id: 'card-b', name: 'Beta' },
          ] as any[],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Beta/ }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.END_OF_ROUND,
      cardId: 'card-b',
    });
  });
});
