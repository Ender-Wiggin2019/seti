import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutStore } from '@/features/layout/layoutStore';
import { UserLayoutSettingsDialog } from '@/features/layout/UserLayoutSettingsDialog';

describe('UserLayoutSettingsDialog', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetAll();
  });

  it('presents layout controls as a player-facing mission display surface', () => {
    render(<UserLayoutSettingsDialog open onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Mission Display' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose how the game table is arranged. Changes are saved on this device.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Current Display')).toBeInTheDocument();
    expect(screen.getByText('Table Layout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tab' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Waterfall' }),
    ).toBeInTheDocument();

    expect(screen.queryByText('Display System')).not.toBeInTheDocument();
    expect(screen.queryByText('Custom Display')).not.toBeInTheDocument();
    expect(screen.queryByText('Standard Display')).not.toBeInTheDocument();
    expect(screen.queryByText('Game Layout System')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurable')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy')).not.toBeInTheDocument();
  });
});
