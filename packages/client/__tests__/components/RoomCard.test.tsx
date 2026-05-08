import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ERoomStatus, type IRoom } from '@/api/types';
import { RoomCard } from '@/components/RoomCard';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

describe('RoomCard', () => {
  it('counts only the required human player in solo rooms', () => {
    render(<RoomCard room={createRoom()} />);

    expect(screen.getByTestId('room-card-crew-count')).toHaveTextContent('1/1');
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('D3')).toBeInTheDocument();
  });
});

function createRoom(): IRoom {
  return {
    id: 'room-1',
    name: 'Solo Trial',
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
      alienModulesEnabled: [true, true, false, false, false],
      undoAllowed: true,
      timerPerTurn: 0,
    },
    gameId: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  };
}
