import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '@/components/ui/toast';
import { EMPTY_ANIMATION_RENDER_STATE } from '@/features/board/animation/animationController';
import { GameLayoutV2 } from '@/features/layout/GameLayoutV2';
import {
  GameSessionProvider,
  useGameSession,
} from '@/features/layout/GameSessionContext';
import { useLayoutStore } from '@/features/layout/layoutStore';
import { ActionBarSection } from '@/features/layout/sections/ActionBarSection';
import { SectionFrame } from '@/features/layout/shells/SectionFrame';
import type { IGameContext } from '@/pages/game/GameContext';
import {
  EAlienType,
  EFreeAction,
  EGameEventType,
  EMainAction,
  EPhase,
  EPlayerInputType,
} from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';
import { playerEventBase, systemEventBase } from '../../helpers/gameEvents';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={rest.to}>{children}</a>
  ),
}));

vi.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ResizableHandle: (): React.JSX.Element => <div />,
}));

let mockContextValue: IGameContext;

vi.mock('@/pages/game/GameContext', () => ({
  useGameContext: () => mockContextValue,
}));

function createCard(id: string, overrides?: Partial<IBaseCard>): IBaseCard {
  return {
    id,
    name: `Card ${id}`,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
    ...overrides,
  };
}

function createMockContext(overrides?: Partial<IGameContext>): IGameContext {
  return {
    gameState: createMockGameState(),
    pendingInput: null,
    isConnected: true,
    isMyTurn: true,
    isSpectator: false,
    myPlayerId: 'player-1',
    events: [],
    animationRenderState: EMPTY_ANIMATION_RENDER_STATE,
    sendAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendInput: vi.fn(),
    requestUndo: vi.fn(),
    resync: vi.fn(),
    sendEndTurn: vi.fn(),
    ...overrides,
  };
}

function renderActionBar(): void {
  render(
    <GameSessionProvider>
      <ActionBarSection
        section={{ id: 'actionBar', pin: 'sticky-top', visible: true }}
      />
    </GameSessionProvider>,
  );
}

function MovementModeHarness(): React.JSX.Element {
  const { setMovementModeActive } = useGameSession();
  useEffect(() => {
    setMovementModeActive(true);
  }, [setMovementModeActive]);
  return (
    <ActionBarSection
      section={{ id: 'actionBar', pin: 'sticky-top', visible: true }}
    />
  );
}

function renderMovementModeHarness(): void {
  render(
    <GameSessionProvider>
      <MovementModeHarness />
    </GameSessionProvider>,
  );
}

