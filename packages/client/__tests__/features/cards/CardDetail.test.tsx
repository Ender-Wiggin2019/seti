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
});
