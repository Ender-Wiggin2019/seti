import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePage } from '@/pages/profile/ProfilePage';

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/features/layout/UserLayoutSettingsDialog', () => ({
  UserLayoutSettingsDialog: () => null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useCurrentUser: () => ({
    data: {
      id: 'member-1234567890',
      name: 'Commander',
      email: 'commander@mars.gov',
      createdAt: '2026-05-20T00:00:00.000Z',
    },
    isLoading: false,
  }),
  useUpdateProfile: () => ({ isPending: false, mutate: mocks.updateProfile }),
  useLogout: () => mocks.logout,
}));

describe('ProfilePage', () => {
  it('renders the profile scene while preserving account controls', () => {
    render(<ProfilePage />);

    expect(screen.getByTestId('profile-scene')).toHaveAttribute(
      'data-scene-treatment',
      'single-image',
    );
    expect(screen.getByTestId('profile-scene-image')).toHaveAttribute(
      'src',
      '/assets/seti/sprites/terrain_00_02.webp',
    );
    expect(screen.getAllByText('commander@mars.gov').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Commander').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Callsign')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });
});