describe('layout V2 regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLayoutStore.getState().resetAll();
    useToastStore.setState({ toasts: [] });
    mockContextValue = createMockContext();
  });

  it('plays the only playable hand card instead of sending a bare PLAY_CARD action', () => {
    const sendAction = vi.fn();
    mockContextValue = createMockContext({
      sendAction,
      gameState: createMockGameState({
        players: [
          createMockPlayerState({
            playerId: 'player-1',
            handSize: 1,
            hand: [createCard('single-playable')],
          }),
        ],
      }),
    });

    renderActionBar();
    fireEvent.click(screen.getByTestId(`action-menu-${EMainAction.PLAY_CARD}`));

    expect(sendAction).toHaveBeenCalledWith({
      type: EMainAction.PLAY_CARD,
      payload: { cardIndex: 0 },
    });
  });

  it('renders generic pending input controls in the V2 modal prompt', () => {
    mockContextValue = createMockContext({
      pendingInput: {
        inputId: 'resource-input',
        type: EPlayerInputType.RESOURCE,
        title: 'Choose resource',
        options: [EResource.CREDIT],
      },
    });

    renderActionBar();

    expect(screen.getByTestId('pending-input-modal')).toBeInTheDocument();
    expect(screen.getByText('Select resource')).toBeInTheDocument();
    expect(
      screen.queryByTestId(`action-menu-${EMainAction.PASS}`),
    ).not.toBeInTheDocument();
  });

  it('clears movement mode when transient pending input leaves no movement points', async () => {
    mockContextValue = createMockContext({
      gameState: createMockGameState({
        phase: EPhase.IN_RESOLUTION,
        players: [
          createMockPlayerState({
            playerId: 'player-1',
            movementPoints: 0,
            resources: {
              [EResource.CREDIT]: 8,
              [EResource.ENERGY]: 1,
              [EResource.DATA]: 2,
              [EResource.PUBLICITY]: 4,
              [EResource.SIGNAL_TOKEN]: 0,
            },
          }),
        ],
      }),
      pendingInput: {
        inputId: 'resource-input',
        type: EPlayerInputType.RESOURCE,
        title: 'Choose resource',
        options: [EResource.CREDIT],
      },
    });

    renderMovementModeHarness();

    expect(screen.getByTestId('pending-input-modal')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByTestId('movement-mode-hint'),
      ).not.toBeInTheDocument();
    });
  });

  it('keeps one section crash inside its frame', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // React reports boundary-caught errors to the console in tests.
    });
    const Broken = (): React.JSX.Element => {
      throw new Error('section exploded');
    };

    render(
      <SectionFrame section={{ id: 'log', pin: 'none', visible: true }}>
        <Broken />
      </SectionFrame>,
    );

    expect(screen.getByText('Section failed to render.')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('shows the alien discovery notice in V2', async () => {
    mockContextValue = createMockContext({
      events: [
        {
          ...systemEventBase({ id: 'alien-found-1' }),
          type: EGameEventType.ALIEN_DISCOVERED,
          alienType: EAlienType.ANOMALIES,
          alienIndex: 0,
        },
      ],
    });

    render(<GameLayoutV2 />);

    expect(await screen.findByTestId('alien-found-dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Alien Anomalies is Found!' }),
    ).toBeInTheDocument();
  });

  it('toasts unhandled custom card effects in V2', async () => {
    mockContextValue = createMockContext({
      events: [
        {
          ...playerEventBase('player-1', {
            id: 'unhandled-custom-1',
            seq: 1,
          }),
          type: EGameEventType.ACTION,
          action: 'CARD_CUSTOM_EFFECT_UNHANDLED',
          details: { cardId: 'C.001', customId: 'CUSTOM_TEST' },
        },
      ],
    });

    render(<GameLayoutV2 />);

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Card effect not available',
            description:
              'Custom effect "CUSTOM_TEST" on card C.001 was skipped. The game continued.',
          }),
        ]),
      );
    });
  });

  it('keeps event log access available after switching away from the board tab', () => {
    render(<GameLayoutV2 />);

    fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));

    expect(screen.getByRole('button', { name: /intel/i })).toBeInTheDocument();
  });

  it('jumps to the card tab for buy-card and confirms row purchases there', async () => {
    const sendFreeAction = vi.fn();
    mockContextValue = createMockContext({
      sendFreeAction,
      gameState: createMockGameState({
        cardRow: [createCard('row-1')],
        players: [
          createMockPlayerState({
            playerId: 'player-1',
            resources: {
              [EResource.CREDIT]: 8,
              [EResource.ENERGY]: 2,
              [EResource.DATA]: 0,
              [EResource.PUBLICITY]: 3,
            },
          }),
        ],
      }),
    });

    render(<GameLayoutV2 />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buy Card (3 PR)' }));

    expect(screen.getByRole('tab', { name: 'Cards' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const chooser = screen.getByTestId('cards-tab-buy-chooser');
    fireEvent.click(within(chooser).getByTestId('cards-tab-buy-from-row'));
    fireEvent.click(screen.getByTestId('card-row-row-1'));

    const confirmDialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirmDialog).getByRole('button', { name: 'Confirm' }),
    );

    expect(sendFreeAction).toHaveBeenCalledWith({
      type: EFreeAction.BUY_CARD,
      cardId: 'row-1',
    });
  });

  it('passes tucked income through the V2 player board section', () => {
    mockContextValue = createMockContext({
      gameState: createMockGameState({
        players: [
          createMockPlayerState({
            playerId: 'player-1',
            creditIncome: 3,
            energyIncome: 2,
            cardIncome: 1,
            tuckedCreditIncome: 2,
            tuckedEnergyIncome: 1,
            tuckedCardIncome: 1,
          }),
        ],
      }),
    });

    render(<GameLayoutV2 />);

    expect(screen.getAllByTestId('income-tucked-suffix')).toHaveLength(3);
  });
});
