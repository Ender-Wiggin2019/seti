import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectCardInput } from '@/features/input/SelectCardInput';
import { EPlayerInputType } from '@/types/re-exports';

const mockCards = [
  { id: 'c-1', name: 'Card One' },
  { id: 'c-2', name: 'Card Two' },
] as any[];

describe('SelectCardInput', () => {
  it('enforces min/max selection and submits card ids', () => {
    const onSubmit = vi.fn();
    render(
      <SelectCardInput
        model={{
          inputId: 'input-card',
          type: EPlayerInputType.CARD,
          cards: mockCards,
          minSelections: 1,
          maxSelections: 2,
        }}
        onSubmit={onSubmit}
      />,
    );

    const submitButton = screen.getByRole('button', {
      name: 'Confirm Selection',
    });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('select-card-c-1'));
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.CARD,
      cardIds: ['c-1'],
    });
  });
});
