import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ETechId } from '@seti/common/types/tech';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RivalPanel } from '@/features/solo';
import { RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID } from '@/features/solo/rivalActionCardPresentation';
import { RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID } from '@/features/solo/rivalObjectivePresentation';
import { useDebugStore } from '@/stores/debugStore';
import type { IPublicRivalState } from '@/types/re-exports';

describe('RivalPanel', () => {
  afterEach(() => {
    setTextMode(false);
  });

  it('renders image-mode rival board with the reference board art and data-driven overlays', () => {
    render(
      <RivalPanel
        rival={createRival()}
        rivalTechs={[
          ETechId.PROBE_DOUBLE_PROBE,
          ETechId.SCAN_EARTH_LOOK,
          ETechId.COMPUTER_VP_CARD,
        ]}
      />,
    );

    expect(screen.getByTestId('rival-panel')).toBeInTheDocument();
    const board = screen.getByTestId('rival-board-image-mode');
    expect(board).toHaveAttribute('data-board-config-id', 'rival-board-3');
    expect(board).toHaveAttribute('data-reference-layout', 'automa-board');
    expect(screen.getByTestId('rival-board-image')).toHaveAttribute(
      'src',
      '/assets/seti/solo/boards/rival-board-3.jpg',
    );
    expect(
      screen.queryByTestId('rival-progress-cycle'),
    ).not.toBeInTheDocument();

    expect(screen.getByTestId('rival-progress-total')).toHaveTextContent('15');
    const marker = screen.getByTestId('rival-board-progress-marker');
    expect(marker).toHaveAttribute('data-slot', '3');
    expect(marker).toHaveAttribute('data-reference-x', '87.85');
    expect(marker).toHaveAttribute('data-reference-y', '65.39');

    expect(screen.getByTestId('rival-current-card')).toHaveTextContent('S.4');
    expect(screen.getByTestId('rival-deck-draw')).toHaveTextContent('3');
    expect(screen.getByTestId('rival-deck-discard')).toHaveTextContent('1');
    expect(screen.getByTestId('rival-board-action-deck')).toHaveTextContent(
      '3',
    );
    expect(screen.getByTestId('rival-board-data-pool')).toHaveAttribute(
      'data-count',
      '2',
    );

    const computer = screen.getByTestId('rival-computer');
    expect(within(computer).getAllByTestId('rival-computer-data')).toHaveLength(
      2,
    );
    expect(screen.getByTestId('rival-computer-slot-0')).toHaveAttribute(
      'data-filled',
      'true',
    );
    expect(screen.getByTestId('rival-computer-slot-1')).toHaveAttribute(
      'data-filled',
      'false',
    );
    expect(
      within(computer).getByTestId('seti-desc-publicity-1'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId(/^rival-board-tech-/)).toHaveLength(3);
  });

  it('uses rival-owned tech ids from the public rival state by default', () => {
    render(
      <RivalPanel
        rival={
          {
            ...createRival(),
            techIds: [
              ETechId.PROBE_DOUBLE_PROBE,
              ETechId.SCAN_EARTH_LOOK,
              ETechId.SCAN_POP_SIGNAL,
              ETechId.COMPUTER_VP_CARD,
            ],
          } as IPublicRivalState
        }
      />,
    );

    const pile = screen.getByTestId('rival-tech-pile');
    expect(
      within(pile).getByTestId('rival-tech-count-probe'),
    ).toHaveTextContent('1');
    expect(within(pile).getByTestId('rival-tech-count-scan')).toHaveTextContent(
      '2',
    );
    expect(
      within(pile).getByTestId('rival-tech-count-computer'),
    ).toHaveTextContent('1');
  });

  it('renders computer slot rewards from the public rival state', () => {
    render(
      <RivalPanel
        rival={
          {
            ...createRival(),
            computer: {
              filledSlots: [false, false, false, false, false, false],
              dataPool: 0,
              slotRewards: [
                null,
                { type: 'VP', amount: 3 },
                null,
                null,
                null,
                null,
              ],
            },
          } as IPublicRivalState
        }
      />,
    );

    const computer = screen.getByTestId('rival-computer');
    expect(
      within(computer).getByTestId('rival-reward-score-3'),
    ).toBeInTheDocument();
    expect(
      within(computer).queryByTestId('rival-reward-publicity-1'),
    ).not.toBeInTheDocument();
  });

  it('renders all six computer slots even if the filled-slot array is short', () => {
    render(
      <RivalPanel
        rival={
          {
            ...createRival(),
            computer: {
              filledSlots: [true, false],
              dataPool: 0,
              slotRewards: [null, null, null, null, null, null],
            },
          } as IPublicRivalState
        }
      />,
    );

    expect(screen.getAllByTestId(/^rival-computer-slot-/)).toHaveLength(6);
    expect(screen.getByTestId('rival-computer-slot-0')).toHaveAttribute(
      'data-filled',
      'true',
    );
    expect(screen.getByTestId('rival-computer-slot-2')).toHaveAttribute(
      'data-filled',
      'false',
    );
  });

  it('shows the full image-mode data-pool count when token positions are capped', () => {
    render(
      <RivalPanel
        rival={{
          ...createRival(),
          computer: {
            ...createRival().computer,
            dataPool: 8,
          },
        }}
      />,
    );

    expect(screen.getByTestId('rival-board-data-pool')).toHaveAttribute(
      'aria-label',
      'Rival data pool: 8',
    );
    expect(screen.getByTestId('rival-board-data-pool-count')).toHaveTextContent(
      '8',
    );
  });

  it('renders text-mode progress with colored borders instead of filled circles', () => {
    setTextMode(true);

    render(<RivalPanel rival={createRival()} />);

    expect(screen.getByTestId('rival-progress-cycle')).toHaveAttribute(
      'data-mode',
      'text',
    );
    expect(
      screen.queryByTestId('rival-board-image-mode'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('rival-progress-slot-3')).toHaveAttribute(
      'data-fill-mode',
      'border',
    );
    expect(screen.getByTestId('rival-computer-data-pool')).toHaveAttribute(
      'data-count',
      '2',
    );
  });

  it('counts rival-owned tech by category in a tech pile', () => {
    render(
      <RivalPanel
        rival={createRival()}
        rivalTechs={[
          ETechId.PROBE_DOUBLE_PROBE,
          ETechId.SCAN_EARTH_LOOK,
          ETechId.SCAN_POP_SIGNAL,
          ETechId.COMPUTER_VP_CARD,
        ]}
      />,
    );

    const pile = screen.getByTestId('rival-tech-pile');
    expect(
      within(pile).getByTestId('rival-tech-count-probe'),
    ).toHaveTextContent('1');
    expect(within(pile).getByTestId('rival-tech-count-scan')).toHaveTextContent(
      '2',
    );
    expect(
      within(pile).getByTestId('rival-tech-count-computer'),
    ).toHaveTextContent('1');
  });

  it('opens the multilingual rival rules dialog from the panel header', () => {
    render(<RivalPanel rival={createRival()} />);

    fireEvent.click(screen.getByTestId('rival-rules-button'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('rival-rules-dialog')).toHaveTextContent(
      'Rival rules',
    );
    expect(screen.getByTestId('rival-rules-dialog')).toHaveTextContent(
      'progress',
    );
    expect(screen.getByTestId('rival-rules-dialog')).toHaveTextContent(
      'objectives',
    );
  });

  it('renders current rival action cards as images when art is configured', () => {
    render(<RivalPanel rival={createRival()} />);

    expect(screen.getByTestId('rival-action-card-image-S.4')).toHaveAttribute(
      'src',
      '/assets/seti/solo/action-cards/S.4.jpg',
    );
    expect(
      screen.queryByTestId('rival-action-card-text-S.4'),
    ).not.toBeInTheDocument();
  });

  it('renders scan action cards as images in image mode', () => {
    render(
      <RivalPanel
        rival={{
          ...createRival(),
          actionDeck: {
            ...createRival().actionDeck,
            currentCardId: 'S.2',
          },
        }}
      />,
    );

    expect(screen.getByTestId('rival-action-card-image-S.2')).toHaveAttribute(
      'src',
      '/assets/seti/solo/action-cards/S.2.jpg',
    );
    expect(
      screen.queryByTestId('rival-action-card-text-S.2'),
    ).not.toBeInTheDocument();
  });

  it('renders current rival action cards through the independent text card in text mode', () => {
    setTextMode(true);

    render(<RivalPanel rival={createRival()} />);

    const card = screen.getByTestId('rival-action-card-text-S.4');
    expect(card).toHaveTextContent('S.4');
    expect(card).toHaveTextContent(/Research tech/i);
    expect(
      screen.queryByTestId('rival-action-card-image-S.4'),
    ).not.toBeInTheDocument();
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

  it('renders objective cards as images in image mode', () => {
    render(
      <RivalPanel
        rival={{
          ...createRival(),
          revealedObjectiveIds: ['SOLO.5'],
          objectiveTaskMarkers: {},
        }}
      />,
    );

    expect(screen.getByTestId('rival-objective-image-SOLO.5')).toHaveAttribute(
      'src',
      '/assets/seti/solo/objective-cards/SOLO.5.png',
    );
  });

  it('keeps exact objective task markers in image mode', () => {
    render(
      <RivalPanel
        rival={{
          ...createRival(),
          revealedObjectiveIds: ['SOLO.5'],
          objectiveTaskMarkers: { 'SOLO.5': [1] },
        }}
      />,
    );

    expect(screen.getByTestId('rival-objective-SOLO.5')).toHaveTextContent(
      '1/2',
    );
    expect(
      screen.getByTestId('rival-objective-marker-SOLO.5-0'),
    ).toHaveAttribute('data-marked', 'false');
    expect(
      screen.getByTestId('rival-objective-marker-SOLO.5-1'),
    ).toHaveAttribute('data-marked', 'true');
  });

  it('renders objective cards through the independent text card in text mode', () => {
    setTextMode(true);

    render(
      <RivalPanel
        rival={{
          ...createRival(),
          revealedObjectiveIds: ['SOLO.5'],
          objectiveTaskMarkers: { 'SOLO.5': [0] },
        }}
      />,
    );

    const card = screen.getByTestId('rival-objective-text-card-SOLO.5');
    expect(card).toHaveTextContent('SOLO.5');
    expect(card).toHaveTextContent(/Probe tech/i);
    expect(card).toHaveTextContent('1/2');
    expect(
      screen.queryByTestId('rival-objective-image-SOLO.5'),
    ).not.toBeInTheDocument();
  });

  it('places image-mode tech overlays according to the rival board category order', () => {
    const cases = [
      {
        boardConfigId: 'rival-board-1',
        order: ['computer', 'scan', 'probe'],
      },
      {
        boardConfigId: 'rival-board-2',
        order: ['scan', 'probe', 'computer'],
      },
      {
        boardConfigId: 'rival-board-3',
        order: ['computer', 'scan', 'probe'],
      },
      {
        boardConfigId: 'rival-board-4',
        order: ['probe', 'computer', 'scan'],
      },
    ] as const;
    const slotXs = ['20%', '35%', '50%'];

    for (const { boardConfigId, order } of cases) {
      const { unmount } = render(
        <RivalPanel
          rival={{
            ...createRival(),
            boardConfigId,
          }}
          rivalTechs={[
            ETechId.PROBE_DOUBLE_PROBE,
            ETechId.SCAN_EARTH_LOOK,
            ETechId.COMPUTER_VP_CARD,
          ]}
        />,
      );

      order.forEach((category, index) => {
        const tile = screen.getByTestId(`rival-board-tech-${category}`);
        expect(tile).toHaveStyle({
          left: slotXs[index],
          top: '30%',
        });
      });
      unmount();
    }
  });

  it('keeps one-to-one local asset files for configured rival card and objective art', () => {
    expect(RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID['S.4']).toBe(
      '/assets/seti/solo/action-cards/S.4.jpg',
    );
    expect(RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID['SOLO.5']).toBe(
      '/assets/seti/solo/objective-cards/SOLO.5.png',
    );

    const configuredAssetSrcs = [
      '/assets/seti/solo/boards/rival-board-1.jpg',
      '/assets/seti/solo/boards/rival-board-2.jpg',
      '/assets/seti/solo/boards/rival-board-3.jpg',
      '/assets/seti/solo/boards/rival-board-4.jpg',
      ...Object.values(RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID),
      ...Object.values(RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID),
    ].filter((src): src is string => typeof src === 'string');

    for (const src of configuredAssetSrcs) {
      expect(existsSync(resolvePublicAsset(src)), src).toBe(true);
    }
  });
});

function resolvePublicAsset(src: string): string {
  const root = existsSync(join(process.cwd(), 'packages/client/public'))
    ? join(process.cwd(), 'packages/client/public')
    : join(process.cwd(), 'public');
  return join(root, src.replace(/^\//, ''));
}

function setTextMode(enabled: boolean): void {
  act(() => {
    useDebugStore.setState({ textMode: enabled });
  });
}

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
      slotRewards: [
        null,
        { type: 'PUBLICITY', amount: 1 },
        null,
        { type: 'CUSTOM', effectId: 'RIVAL_PROGRESS_4' },
        null,
        null,
      ],
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
    techIds: [],
  };
}
