import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComputerView } from '@/features/player';

describe('ComputerView', () => {
  it('renders six computer slots', () => {
    render(
      <ComputerView
        computer={{
          topSlots: [null, null, null],
          bottomSlots: [null, null, null],
        }}
        dataPoolCount={3}
      />,
    );

    expect(screen.getAllByTestId(/^computer-slot-/)).toHaveLength(6);
  });

  it('allows placing data on available slots', () => {
    const onPlaceData = vi.fn();
    render(
      <ComputerView
        computer={{
          topSlots: [null, null, null],
          bottomSlots: [null, null, null],
        }}
        dataPoolCount={2}
        onPlaceData={onPlaceData}
      />,
    );

    fireEvent.click(screen.getByTestId('computer-slot-0'));
    expect(onPlaceData).toHaveBeenCalledWith(0);
  });

  it('blocks unavailable bottom slot placement', () => {
    const onPlaceData = vi.fn();
    render(
      <ComputerView
        computer={{
          topSlots: ['data-1', null, null],
          bottomSlots: [null, null, null],
        }}
        dataPoolCount={2}
        onPlaceData={onPlaceData}
      />,
    );

    fireEvent.click(screen.getByTestId('computer-slot-4'));
    expect(onPlaceData).not.toHaveBeenCalled();
  });
});
