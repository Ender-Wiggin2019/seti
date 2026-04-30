import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AndOptionsInput } from '@/features/input/AndOptionsInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('AndOptionsInput', () => {
  it('advances steps, supports back, and submits all responses', () => {
    const onSubmit = vi.fn();
    render(
      <AndOptionsInput
        model={{
          inputId: 'input-and',
          type: EPlayerInputType.AND,
          options: [
            {
              inputId: 'step-1',
              title: 'Step One',
              type: EPlayerInputType.OPTION,
              options: [{ id: 'opt-1', label: 'First Choice' }],
            },
            {
              inputId: 'step-2',
              title: 'Step Two',
              type: EPlayerInputType.OPTION,
              options: [{ id: 'opt-2', label: 'Second Choice' }],
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Step 1 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'First Choice' }));
    expect(screen.getByText('Step 2 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText('Step 1 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'First Choice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Second Choice' }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.AND,
      responses: [
        { type: EPlayerInputType.OPTION, optionId: 'opt-1' },
        { type: EPlayerInputType.OPTION, optionId: 'opt-2' },
      ],
    });
  });
});
