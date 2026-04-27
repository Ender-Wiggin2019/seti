import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGameContext } from '@/pages/game/GameContext';
import {
  EFreeAction,
  EPhase,
  EPlayerInputType,
  ETech,
} from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={rest.to}>{children}</a>
  ),
}));

let mockContextValue: IGameContext;

vi.mock('@/pages/game/GameContext', () => ({
  useGameContext: () => mockContextValue,
}));

function createMockContext(overrides?: Partial<IGameContext>): IGameContext {
  return {
    gameState: createMockGameState(),
    pendingInput: null,
    isConnected: true,
    isMyTurn: true,
    isSpectator: false,
    myPlayerId: 'player-1',
    events: [],
    sendAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendInput: vi.fn(),
    requestUndo: vi.fn(),
    sendEndTurn: vi.fn(),
    ...overrides,
  };
}

function createCard(id: string, name = `Card ${id}`): IBaseCard {
  return {
    id,
    name,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

describe('GameLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = createMockContext();
  });

  async function renderLayout() {
    const { GameLayout } = await import('@/pages/game/GameLayout');
    return render(<GameLayout />);
  }

  it('renders the three main layout areas', async () => {
    await renderLayout();

    expect(screen.getByTestId('bottom-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-hand')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-actions')).toBeInTheDocument();
  });

  it('renders TopBar with round and phase info', async () => {
    await renderLayout();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Action Phase')).toBeInTheDocument();
  });

  it('renders end-turn phase label instead of the raw translation key', async () => {
    mockContextValue = createMockContext({
      gameState: createMockGameState({ phase: EPhase.AWAIT_END_TURN }),
    });

    await renderLayout();

    expect(screen.getByText('End Turn Phase')).toBeInTheDocument();
    expect(
      screen.queryByText('client.top_bar.phases.AWAIT_END_TURN'),
    ).not.toBeInTheDocument();
  });

  it('shows "Your Turn" indicator when it is my turn', async () => {
    mockContextValue = createMockContext({ isMyTurn: true });
    await renderLayout();

    expect(screen.getByText('Your Turn')).toBeInTheDocument();
  });

  it('shows opponent name when it is not my turn', async () => {
    mockContextValue = createMockContext({
      isMyTurn: false,
      gameState: createMockGameState({ currentPlayerId: 'player-2' }),
    });
    await renderLayout();

    expect(screen.getAllByText('Pilot').length).toBeGreaterThanOrEqual(1);
  });

  it('displays spectating badge in spectator mode', async () => {
    mockContextValue = createMockContext({ isSpectator: true });
    await renderLayout();

    expect(screen.getByText('Spectating')).toBeInTheDocument();
  });

  describe('Board Tabs', () => {
    it('renders all 6 board tab triggers', async () => {
      await renderLayout();

      const tabLabels = [
        'Board',
        'Planets',
        'Tech',
        'Cards',
        'Aliens',
        'Scoring',
      ];
      for (const label of tabLabels) {
        expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
      }
    });

    it('defaults to Board tab', async () => {
      await renderLayout();

      const boardTab = screen.getByRole('tab', { name: 'Board' });
      expect(boardTab).toHaveAttribute('aria-selected', 'true');
    });

    it('Board tab shows solar system and sectors together', async () => {
      await renderLayout();

      expect(screen.getByText('Solar System')).toBeInTheDocument();
      expect(screen.getByTestId('solar-space-space-0')).toBeInTheDocument();
    });

    it('switches tab content on click', async () => {
      await renderLayout();

      fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));
      expect(screen.getByText('Tech Board')).toBeInTheDocument();
    });
  });

  describe('Bottom Bar', () => {
    it('displays player resources', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 15, energy: 8, data: 3, publicity: 5 },
            }),
          ],
        }),
      });
      await renderLayout();

      const dashboard = screen.getByTestId('bottom-dashboard');
      const resourceBar = within(dashboard).getByTestId('resource-bar');
      expect(within(resourceBar).getByText('Credits')).toBeInTheDocument();
      expect(within(resourceBar).getByText('Energy')).toBeInTheDocument();
      expect(within(resourceBar).getByText('Publicity')).toBeInTheDocument();
      expect(within(resourceBar).getByText('15')).toBeInTheDocument();
      expect(within(resourceBar).getByText('5')).toBeInTheDocument();
    });

    it('shows hand card count', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({
          players: [
            createMockPlayerState({ playerId: 'player-1', handSize: 7 }),
          ],
        }),
      });
      await renderLayout();

      expect(screen.getByText('7 cards')).toBeInTheDocument();
    });

    it('shows action menu when it is my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      expect(
        screen.getByRole('button', { name: 'Launch Probe' }),
      ).toBeInTheDocument();
    });

    it('shows waiting message when not my turn', async () => {
      mockContextValue = createMockContext({
        isMyTurn: false,
        gameState: createMockGameState({ currentPlayerId: 'player-2' }),
      });
      await renderLayout();

      expect(screen.getByText('Waiting for Pilot...')).toBeInTheDocument();
    });

    it('shows pending input indicator', async () => {
      mockContextValue = createMockContext({
        pendingInput: {
          inputId: 'input-sector',
          type: EPlayerInputType.SECTOR,
          options: ['red-signal'],
        } as unknown as IGameContext['pendingInput'],
      });
      await renderLayout();

      expect(
        screen.getByRole('button', { name: 'red-signal' }),
      ).toBeInTheDocument();
    });

    it('reuses the tech board for tech option input and submits the clicked stack', async () => {
      const sendInput = vi.fn();
      mockContextValue = createMockContext({
        sendInput,
        pendingInput: {
          inputId: 'input-tech',
          type: EPlayerInputType.OPTION,
          options: [
            {
              id: ETechId.SCAN_EARTH_LOOK,
              label: ETechId.SCAN_EARTH_LOOK,
            },
          ],
        } as unknown as IGameContext['pendingInput'],
        gameState: createMockGameState({
          techBoard: {
            stacks: [
              {
                tech: ETech.SCAN,
                level: 0,
                remainingTiles: 4,
                firstTakeBonusAvailable: true,
                topTileBonuses: [{ type: ETechBonusType.DATA_2 }],
              },
            ],
          },
        }),
      });

      await renderLayout();

      const actions = screen.getByTestId('bottom-actions');
      expect(within(actions).getByText('Tech Board')).toBeInTheDocument();

      fireEvent.click(within(actions).getByTestId('tech-stack-scan-tech-0'));

      expect(sendInput).toHaveBeenCalledWith({
        type: EPlayerInputType.OPTION,
        optionId: ETechId.SCAN_EARTH_LOOK,
      });
    });

    it('shows free action bar when it is my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      expect(screen.getByTestId('free-action-bar')).toBeInTheDocument();
    });

    it('arms and ends movement mode from the free action bar', async () => {
      mockContextValue = createMockContext({ isMyTurn: true });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Move Probe (1)' }));

      expect(screen.getByTestId('movement-mode-hint')).toHaveTextContent(
        '1 step',
      );

      fireEvent.click(screen.getByRole('button', { name: 'End Move' }));

      expect(screen.queryByTestId('movement-mode-hint')).not.toBeInTheDocument();
    });

    it('hides free action bar when not my turn', async () => {
      mockContextValue = createMockContext({ isMyTurn: false });
      await renderLayout();

      expect(screen.queryByTestId('free-action-bar')).not.toBeInTheDocument();
    });

    it('opens buy-card chooser and lets player buy from row', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({
        sendFreeAction,
        gameState: createMockGameState({
          cardRow: [createCard('row-1')],
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              resources: { credit: 10, energy: 5, data: 0, publicity: 3 },
            }),
            createMockPlayerState({
              playerId: 'player-2',
              playerName: 'Pilot',
              seatIndex: 1,
              color: 'blue',
            }),
          ],
        }),
      });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Buy From Row' }),
      );

      expect(screen.getByRole('tab', { name: 'Cards' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      fireEvent.click(screen.getByTestId('card-row-row-1'));
      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.BUY_CARD,
        cardId: 'row-1',
      });
    });

    it('opens buy-card chooser and lets player draw from deck directly', async () => {
      const sendFreeAction = vi.fn();
      mockContextValue = createMockContext({ sendFreeAction });
      await renderLayout();

      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
      fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Buy From Deck' }),
      );

      expect(sendFreeAction).toHaveBeenCalledWith({
        type: EFreeAction.BUY_CARD,
        fromDeck: true,
      });
    });
  });

  describe('Sidebar', () => {
    it('opens right drawer and displays opponents in sidebar', async () => {
      await renderLayout();
      fireEvent.click(screen.getByRole('button', { name: 'Event Log' }));

      expect(screen.getByText('Pilot')).toBeInTheDocument();
    });

    it('shows event log section after opening drawer', async () => {
      await renderLayout();
      fireEvent.click(screen.getByRole('button', { name: 'Event Log' }));

      expect(screen.getByText('Event Log')).toBeInTheDocument();
    });
  });

  describe('GameOverDialog', () => {
    it('does not render when game is not over', async () => {
      await renderLayout();

      expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
    });

    it('renders when phase is GAME_OVER', async () => {
      mockContextValue = createMockContext({
        gameState: createMockGameState({ phase: EPhase.GAME_OVER }),
      });
      await renderLayout();

      expect(screen.getAllByText('Game Over').length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Detailed scoring breakdown/),
      ).toBeInTheDocument();
    });
  });
});
