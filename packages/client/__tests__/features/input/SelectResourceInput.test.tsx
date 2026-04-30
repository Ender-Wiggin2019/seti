import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectResourceInput } from '@/features/input/SelectResourceInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('SelectResourceInput', () => {
  it('renders resources and submits selected one', () => {
    const onSubmit = vi.fn();
    render(
      <SelectResourceInput
        model={
          {
            inputId: 'input-resource',
            type: EPlayerInputType.RESOURCE,
            options: ['credit', 'energy'],
          } as any
        }
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'energy' }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.RESOURCE,
      resource: 'energy',
    });
  });
});
