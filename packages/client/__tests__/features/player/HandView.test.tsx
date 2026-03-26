import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HandView } from '@/features/player';
import { EPlayerInputType } from '@/types/re-exports';

function createCard(id: string, name: string): IBaseCard {
  return {
    id,
    name,
    price: 2,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('HandView', () => {
  it('renders card previews from hand', () => {
    render(
      <HandView
        cards={[createCard('card-a', 'Alpha'), createCard('card-b', 'Beta')]}
        handSize={2}
        pendingInput={null}
      />,
    );

    expect(screen.getByTestId('hand-card-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('hand-card-card-b')).toBeInTheDocument();
  });

  it('submits selected cards under card input mode', () => {
    const onSubmitSelection = vi.fn();
    const cards = [createCard('card-a', 'Alpha'), createCard('card-b', 'Beta')];

    render(
      <HandView
        cards={cards}
        handSize={2}
        pendingInput={{
          inputId: 'input-card-1',
          type: EPlayerInputType.CARD,
          cards,
          minSelections: 1,
          maxSelections: 2,
        }}
        onSubmitSelection={onSubmitSelection}
      />,
    );

    fireEvent.click(screen.getByTestId('hand-card-card-a'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onSubmitSelection).toHaveBeenCalledWith(['card-a']);
  });
});
