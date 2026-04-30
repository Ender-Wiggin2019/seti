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
});
