import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UndoButton } from '@/features/actions/UndoButton';

describe('UndoButton', () => {
  it('is disabled when undo is unavailable', () => {
    render(<UndoButton disabled onRequestUndo={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  it('requests undo when clicked', () => {
    const onRequestUndo = vi.fn();
    render(<UndoButton disabled={false} onRequestUndo={onRequestUndo} />);

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onRequestUndo).toHaveBeenCalledTimes(1);
  });
});
