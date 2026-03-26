import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectTechInput } from '@/features/input/SelectTechInput';
import { EPlayerInputType, ETech } from '@/types/re-exports';

describe('SelectTechInput', () => {
  it('renders tech options and submits selected tech', () => {
    const onSubmit = vi.fn();
    render(
      <SelectTechInput
        model={{
          inputId: 'input-tech',
          type: EPlayerInputType.TECH,
          options: [ETech.PROBE, ETech.SCAN],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: ETech.SCAN }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.TECH,
      tech: ETech.SCAN,
    });
  });
});
