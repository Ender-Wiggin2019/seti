import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthPage } from '@/pages/auth/AuthPage';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({ isPending: false, mutate: vi.fn() }),
  useRegister: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe('AuthPage', () => {
  it('uses one normal scene image and keeps auth tabs usable', () => {
    render(<AuthPage />);

    expect(screen.getByTestId('auth-scene-image')).toHaveAttribute(
      'src',
      '/assets/seti/sprites/objects_00_00.webp',
    );
    expect(screen.getByTestId('auth-login-submit')).toHaveTextContent(
      'Sign In',
    );

    fireEvent.click(screen.getByTestId('auth-tab-register'));

    expect(screen.getByTestId('auth-register-submit')).toHaveTextContent(
      'Create Account',
    );
  });
});
