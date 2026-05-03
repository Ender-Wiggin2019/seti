import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameOverDialog } from '@/pages/game/GameOverDialog';
import { EPhase } from '@/types/re-exports';
import { createMockGameState } from '../../../test/mocks/gameState';

const mockUseGameContext = vi.fn();

vi.mock('@/pages/game/GameContext', () => ({
  useGameContext: () => mockUseGameContext(),
}));

describe('GameOverDialog', () => {
  it('does not render when game is not over', () => {
    mockUseGameContext.mockReturnValue({
      gameState: createMockGameState({ phase: EPhase.AWAIT_MAIN_ACTION }),
    });
    render(<GameOverDialog />);

    expect(screen.queryByText('Game Over')).not.toBeInTheDocument();
  });

  it('renders scoring panel in game over phase', () => {
    mockUseGameContext.mockReturnValue({
      gameState: createMockGameState({ phase: EPhase.GAME_OVER }),
    });
    render(<GameOverDialog />);

    expect(screen.getByText('Game Over')).toBeInTheDocument();
    expect(screen.getByText(/Winner:/)).toBeInTheDocument();
    expect(screen.getByText(/Detailed scoring breakdown/)).toBeInTheDocument();
  });

  it('renders server final scoring breakdown and gold scoring tiles', () => {
    mockUseGameContext.mockReturnValue({
      gameState: createMockGameState({
        phase: EPhase.GAME_OVER,
        players: [
          createMockGameState().players[0],
          createMockGameState().players[1],
        ].map((player) =>
          player.playerId === 'player-1'
            ? { ...player, score: 47 }
            : { ...player, score: 28 },
        ),
        finalScoringResult: {
          scores: { 'player-1': 47, 'player-2': 28 },
          breakdown: {
            'player-1': {
              endGameCards: 7,
              goldTiles: 10,
              alienBonus: 2,
              totalAdded: 19,
              finalScore: 47,
            },
            'player-2': {
              endGameCards: 0,
              goldTiles: 0,
              alienBonus: 0,
              totalAdded: 0,
              finalScore: 28,
            },
          },
          winnerIds: ['player-1'],
        },
        goldScoringTiles: [
          {
            id: 'mission',
            side: 'A',
            slotValues: [5, 4, 3, 2],
            claims: [{ playerId: 'player-1', value: 5 }],
          },
        ],
      }),
    });

    render(<GameOverDialog />);

    expect(screen.getAllByText('Commander')).not.toHaveLength(0);
    expect(screen.getAllByText('28')).not.toHaveLength(0);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('47 👑')).toBeInTheDocument();
    expect(screen.getByTestId('gold-tile-mission')).toHaveTextContent(
      'mission A',
    );
    expect(screen.getByTestId('gold-tile-mission')).toHaveTextContent('3');
  });
});
