import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OrOptionsInput } from '@/features/input/OrOptionsInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('OrOptionsInput', () => {
  it('switches tabs and wraps nested response with selected index', () => {
    const onSubmit = vi.fn();
    render(
      <OrOptionsInput
        model={{
          inputId: 'input-or',
          type: EPlayerInputType.OR,
          options: [
            {
              inputId: 'child-1',
              title: 'First',
              type: EPlayerInputType.OPTION,
              options: [{ id: 'a-1', label: 'Alpha' }],
            },
            {
              inputId: 'child-2',
              title: 'Second',
              type: EPlayerInputType.OPTION,
              options: [{ id: 'b-1', label: 'Beta' }],
            },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.OR,
      index: 1,
      response: {
        type: EPlayerInputType.OPTION,
        optionId: 'b-1',
      },
    });
  });
});
