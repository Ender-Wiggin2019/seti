import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataPoolView } from '@/features/player';

describe('DataPoolView', () => {
  it('shows current and max count', () => {
    render(<DataPoolView count={3} max={6} />);

    expect(screen.getByText('3 / 6')).toBeInTheDocument();
  });

  it('shows warning style when full', () => {
    render(<DataPoolView count={6} max={6} />);

    expect(screen.getByText('Full')).toBeInTheDocument();
  });
});
