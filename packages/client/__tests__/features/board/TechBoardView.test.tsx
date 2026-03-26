import { ETechId } from '@seti/common/types/tech';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TechBoardView } from '@/features/board/TechBoardView';
import type { IPublicPlayerState, IPublicTechBoard } from '@/types/re-exports';
import { EPlayerInputType, ETech } from '@/types/re-exports';
import { createMockPlayerState } from '../../../test/mocks/gameState';

function createTechBoardMock(): IPublicTechBoard {
  return {
    stacks: [ETech.PROBE, ETech.SCAN, ETech.COMPUTER].flatMap((tech) =>
      Array.from({ length: 4 }, (_, level) => ({
        tech,
        level,
        remainingTiles: 4 - level,
        firstTakeBonusAvailable: level !== 0,
      })),
    ),
  };
}

describe('TechBoardView', () => {
  it('renders all 12 stacks', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    expect(screen.getAllByTestId(/^tech-stack-/)).toHaveLength(12);
  });

  it('shows 2VP availability status', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={null}
        playerColors={{}}
      />,
    );

    expect(screen.getAllByText(/2VP taken/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2VP available/).length).toBeGreaterThan(0);
  });

  it('renders taken markers from player tech list', () => {
    const players: IPublicPlayerState[] = [
      createMockPlayerState({
        playerId: 'player-1',
        techs: [ETechId.PROBE_DOUBLE_PROBE],
      }),
    ];

    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={players}
        pendingInput={null}
        playerColors={{ 'player-1': 'red' }}
      />,
    );

    expect(screen.getByTitle('player-1')).toBeInTheDocument();
  });

  it('highlights selectable tech stacks', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.TECH,
          options: [ETech.PROBE],
        }}
        playerColors={{}}
      />,
    );

    expect(screen.getByTestId('tech-stack-probe-tech-0').className).toContain(
      'ring-1',
    );
  });
});
