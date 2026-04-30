import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectGoldTileInput } from '@/features/input/SelectGoldTileInput';
import { EPlayerInputType } from '@/types/re-exports';

describe('SelectGoldTileInput', () => {
  it('requires tile selection before submit', () => {
    const onSubmit = vi.fn();
    render(
      <SelectGoldTileInput
        model={{
          inputId: 'input-gold',
          type: EPlayerInputType.GOLD_TILE,
          options: ['tile-a', 'tile-b'],
        }}
        onSubmit={onSubmit}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: 'Confirm Tile' });
    expect(confirmButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('gold-tile-tile-b'));
    expect(confirmButton).not.toBeDisabled();

    fireEvent.click(confirmButton);
    expect(onSubmit).toHaveBeenCalledWith({
      type: EPlayerInputType.GOLD_TILE,
      tileId: 'tile-b',
    });
  });
});
