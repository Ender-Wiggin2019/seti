import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IGameContext } from '@/pages/game/GameContext';
import { createMockGameState } from '../../../test/mocks/gameState';

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ gameId: 'game-test-1' }),
  Link: ({ children, ...rest }: { children: React.ReactNode; to: string }) => (
    <a href={rest.to}>{children}</a>
  ),
}));

let mockContextValue: IGameContext;

vi.mock('@/pages/game/GameContext', () => ({
  GameContextProvider: ({
    children,
    gameId,
  }: {
    children: React.ReactNode;
    gameId: string;
  }) => (
    <div data-testid='game-context-provider' data-game-id={gameId}>
      {children}
    </div>
  ),
  useGameContext: () => mockContextValue,
}));

vi.mock('@/pages/game/GameLayout', () => ({
  GameLayout: () => <div data-testid='game-layout'>Game Layout</div>,
}));

function createMockContext(overrides?: Partial<IGameContext>): IGameContext {
  return {
    gameState: null,
    pendingInput: null,
    isConnected: false,
    isMyTurn: false,
    isSpectator: false,
    myPlayerId: 'player-1',
    events: [],
    sendAction: vi.fn(),
    sendFreeAction: vi.fn(),
    sendInput: vi.fn(),
    requestUndo: vi.fn(),
    ...overrides,
  };
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = createMockContext();
  });

  it('wraps content in GameContextProvider with correct gameId', async () => {
    const { GamePage } = await import('@/pages/game/GamePage');
    render(<GamePage />);

    const provider = screen.getByTestId('game-context-provider');
    expect(provider).toBeInTheDocument();
    expect(provider).toHaveAttribute('data-game-id', 'game-test-1');
  });

  it('shows loading spinner when not connected', async () => {
    mockContextValue = createMockContext({ isConnected: false });
    const { GamePage } = await import('@/pages/game/GamePage');
    render(<GamePage />);

    expect(
      screen.getByText('Establishing secure connection...'),
    ).toBeInTheDocument();
  });

  it('shows loading when connected but no game state', async () => {
    mockContextValue = createMockContext({
      isConnected: true,
      gameState: null,
    });
    const { GamePage } = await import('@/pages/game/GamePage');
    render(<GamePage />);

    expect(screen.getByText('Awaiting mission data...')).toBeInTheDocument();
  });

  it('renders GameLayout when connected with game state', async () => {
    mockContextValue = createMockContext({
      isConnected: true,
      gameState: createMockGameState(),
    });
    const { GamePage } = await import('@/pages/game/GamePage');
    render(<GamePage />);

    expect(screen.getByTestId('game-layout')).toBeInTheDocument();
  });
});

describe('SpectatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = createMockContext({
      isConnected: true,
      gameState: createMockGameState(),
    });
  });

  it('wraps content in GameContextProvider', async () => {
    const { SpectatePage } = await import('@/pages/game/GamePage');
    render(<SpectatePage />);

    expect(screen.getByTestId('game-context-provider')).toBeInTheDocument();
  });
});
