import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RivalPanel } from '@/features/solo';
import type { IPublicRivalState } from '@/types/re-exports';

describe('RivalPanel', () => {
  it('renders rival progress, deck, computer slots, and reward icons', () => {
    render(<RivalPanel rival={createRival()} />);

    expect(screen.getByTestId('rival-panel')).toBeInTheDocument();
    expect(screen.getByTestId('rival-progress-icon')).toHaveAttribute(
      'src',
      '/assets/seti/icons/progress.png',
    );
    expect(screen.getByTestId('rival-progress')).toHaveTextContent('15');
    expect(screen.getByTestId('rival-current-card')).toHaveTextContent('S.4');
    expect(screen.getByTestId('rival-deck-draw')).toHaveTextContent('3');
    expect(screen.getByTestId('rival-deck-discard')).toHaveTextContent('1');

    const computer = screen.getByTestId('rival-computer');
    expect(within(computer).getAllByTestId('rival-computer-data')).toHaveLength(
      2,
    );
    expect(
      within(computer).getByTestId('seti-desc-publicity-1'),
    ).toBeInTheDocument();
  });

  it('renders revealed objectives, completed pile, and task marker progress', () => {
    render(
      <RivalPanel
        rival={{
          ...createRival(),
          revealedObjectiveIds: ['SOLO.2', 'SOLO.5'],
          completedObjectiveIds: ['SOLO.1'],
          objectiveTaskMarkers: {
            'SOLO.5': [0],
          },
        }}
      />,
    );

    const objectives = screen.getByTestId('rival-objectives');
    expect(objectives).toHaveTextContent('SOLO.2');
    expect(objectives).toHaveTextContent('SOLO.5');
    expect(screen.getByTestId('rival-objective-SOLO.2')).toHaveTextContent(
      '0/1',
    );
    expect(screen.getByTestId('rival-objective-SOLO.5')).toHaveTextContent(
      '1/2',
    );
    expect(screen.getByTestId('rival-completed-objectives')).toHaveTextContent(
      'SOLO.1',
    );
  });
});

function createRival(): IPublicRivalState {
  return {
    rivalPlayerId: 'rival:game-1',
    difficulty: 4,
    progress: 15,
    progressSlot: 3,
    boardConfigId: 'rival-board-3',
    computer: {
      filledSlots: [true, false, true, false, false, false],
      dataPool: 2,
    },
    actionDeck: {
      drawPileSize: 3,
      discardPileSize: 1,
      advancedReserveSize: 4,
      removedCardIds: [],
      currentCardId: 'S.4',
    },
    revealedObjectiveIds: ['SOLO.1', 'SOLO.2'],
    completedObjectiveIds: ['SOLO.1'],
    objectiveTaskMarkers: {},
  };
}
