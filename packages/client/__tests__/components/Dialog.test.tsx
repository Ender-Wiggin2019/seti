import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

describe('Dialog', () => {
  it('uses the raised mission surface and closes from the overlay', () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent data-testid='dialog-content'>
          <DialogTitle>Mission Display</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-dialog-surface',
      'raised',
    );
    expect(screen.getByTestId('dialog-content')).toHaveAttribute(
      'data-surface',
      'raised',
    );
    expect(screen.getByTestId('dialog-content')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-lg',
      'bg-[var(--surface-raised)]/94',
    );

    fireEvent.click(screen.getByTestId('dialog-overlay'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
