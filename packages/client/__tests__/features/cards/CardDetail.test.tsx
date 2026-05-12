import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardDetail } from '@/features/cards/CardDetail';

function createCard(): IBaseCard {
  return {
    id: 'card-1',
    name: 'Test Card',
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('CardDetail', () => {
  it('renders dialog with card when open', () => {
    render(<CardDetail card={createCard()} open onOpenChange={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('card-render-card-1')).toBeInTheDocument();
  });

  it('calls onOpenChange when clicking close', () => {
    const onOpenChange = vi.fn();
    render(<CardDetail card={createCard()} open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a prominent play-card action when a hand card is playable', () => {
    const onPlayCard = vi.fn();
    render(
      <CardDetail
        card={createCard()}
        open
        onOpenChange={vi.fn()}
        canPlayCard
        onPlayCard={onPlayCard}
      />,
    );

    const playButton = screen.getByTestId('card-detail-play-card');
    expect(playButton).toHaveTextContent('Play Card');
    expect(playButton).toHaveClass('h-12');

    fireEvent.click(playButton);
    expect(onPlayCard).toHaveBeenCalledTimes(1);
  });

  it('does not show play-card action for non-playable card details', () => {
    render(
      <CardDetail
        card={createCard()}
        open
        onOpenChange={vi.fn()}
        canPlayCard={false}
        onPlayCard={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId('card-detail-play-card'),
    ).not.toBeInTheDocument();
  });
});
