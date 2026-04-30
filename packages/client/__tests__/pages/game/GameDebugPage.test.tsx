import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameDebugPage } from '@/pages/game/GameDebugPage';
import { useDebugStore } from '@/stores/debugStore';

vi.mock('@/hooks/useServerDebugSession', () => ({
  useServerDebugSession: () => null,
}));

vi.mock('@/pages/game/GameLayout', () => ({
  GameLayout: () => <div data-testid='debug-game-layout' />,
}));

describe('GameDebugPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDebugStore.setState({ textMode: false });
  });

  it('toggles text mode from the debug toolbar without leaving the page', () => {
    render(<GameDebugPage />);

    expect(useDebugStore.getState().textMode).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Text Mode Off' }));

    expect(useDebugStore.getState().textMode).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Text Mode On' }),
    ).toBeInTheDocument();
  });
});
