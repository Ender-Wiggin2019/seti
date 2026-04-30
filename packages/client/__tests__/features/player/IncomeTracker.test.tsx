import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IncomeTracker } from '@/features/player';

describe('IncomeTracker', () => {
  it('renders credit/energy/card income streams', () => {
    render(<IncomeTracker creditIncome={3} energyIncome={2} cardIncome={1} />);

    expect(screen.getByText('Credits')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Cards')).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '+3'),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '+2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '+1'),
    ).toBeInTheDocument();
  });
});
