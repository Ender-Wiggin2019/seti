import { DEFAULT_ALIEN_MODULES_ENABLED } from '@seti/common/types/protocol/options';
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

    expect(screen.getByTestId('room-card')).toHaveAttribute(
      'data-panel-scene',
      'card',
    );
    expect(screen.getByTestId('room-card')).toHaveAttribute(
      'data-scene-treatment',
      'single-image',
    );
    expect(screen.getByTestId('room-card-scene-image')).toHaveAttribute(
      'src',
      '/assets/seti/sprites/terrain_01_01.webp',
    );
    expect(screen.getByTestId('room-card-crew-count')).toHaveTextContent('1/1');
    expect(screen.getByText('Solo')).toBeInTheDocument();
    expect(screen.getByText('D3')).toBeInTheDocument();
  });

  it('keeps mission status and module details scanable', () => {
    render(
      <RoomCard
        room={{
          ...createRoom(),
          id: 'room-2',
          name: 'Configured Room 1779040598246',
          status: ERoomStatus.PLAYING,
          options: {
            ...createRoom().options,
            isSoloMode: false,
            playerCount: 2,
            timerPerTurn: 90,
          },
        }}
      />,
    );

    expect(screen.getByTestId('room-card-status')).toHaveTextContent(
      'In Progress',
    );
    expect(screen.getByTestId('room-card-host')).toHaveTextContent('Commander');
    expect(screen.getByTestId('room-card-crew-count')).toHaveTextContent('1/2');
    expect(screen.getByTestId('room-card-module-readout')).toHaveTextContent(
      'Aliens',
    );
    expect(screen.getByTestId('room-card-module-readout')).toHaveTextContent(
      '90s timer',
    );
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
      alienModulesEnabled: DEFAULT_ALIEN_MODULES_ENABLED,
      undoAllowed: true,
      timerPerTurn: 0,
      expansions: [],
    },
    gameId: null,
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  };
}
