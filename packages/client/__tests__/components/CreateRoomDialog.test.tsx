import { EExpansion } from '@seti/common/types/protocol/options';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';

describe('CreateRoomDialog', () => {
  it('submits solo mode with a forced two-seat rules game and selected difficulty', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mission Callsign'), {
      target: { value: 'Solo Trial' },
    });
    fireEvent.click(screen.getByLabelText('Solo Rival'));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'Solo Trial',
      expect.objectContaining({
        playerCount: 2,
        isSoloMode: true,
        soloDifficulty: 3,
      }),
    );
  });

  it('submits Space Agency options configured before room creation', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mission Callsign'), {
      target: { value: 'Agency Trial' },
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Space Agency' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Organizations' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Quick Start Cards' }));
    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'Agency Trial',
      expect.objectContaining({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: true,
          startResourceCards: true,
          newDeck: false,
          newAlienSpecies: false,
        },
      }),
    );
  });
});
