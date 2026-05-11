import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Toaster, toast, useToastStore } from '@/components/ui/toast';

describe('Toaster', () => {
  afterEach(() => {
    act(() => {
      useToastStore.setState({ toasts: [] });
    });
  });

  it('renders server error toasts above modal dialogs', async () => {
    await act(async () => {
      render(
        <>
          <Dialog open onOpenChange={() => undefined}>
            <DialogContent>Blocking modal</DialogContent>
          </Dialog>
          <Toaster />
        </>,
      );
    });

    await act(async () => {
      toast({
        title: 'Server error',
        description: 'Request failed',
        variant: 'error',
      });
    });

    const toastStatus = await screen.findByRole('status');
    const dialogOverlay = screen.getByRole('dialog').parentElement;
    const toastViewport = toastStatus.parentElement;

    expect(toastViewport).not.toBeNull();
    expect(dialogOverlay).not.toBeNull();
    expect(readArbitraryZIndex(toastViewport)).toBeGreaterThan(
      readArbitraryZIndex(dialogOverlay),
    );

    await waitFor(() => {
      expect(toastStatus).toHaveTextContent('Server error');
    });
  });

  it('renders warning toasts and keeps persistent toasts until dismissed', async () => {
    await act(async () => {
      render(<Toaster />);
    });

    await act(async () => {
      toast({
        title: 'Game Warning',
        description: 'Action is no longer available',
        variant: 'warning',
        duration: null,
      });
    });

    const toastStatus = await screen.findByRole('status');
    expect(toastStatus).toHaveTextContent('Game Warning');
    expect(toastStatus).toHaveTextContent('Action is no longer available');

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByRole('status')).toHaveTextContent('Game Warning');
  });
});

function readArbitraryZIndex(element: Element | null): number {
  if (!element) return Number.NEGATIVE_INFINITY;

  const match = element.className.match(/z-\[(\d+)\]/);
  return match ? Number(match[1]) : Number.NEGATIVE_INFINITY;
}
