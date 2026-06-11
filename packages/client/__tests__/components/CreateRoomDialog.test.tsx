import { CORE_RANDOM_ALIEN_TYPES } from '@seti/common/constant/alienLobby';
import { EAlienMap, EAlienType } from '@seti/common/types/BaseCard';
import { EExpansion } from '@seti/common/types/protocol/options';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';

const SPACE_AGENCY_ALIEN_TYPES = [
  EAlienType.GLYPHIDS,
  EAlienType.AMOEBA,
  EAlienType.ARKHOS,
] as const;

function createAlienTypeMap(
  disabledTypes: readonly EAlienType[] = [],
  stringifyAlienType = false,
): Record<string, { alienType: number; alienName: string; disabled: boolean }> {
  const disabledSet = new Set(disabledTypes);
  return [...CORE_RANDOM_ALIEN_TYPES, ...SPACE_AGENCY_ALIEN_TYPES].reduce<
    Record<string, { alienType: number; alienName: string; disabled: boolean }>
  >((map, alienType) => {
    map[String(alienType)] = {
      alienType: (stringifyAlienType
        ? String(alienType)
        : alienType) as unknown as number,
      alienName: EAlienMap[alienType],
      disabled: disabledSet.has(alienType),
    };
    return map;
  }, {});
}

describe('CreateRoomDialog', () => {
  it('submits a default mission name when the callsign is blank', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'New Mission',
      expect.objectContaining({
        isSoloMode: false,
      }),
      true,
    );
  });

  it('selects all non-Space Agency aliens by default', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'New Mission',
      expect.objectContaining({
        alienModulesEnabled: expect.objectContaining({
          [EAlienType.ANOMALIES]: true,
          [EAlienType.CENTAURIANS]: true,
          [EAlienType.EXERTIANS]: true,
          [EAlienType.MASCAMITES]: true,
          [EAlienType.OUMUAMUA]: true,
          [EAlienType.GLYPHIDS]: false,
          [EAlienType.AMOEBA]: false,
          [EAlienType.ARKHOS]: false,
        }),
      }),
      true,
    );
  });

  it('selects solo and multiplayer from a direct mode segmented control', () => {
    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    );

    const soloMode = screen.getByRole('button', { name: 'Solo Mission' });
    const multiplayerMode = screen.getByRole('button', {
      name: 'Multiplayer Mission',
    });

    expect(multiplayerMode).toHaveAttribute('aria-pressed', 'true');
    expect(soloMode).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(soloMode);

    expect(soloMode).toHaveAttribute('aria-pressed', 'true');
    expect(multiplayerMode).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByLabelText('Rival Difficulty')).toBeInTheDocument();

    fireEvent.click(multiplayerMode);

    expect(multiplayerMode).toHaveAttribute('aria-pressed', 'true');
    expect(soloMode).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('Rival Difficulty')).not.toBeInTheDocument();
  });

  it('submits solo mode with a forced two-seat rules game and selected difficulty', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
        alienTypeMap={createAlienTypeMap()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mission Callsign'), {
      target: { value: 'Solo Trial' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Solo Mission' }));
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
      true,
    );
  });

  it('lets solo rooms opt out of the public lobby listing', async () => {
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
      target: { value: 'Private Solo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Solo Mission' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Show in Lobby' }));
    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'Private Solo',
      expect.objectContaining({
        isSoloMode: true,
      }),
      false,
    );
  });

  it('submits Space Agency with all modules selected by default', async () => {
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
          newDeck: true,
          newAlienSpecies: true,
        },
        alienModulesEnabled: expect.objectContaining({
          [EAlienType.GLYPHIDS]: true,
          [EAlienType.AMOEBA]: true,
          [EAlienType.ARKHOS]: true,
        }),
      }),
      true,
    );
  });

  it('does not select disabled Space Agency aliens when enabling the expansion', async () => {
    const onSubmit = vi.fn();

    render(
      <CreateRoomDialog
        open
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
        isPending={false}
        alienTypeMap={createAlienTypeMap(SPACE_AGENCY_ALIEN_TYPES, true)}
      />,
    );

    fireEvent.change(screen.getByLabelText('Mission Callsign'), {
      target: { value: 'Agency Without Aliens' },
    });
    fireEvent.click(screen.getByRole('switch', { name: 'Space Agency' }));
    fireEvent.click(screen.getByTestId('create-room-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      'Agency Without Aliens',
      expect.objectContaining({
        expansions: [EExpansion.BASE, EExpansion.SPACE_AGENCY],
        spaceAgencyOptions: {
          enabled: true,
          agencies: true,
          startResourceCards: true,
          newDeck: true,
          newAlienSpecies: false,
        },
        alienModulesEnabled: expect.objectContaining({
          [EAlienType.GLYPHIDS]: false,
          [EAlienType.AMOEBA]: false,
          [EAlienType.ARKHOS]: false,
        }),
      }),
      true,
    );
  });
});
