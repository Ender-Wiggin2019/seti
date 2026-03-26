import { ESector } from '@seti/common/types/element';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectSectorInput } from '@/features/input/SelectSectorInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('SelectSectorInput', () => {
  it('renders sectors and submits chosen sector', () => {
    const onSubmit = vi.fn();
    render(
      <SelectSectorInput
        model={{
          inputId: 'input-sector',
          type: EPlayerInputType.SECTOR,
          options: [ESector.RED, ESector.YELLOW],
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: ESector.YELLOW }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.SECTOR,
      sector: ESector.YELLOW,
    });
  });
});
