import { ESector } from '@seti/common/types/element';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InputRenderer } from '@/features/input/InputRenderer';
import type { IPlayerInputModel } from '@/types/re-exports';
import { EPlanet, EPlayerInputType, ETech, ETrace } from '@/types/re-exports';

const mockCard = {
  id: 'card-1',
  name: 'Mission One',
} as any;

describe('InputRenderer', () => {
  it('routes option input to SelectOptionInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-option',
      type: EPlayerInputType.OPTION,
      options: [{ id: 'opt-1', label: 'Do Action' }],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Do Action' }),
    ).toBeInTheDocument();
  });

  it('routes card input to SelectCardInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-card',
      type: EPlayerInputType.CARD,
      cards: [mockCard],
      minSelections: 1,
      maxSelections: 1,
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('hand-card-card-1')).toBeInTheDocument();
  });

  it('routes sector input to SelectSectorInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-sector',
      type: EPlayerInputType.SECTOR,
      options: [ESector.RED],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: ESector.RED }),
    ).toBeInTheDocument();
  });

  it('routes planet input to SelectPlanetInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-planet',
      type: EPlayerInputType.PLANET,
      options: [EPlanet.MARS],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: EPlanet.MARS }),
    ).toBeInTheDocument();
  });

  it('routes tech input to SelectTechInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-tech',
      type: EPlayerInputType.TECH,
      options: [ETech.PROBE],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Launch \+1/i })).toBeInTheDocument();
  });

  it('routes gold tile input to SelectGoldTileInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-gold',
      type: EPlayerInputType.GOLD_TILE,
      options: ['tile-a'],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('gold-tile-tile-a')).toBeInTheDocument();
  });

  it('routes resource input to SelectResourceInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-resource',
      type: EPlayerInputType.RESOURCE,
      options: ['credit'],
    } as IPlayerInputModel;
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'credit' })).toBeInTheDocument();
  });

  it('routes trace input to SelectTraceInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-trace',
      type: EPlayerInputType.TRACE,
      options: [ETrace.RED],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: ETrace.RED }),
    ).toBeInTheDocument();
  });

  it('routes end-of-round input to SelectEndOfRoundCardInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-eor',
      type: EPlayerInputType.END_OF_ROUND,
      cards: [mockCard],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Mission One/ }),
    ).toBeInTheDocument();
  });

  it('routes or input to OrOptionsInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-or',
      type: EPlayerInputType.OR,
      options: [
        {
          inputId: 'child-1',
          type: EPlayerInputType.OPTION,
          title: 'Action Group',
          options: [{ id: 'a1', label: 'Alpha' }],
        },
      ],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(
      screen.getByRole('tab', { name: 'Action Group' }),
    ).toBeInTheDocument();
  });

  it('routes and input to AndOptionsInput', () => {
    const model: IPlayerInputModel = {
      inputId: 'input-and',
      type: EPlayerInputType.AND,
      options: [
        {
          inputId: 'child-1',
          type: EPlayerInputType.OPTION,
          options: [{ id: 'a1', label: 'Step 1' }],
        },
      ],
    };
    render(<InputRenderer model={model} onSubmit={vi.fn()} />);
    expect(screen.getByText('Step 1 / 1')).toBeInTheDocument();
  });
});
