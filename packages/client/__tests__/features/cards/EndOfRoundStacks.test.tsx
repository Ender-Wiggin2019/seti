import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EndOfRoundStacks } from '@/features/cards/EndOfRoundStacks';

function createCard(id: string): IBaseCard {
  return {
    id,
    name: `Card ${id}`,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('EndOfRoundStacks', () => {
  it('renders four stacks', () => {
    render(
      <EndOfRoundStacks stacks={[[], [], [], []]} currentRoundIndex={0} />,
    );

    expect(screen.getAllByTestId(/^round-stack-/)).toHaveLength(4);
  });

  it('highlights current stack', () => {
    render(
      <EndOfRoundStacks stacks={[[], [], [], []]} currentRoundIndex={2} />,
    );

    expect(screen.getByTestId('round-stack-2').className).toContain('ring-1');
  });

  it('expands current stack in select mode and supports selection', () => {
    const onSelectCard = vi.fn();
    render(
      <EndOfRoundStacks
        stacks={[[createCard('1')], [createCard('2')], [], []]}
        currentRoundIndex={0}
        mode='select'
        onSelectCard={onSelectCard}
      />,
    );

    fireEvent.click(screen.getByTestId('round-stack-card-1'));
    expect(onSelectCard).toHaveBeenCalledTimes(1);
  });
});
