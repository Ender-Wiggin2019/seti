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
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: ETechId.SCAN_EARTH_LOOK,
    });
  });

  it('maps visible probe and scan stack positions to canonical tech ids', () => {
    const onSubmit = vi.fn();
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.OPTION,
          options: [
            ETechId.PROBE_DOUBLE_PROBE,
            ETechId.PROBE_ASTEROID,
            ETechId.SCAN_EARTH_LOOK,
            ETechId.SCAN_POP_SIGNAL,
          ].map((id) => ({ id, label: id })),
        }}
        playerColors={{}}
        myPlayerId='player-1'
        onSubmit={onSubmit}
      />,
    );

    const probeStacks = screen.getAllByTestId(/^tech-stack-probe-tech-/);
    fireEvent.click(probeStacks[0]);
    expect(onSubmit).toHaveBeenLastCalledWith({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_DOUBLE_PROBE,
    });

    const scanStacks = screen.getAllByTestId(/^tech-stack-scan-tech-/);
    fireEvent.click(scanStacks[1]);
    expect(onSubmit).toHaveBeenLastCalledWith({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: ETechId.SCAN_POP_SIGNAL,
    });
  });

  it('renders canonical tech ids with matching reference tile images', () => {
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={null}
        playerColors={{}}
        myPlayerId='player-1'
      />,
    );

    expect(screen.getByAltText(/probe level 1/i)).toHaveAttribute(
      'src',
      '/assets/seti/tech/tiles/techFly2.webp',
    );
    expect(screen.getByAltText(/probe level 2/i)).toHaveAttribute(
      'src',
      '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp',
    );
    expect(screen.getByAltText(/scan level 2/i)).toHaveAttribute(
      'src',
      '/assets/seti/tech/tiles/techLook4_SE0.4.jpg',
    );
    expect(screen.getByAltText(/scan level 4/i)).toHaveAttribute(
      'src',
      '/assets/seti/tech/tiles/techLook3_SE0.1.webp',
    );
  });

  it('maps visible computer tech slots to the canonical blue tech rewards', () => {
    const onSubmit = vi.fn();
    render(
      <TechBoardView
        techBoard={createTechBoardMock()}
        players={[]}
        pendingInput={{
          inputId: 'input-1',
          type: EPlayerInputType.OPTION,
          options: [
            ETechId.COMPUTER_VP_CREDIT,
            ETechId.COMPUTER_VP_ENERGY,
            ETechId.COMPUTER_VP_CARD,
            ETechId.COMPUTER_VP_PUBLICITY,
          ].map((id) => ({ id, label: id })),
        }}
        playerColors={{}}
        myPlayerId='player-1'
        onSubmit={onSubmit}
      />,
    );

    const computerStacks = screen.getAllByTestId(/^tech-stack-computer-tech-/);

    fireEvent.click(computerStacks[0]);
    expect(onSubmit).toHaveBeenLastCalledWith({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: ETechId.COMPUTER_VP_CREDIT,
    });

    fireEvent.click(computerStacks[2]);
    expect(onSubmit).toHaveBeenLastCalledWith({
      inputId: 'input-1',
      type: EPlayerInputType.OPTION,
      optionId: ETechId.COMPUTER_VP_CARD,
    });
  });
});
