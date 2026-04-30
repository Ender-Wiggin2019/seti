import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComputerRow } from '@/features/player';
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

describe('ComputerRow', () => {
  it('renders numeric rewards as single icon with value badge', () => {
    render(
      <ComputerRow
        computer={makeComputer([
          emptyCol({ topReward: { vp: 2 } }),
          emptyCol({ topReward: { credits: 2 } }),
          emptyCol({ topReward: { energy: 2 } }),
          emptyCol({ topReward: { publicity: 2 } }),
        ])}
        dataPoolCount={3}
        dataPoolMax={6}
      />,
    );

    for (let i = 0; i < 4; i += 1) {
      const slot = screen.getByTestId(`computer-slot-top-${i}`);
      const icons = within(slot).getAllByTestId(/^seti-icon-/);
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveAttribute('data-value', '2');
    }
  });
});
