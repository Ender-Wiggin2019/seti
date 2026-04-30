import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectTraceInput } from '@/features/input/SelectTraceInput';
import { EPlayerInputType, ETrace } from '@/types/re-exports';

describe('SelectTraceInput', () => {
  it('renders traces and submits selected trace', () => {
    const onSubmit = vi.fn();
    render(
      <SelectTraceInput
        model={{
          inputId: 'input-trace',
          type: EPlayerInputType.TRACE,
          options: [ETrace.BLUE, ETrace.RED],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: ETrace.RED }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.TRACE,
      trace: ETrace.RED,
    });
  });
});
