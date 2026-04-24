import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
        topTileBonuses:
          tech === ETech.PROBE && level === 0
            ? [
                { type: ETechBonusType.ENERGY },
                { type: ETechBonusType.LAUNCH_IGNORE_LIMIT },
              ]
            : [{ type: ETechBonusType.ENERGY }],
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
        myPlayerId='player-1'
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
        myPlayerId='player-1'
      />,
    );

    expect(screen.getAllByText(/2VP/).length).toBeGreaterThan(0);
  });

  it('shows the visible top tile bonuses', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
      />,
    );

    expect(screen.getByAltText('Launch action bonus')).toBeInTheDocument();
    expect(screen.getAllByAltText('Energy bonus').length).toBeGreaterThan(0);
  });

  it('renders tech tile images without cropping', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
      />,
    );

    expect(screen.getByAltText(/probe level 1/i).className).toContain(
      'object-contain',
    );
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
        myPlayerId='player-1'
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
        myPlayerId='player-1'
      />,
    );

    expect(screen.getByTestId('tech-stack-probe-tech-0').className).toContain(
      'ring-1',
    );
  });

  it('does not highlight already-owned stacks as selectable', () => {
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
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.TECH,
          options: [ETech.PROBE],
        }}
        playerColors={{ 'player-1': 'red' }}
        myPlayerId='player-1'
      />,
    );

    expect(
      screen.getByTestId('tech-stack-probe-tech-0').className,
    ).not.toContain('ring-1');
    expect(screen.getByTestId('tech-stack-probe-tech-1').className).toContain(
      'ring-1',
    );
  });

  it('submits the option input when a tech-id option stack is clicked', () => {
    const onSubmit = vi.fn();
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.OPTION,
          options: [
            {
              id: ETechId.SCAN_EARTH_LOOK,
              label: ETechId.SCAN_EARTH_LOOK,
            },
          ],
        }}
        playerColors={{}}
        myPlayerId='player-1'
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByTestId('tech-stack-scan-tech-0'));

    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.SCAN_EARTH_LOOK,
    });
  });
});
