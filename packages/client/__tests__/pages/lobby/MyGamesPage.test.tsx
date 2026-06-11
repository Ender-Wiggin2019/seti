import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ERoomStatus, type IRoom } from '@/api/types';
import { MyGamesPage } from '@/pages/lobby/MyGamesPage';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    isLoading: false,
    data: {
      items: [createHiddenSoloRoom()],
      page: 1,
      pageSize: 12,
      total: 1,
      totalPlayers: 1,
      totalPages: 1,
      hasMore: false,
    },
  }),
}));

describe('MyGamesPage', () => {
  it('shows hidden solo rooms that are absent from the public lobby', () => {
    render(<MyGamesPage />);

    expect(screen.getByTestId('my-games-page')).toBeInTheDocument();
    expect(screen.getByText('Hidden Solo')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
    expect(screen.getByText('Solo')).toBeInTheDocument();
  });
});

function createHiddenSoloRoom(): IRoom {
  return {
    id: 'room-1',
    name: 'Hidden Solo',
    hostId: 'p1',
    status: ERoomStatus.WAITING,
    players: [
      {
        id: 'p1',
        name: 'Commander',
        seatIndex: 0,
        ready: true,
        isHost: true,
      },
    ],
    options: {
      playerCount: 2,
      isSoloMode: true,
      soloDifficulty: 3,
      alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
      undoAllowed: true,
      timerPerTurn: 0,
      expansions: [],
    },
    visibleInLobby: false,
    gameId: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  };
}
