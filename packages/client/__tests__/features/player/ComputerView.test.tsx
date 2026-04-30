import { ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComputerView } from '@/features/player';
import type {
  IPublicComputerColumnState,
  IPublicComputerState,
} from '@/types/re-exports';

function emptyCol(
  overrides?: Partial<IPublicComputerColumnState>,
): IPublicComputerColumnState {
  return {
    topFilled: false,
    topReward: null,
    techId: null,
    hasBottomSlot: false,
    bottomFilled: false,
    bottomReward: null,
    techSlotAvailable: true,
    ...overrides,
  };
}

function makeComputer(
  columns: IPublicComputerColumnState[],
): IPublicComputerState {
  return { columns };
}

describe('ComputerView', () => {
  it('renders top slots for each column', () => {
    render(
      <ComputerView
        computer={makeComputer([emptyCol(), emptyCol(), emptyCol()])}
        dataPoolCount={3}
      />,
    );

    expect(screen.getAllByTestId(/^computer-slot-top-/)).toHaveLength(3);
  });

  it('allows placing data on first available top slot', () => {
    const onPlaceData = vi.fn();
    render(
      <ComputerView
        computer={makeComputer([emptyCol(), emptyCol(), emptyCol()])}
        dataPoolCount={2}
        onPlaceData={onPlaceData}
      />,
    );

    fireEvent.click(screen.getByTestId('computer-slot-top-0'));
    expect(onPlaceData).toHaveBeenCalledWith('top', 0);
  });

  it('blocks unavailable bottom slot (top not yet filled)', () => {
    const onPlaceData = vi.fn();
    render(
      <ComputerView
        computer={makeComputer([
          emptyCol({ topFilled: true, hasBottomSlot: true }),
          emptyCol(),
          emptyCol(),
        ])}
        dataPoolCount={2}
        onPlaceData={onPlaceData}
      />,
    );

    fireEvent.click(screen.getByTestId('computer-slot-top-1'));
    expect(onPlaceData).toHaveBeenCalledWith('top', 1);
  });

  it('renders bottom row when techs are placed', () => {
    render(
      <ComputerView
        computer={makeComputer([
          emptyCol({
            topFilled: true,
            hasBottomSlot: true,
            techId: ETechId.COMPUTER_VP_CREDIT,
          }),
          emptyCol({ topFilled: true }),
          emptyCol(),
        ])}
        dataPoolCount={2}
      />,
    );

    expect(screen.getByTestId('computer-slot-bottom-0')).toBeTruthy();
  });
});
