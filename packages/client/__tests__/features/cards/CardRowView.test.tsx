import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardRowView } from '@/features/cards/CardRowView';

function createCard(id: string): IBaseCard {
  return {
    id,
    name: `Card ${id}`,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('CardRowView', () => {
  it('renders three cards', () => {
    render(
      <CardRowView
        cards={[createCard('1'), createCard('2'), createCard('3')]}
      />,
    );

    expect(screen.getAllByTestId(/^card-row-/)).toHaveLength(3);
  });

  it('calls click handler in buy mode', () => {
    const onCardClick = vi.fn();
    render(
      <CardRowView
        cards={[createCard('1')]}
        mode='buy'
        onCardClick={onCardClick}
      />,
    );

    fireEvent.click(screen.getByTestId('card-row-1'));
    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it('calls click handler in discard mode', () => {
    const onCardClick = vi.fn();
    render(
      <CardRowView
        cards={[createCard('1')]}
        mode='discard'
        onCardClick={onCardClick}
      />,
    );

    fireEvent.click(screen.getByTestId('card-row-1'));
    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it('renders idle mode without selected state', () => {
    render(<CardRowView cards={[createCard('1')]} mode='idle' />);

    expect(screen.getByTestId('card-row-1').className).not.toContain('ring-1');
  });
});
