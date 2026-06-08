import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserLayoutSettingsDialog } from '@/features/layout/UserLayoutSettingsDialog';

describe('UserLayoutSettingsDialog', () => {
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
    expect(screen.getByText('Display System')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Custom Display' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Standard Display' }),
    ).toBeInTheDocument();

    expect(screen.queryByText('Game Layout System')).not.toBeInTheDocument();
    expect(screen.queryByText('Configurable')).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy')).not.toBeInTheDocument();
  });
});
