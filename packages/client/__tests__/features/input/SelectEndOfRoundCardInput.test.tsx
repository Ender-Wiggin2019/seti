import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SelectEndOfRoundCardInput } from '@/features/input/SelectEndOfRoundCardInput';
import { useDebugStore } from '@/stores/debugStore';
import { EPlayerInputType } from '@/types/re-exports';

function createCard(id: string, name: string): IBaseCard {
  return {
    id,
    name,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('SelectEndOfRoundCardInput', () => {
  beforeEach(() => {
    useDebugStore.setState({ textMode: false });
  });

  it('renders cards and submits selected card id', () => {
    const onSubmit = vi.fn();
    render(
      <SelectEndOfRoundCardInput
        model={{
          inputId: 'input-eor',
          type: EPlayerInputType.END_OF_ROUND,
          cards: [createCard('card-a', 'Alpha'), createCard('card-b', 'Beta')],
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByTestId('card-render-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('seti-card-card-a')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('input-eor-card-card-b'));
    expect(onSubmit).toHaveBeenCalledWith({
      inputId: 'input-eor',
      type: EPlayerInputType.END_OF_ROUND,
      cardId: 'card-b',
    });
  });

  it('uses the shared text-mode card renderer for end-of-round choices', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <SelectEndOfRoundCardInput
        model={{
          inputId: 'input-eor',
          type: EPlayerInputType.END_OF_ROUND,
          cards: [createCard('card-a', 'Alpha')],
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card-render-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('text-card-card-a')).toBeInTheDocument();
  });
});
