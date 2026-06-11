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
    expect(screen.getByTestId('dialog-content')).toHaveAttribute(
      'data-dialog-scene',
      'false',
    );
    expect(screen.getByTestId('dialog-content')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-lg',
      'bg-[var(--surface-instrument)]',
    );
    expect(screen.queryByTestId('dialog-scene')).toBeNull();

    fireEvent.click(screen.getByTestId('dialog-overlay'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('paints a scene band when scene prop is provided', () => {
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogContent
          data-testid='dialog-content'
          scene='/assets/seti/sprites/objects_01_00.webp'
          sceneHeight={180}
        >
          <DialogTitle>New Mission</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByTestId('dialog-content')).toHaveAttribute(
      'data-dialog-scene',
      'true',
    );
    const sceneBand = screen.getByTestId('dialog-scene');
    expect(sceneBand).toBeInTheDocument();
    expect(sceneBand).toHaveStyle({ height: '180px' });
    const sprite = sceneBand.querySelector('img');
    expect(sprite).toHaveAttribute(
      'src',
      '/assets/seti/sprites/objects_01_00.webp',
    );
  });
});
