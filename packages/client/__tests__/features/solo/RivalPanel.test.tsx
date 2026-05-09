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

  it('renders rival progress as a 12-slot image-mode cycle plus deck, computer slots, and reward icons', () => {
    render(<RivalPanel rival={createRival()} />);

    expect(screen.getByTestId('rival-panel')).toBeInTheDocument();
    expect(screen.getByTestId('rival-progress-total')).toHaveTextContent('15');
    const cycle = screen.getByTestId('rival-progress-cycle');
    expect(cycle).toHaveAttribute('data-mode', 'image');
    expect(cycle).toHaveAttribute('data-layout', 'radial-cycle');
    expect(cycle.className).not.toContain('grid-cols-6');
    const slots = within(cycle).getAllByTestId(/rival-progress-slot-/);
    expect(slots).toHaveLength(12);
    expect(slots.map((slot) => slot.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
    ]);
    expect(screen.getByTestId('rival-progress-slot-3')).toHaveAttribute(
      'data-current',
      'true',
    );
    expect(screen.getByTestId('rival-progress-slot-3')).toHaveAttribute(
      'data-fill-mode',
      'background',
    );
    expect(screen.getByTestId('rival-progress-slot-3').style.transform).toEqual(
      expect.stringContaining('rotate('),
    );
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

  it('renders text-mode progress with colored borders instead of filled circles', () => {
    setTextMode(true);

    render(<RivalPanel rival={createRival()} />);

    expect(screen.getByTestId('rival-progress-cycle')).toHaveAttribute(
      'data-mode',
      'text',
    );
    expect(screen.getByTestId('rival-progress-slot-3')).toHaveAttribute(
      'data-fill-mode',
      'border',
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

  it('keeps one-to-one local asset files for configured rival card and objective art', () => {
    expect(RIVAL_ACTION_CARD_IMAGE_SRC_BY_ID['S.4']).toBe(
      '/assets/seti/solo/action-cards/S.4.jpg',
    );
    expect(RIVAL_OBJECTIVE_IMAGE_SRC_BY_ID['SOLO.5']).toBe(
      '/assets/seti/solo/objective-cards/SOLO.5.png',
    );

    const configuredAssetSrcs = [
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
