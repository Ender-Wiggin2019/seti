import { EResource } from '@seti/common/types/element';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResourceBar } from '@/features/player';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('ResourceBar', () => {
  it('renders key resource values and score', () => {
    const player = createMockPlayerState({
      score: 23,
      resources: {
        [EResource.CREDIT]: 14,
        [EResource.ENERGY]: 8,
        [EResource.DATA]: 2,
        [EResource.PUBLICITY]: 6,
      },
    });

    render(<ResourceBar player={player} />);

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('renders resource icons', () => {
    render(<ResourceBar player={createMockPlayerState()} />);

    expect(screen.getByAltText('Credits')).toBeInTheDocument();
    expect(screen.getByAltText('Energy')).toBeInTheDocument();
    expect(screen.getByAltText('Publicity')).toBeInTheDocument();
    expect(screen.getByAltText('Score')).toBeInTheDocument();
  });
});
