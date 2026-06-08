import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProbeToken } from '@/features/board/ProbeToken';

describe('ProbeToken', () => {
  it('renders the printed probe art for matching player colors', () => {
    render(<ProbeToken playerColor='purple' />);

    const image = screen.getByRole('img', { name: 'purple probe' });
    expect(image).toHaveAttribute(
      'src',
      '/assets/seti/tokens/probes/purpleProbe.png',
    );
  });

  it('shows a centered count when multiple probes are stacked', () => {
    render(<ProbeToken playerColor='red' count={3} />);

    const token = screen.getByTestId('probe-token');
    expect(
      within(token).getByRole('img', { name: 'red probe' }),
    ).toHaveAttribute('src', '/assets/seti/tokens/probes/redProbe.png');
    expect(within(token).getByText('3')).toBeInTheDocument();
  });

  it('maps red hex debug fixtures to the printed red probe art', () => {
    render(<ProbeToken playerColor='#f00' />);

    expect(screen.getByRole('img', { name: '#f00 probe' })).toHaveAttribute(
      'src',
      '/assets/seti/tokens/probes/redProbe.png',
    );
  });

  it('passes through hex literals (debug fixtures keep working)', () => {
    render(<ProbeToken playerColor='#abc123' />);

    expect(screen.getByRole('img', { name: '#abc123 probe' })).toHaveAttribute(
      'src',
      '/assets/seti/tokens/probes/whiteProbe.png',
    );
    expect(screen.getByTestId('probe-token-tint')).toHaveStyle({
      backgroundColor: '#abc123',
    });
  });
});
