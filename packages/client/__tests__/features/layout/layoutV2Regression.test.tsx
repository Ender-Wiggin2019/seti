import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameSessionProvider } from '@/features/layout/GameSessionContext';
import { useLayoutStore } from '@/features/layout/layoutStore';
import { ActionBarSection } from '@/features/layout/sections/ActionBarSection';
import { SectionFrame } from '@/features/layout/shells/SectionFrame';
import type { IGameContext } from '@/pages/game/GameContext';
import { EMainAction, EPlayerInputType } from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

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
    sendAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendInput: vi.fn(),
    requestUndo: vi.fn(),
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

describe('layout V2 regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLayoutStore.getState().resetAll();
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

  it('renders generic pending input controls in V2 action bar', () => {
    mockContextValue = createMockContext({
      pendingInput: {
        inputId: 'resource-input',
        type: EPlayerInputType.RESOURCE,
        title: 'Choose resource',
        options: [EResource.CREDIT],
      },
    });

    renderActionBar();

    expect(screen.getByText('Select resource')).toBeInTheDocument();
    expect(
      screen.queryByTestId(`action-menu-${EMainAction.PASS}`),
    ).not.toBeInTheDocument();
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
});
