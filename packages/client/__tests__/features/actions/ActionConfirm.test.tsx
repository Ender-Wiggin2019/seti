import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionConfirm } from '@/features/actions/ActionConfirm';

describe('ActionConfirm', () => {
  it('renders title and cost content', () => {
    render(
      <ActionConfirm
        open
        title='Buy Card'
        description='Spend resources to proceed.'
        costs={['3 publicity', '1 energy']}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Buy Card')).toBeInTheDocument();
    expect(screen.getByText(/3 publicity/)).toBeInTheDocument();
    expect(screen.getByText(/1 energy/)).toBeInTheDocument();
  });

  it('calls confirm and cancel handlers', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ActionConfirm
        open
        title='Buy Card'
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
