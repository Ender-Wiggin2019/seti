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

    const submitButton = screen.getByRole('button', { name: 'Confirm' });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('hand-card-c-1'));
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'input-card',
      type: EPlayerInputType.CARD,
      cardIds: ['c-1'],
    });
  });

  it('shows the prompt title and a skip action when zero cards may be selected', () => {
    const onSubmit = vi.fn();
    render(
      <SelectCardInput
        model={{
          inputId: 'input-card',
          type: EPlayerInputType.CARD,
          title: 'Select a card to tuck for income',
          cards: mockCards,
          minSelections: 0,
          maxSelections: 1,
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Select a card to tuck for income')).toBeVisible();
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    expect(skipButton).not.toBeDisabled();

    fireEvent.click(skipButton);
    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'input-card',
      type: EPlayerInputType.CARD,
      cardIds: [],
    });
  });
});
