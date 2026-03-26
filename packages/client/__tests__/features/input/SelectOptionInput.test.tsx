import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectOptionInput } from '@/features/input/SelectOptionInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('SelectOptionInput', () => {
  it('renders options and submits selected option id', () => {
    const onSubmit = vi.fn();
    render(
      <SelectOptionInput
        model={{
          inputId: 'input-option',
          type: EPlayerInputType.OPTION,
          options: [
            { id: 'opt-a', label: 'Option A' },
            { id: 'opt-b', label: 'Option B' },
          ],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Option B' }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.OPTION,
      optionId: 'opt-b',
    });
  });
});
