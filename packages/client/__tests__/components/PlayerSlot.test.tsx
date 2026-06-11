import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerSlot } from '@/components/PlayerSlot';

describe('PlayerSlot', () => {
  it('opens player inspection from a filled seat', () => {
    const onInspectPlayer = vi.fn();

    render(
      <PlayerSlot
        player={{
          id: 'player-1',
          name: 'Commander',
          seatIndex: 0,
          ready: true,
          isHost: true,
        }}
        seatIndex={0}
        isCurrentUser={false}
        onInspectPlayer={onInspectPlayer}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Commander/ }));

    expect(onInspectPlayer).toHaveBeenCalledWith('player-1');
  });
});
