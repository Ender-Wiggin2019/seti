import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import type { ISpaceAgencyOptions } from '@seti/common/types/protocol/options';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FreeActionBar } from '@/features/actions/FreeActionBar';
import { EFreeAction, EPhase, EPlayerInputType } from '@/types/re-exports';
import {
  createMockGameState,
  createMockPlayerState,
} from '../../../test/mocks/gameState';

const SPACE_AGENCY_NEW_DECK_OPTIONS: ISpaceAgencyOptions = {
  enabled: true,
  agencies: false,
  startResourceCards: false,
  newDeck: true,
  newAlienSpecies: false,
};

const SPACE_AGENCY_WITHOUT_NEW_DECK_OPTIONS: ISpaceAgencyOptions = {
  ...SPACE_AGENCY_NEW_DECK_OPTIONS,
  newDeck: false,
};

describe('FreeActionBar', () => {
  it('shows only move and mission by default', () => {
    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Move Probe (1)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Complete Mission' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Place Data' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Use Card' }),
    ).not.toBeInTheDocument();
  });

  it('expands to show remaining free actions when clicked', () => {
    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    expect(
      screen.getByRole('button', { name: 'Place Data' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Use Card' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Buy Card (3 PR)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Exchange' }),
    ).toBeInTheDocument();
  });

  it('uses availability rules for enabled state', () => {
    const gameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          probesInSpace: 0,
          movementPoints: 0,
          handSize: 0,
          dataPoolCount: 0,
          resources: { credit: 1, energy: 0, data: 0, publicity: 1 },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Move Probe (0)' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Complete Mission' }),
    ).toBeDisabled();
  });

  it('triggers callback with clicked action', () => {
    const onActionClick = vi.fn();

    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move Probe (1)' }));

    expect(onActionClick).toHaveBeenCalledWith(EFreeAction.MOVEMENT);
  });

  it('hides while a pending input must be resolved', () => {
    render(
      <FreeActionBar
        gameState={createMockGameState()}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={{
          inputId: 'input-card',
          type: EPlayerInputType.CARD,
          title: 'Select a card to tuck for income',
          cards: [],
          minSelections: 0,
          maxSelections: 1,
        }}
        onActionClick={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('free-action-bar')).not.toBeInTheDocument();
  });

  it('shows spend signal token while a scan pool is active', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      phase: EPhase.IN_RESOLUTION,
      scanActionInProgress: true,
      spaceAgencyOptions: SPACE_AGENCY_NEW_DECK_OPTIONS,
      cardRow: [{ id: 'row-1' } as never],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 3,
            [EResource.SIGNAL_TOKEN]: 1,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    fireEvent.click(screen.getByRole('button', { name: 'Spend Signal Token' }));

    expect(onActionClick).toHaveBeenCalledWith(EFreeAction.SPEND_SIGNAL_TOKEN);
  });

  it('does not show spend signal token when newDeck is disabled', () => {
    const gameState = createMockGameState({
      phase: EPhase.IN_RESOLUTION,
      scanActionInProgress: true,
      spaceAgencyOptions: SPACE_AGENCY_WITHOUT_NEW_DECK_OPTIONS,
      cardRow: [{ id: 'row-1' } as never],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 3,
            [EResource.SIGNAL_TOKEN]: 1,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByRole('button', { name: 'Spend Signal Token' }),
    ).toBeDisabled();
  });

  it('disables spend signal token after two spends in the current scan', () => {
    const gameState = createMockGameState({
      phase: EPhase.IN_RESOLUTION,
      scanActionInProgress: true,
      spaceAgencyOptions: SPACE_AGENCY_NEW_DECK_OPTIONS,
      scanSignalTokensSpent: 2,
      cardRow: [{ id: 'row-1' } as never],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 3,
            [EResource.SIGNAL_TOKEN]: 1,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByRole('button', { name: 'Spend Signal Token' }),
    ).toBeDisabled();
  });

  it('keeps spend signal token available during the scan pool input', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      phase: EPhase.IN_RESOLUTION,
      scanActionInProgress: true,
      spaceAgencyOptions: SPACE_AGENCY_NEW_DECK_OPTIONS,
      cardRow: [{ id: 'row-1' } as never],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 3,
            [EResource.SIGNAL_TOKEN]: 1,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={{
          inputId: 'input-scan-pool',
          type: EPlayerInputType.OPTION,
          title: 'Scan: choose sub-action',
          options: [{ id: 'mark-earth', label: 'Mark Earth' }],
        }}
        onActionClick={onActionClick}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Expand' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Spend Signal Token' }));

    expect(onActionClick).toHaveBeenCalledWith(EFreeAction.SPEND_SIGNAL_TOKEN);
  });

  it('does not render organization buttons while resolving pending input', () => {
    const baseGameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [EOrganizationId.SENTINEL_PROBE_NETWORK],
          oncePerRoundUsed: {
            [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
          },
        }),
      ],
    });

    const { rerender } = render(
      <FreeActionBar
        gameState={baseGameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByTestId(
        `organization-power-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
      ),
    ).toBeInTheDocument();

    rerender(
      <FreeActionBar
        gameState={{
          ...baseGameState,
          phase: EPhase.IN_RESOLUTION,
          scanActionInProgress: true,
          cardRow: [{ id: 'row-1' } as never],
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              organizationIds: [EOrganizationId.SENTINEL_PROBE_NETWORK],
              oncePerRoundUsed: {
                [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
              },
              resources: {
                [EResource.CREDIT]: 10,
                [EResource.ENERGY]: 5,
                [EResource.DATA]: 0,
                [EResource.PUBLICITY]: 3,
                [EResource.SIGNAL_TOKEN]: 1,
              },
            }),
          ],
        }}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={{
          inputId: 'input-card',
          type: EPlayerInputType.CARD,
          title: 'Select a card',
          cards: [],
          minSelections: 0,
          maxSelections: 1,
        }}
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.queryByTestId(
        `organization-power-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders setup-only organization power shells disabled', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [EOrganizationId.ORBITAL_DYNAMICS],
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

    const powerButton = screen.getByTestId(
      `organization-power-${EOrganizationId.ORBITAL_DYNAMICS}`,
    );
    expect(powerButton).toHaveTextContent('Organization Power');
    expect(powerButton).toBeDisabled();
    fireEvent.click(powerButton);
    expect(onActionClick).not.toHaveBeenCalledWith(
      EFreeAction.USE_ORGANIZATION_POWER,
    );
  });

  it('enables implemented unused organization powers', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      cardRow: [
        {
          id: '128',
          freeAction: [{ type: EResource.PUBLICITY, value: 1 }],
        } as never,
      ],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [EOrganizationId.STRATUS_CORE],
          usableOrganizationPowerIds: [EOrganizationId.STRATUS_CORE],
          oncePerRoundUsed: { [EOrganizationId.STRATUS_CORE]: false },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    const powerButton = screen.getByTestId(
      `organization-power-${EOrganizationId.STRATUS_CORE}`,
    );
    expect(powerButton).toBeEnabled();
    fireEvent.click(powerButton);
    expect(onActionClick).toHaveBeenCalledWith(
      EFreeAction.USE_ORGANIZATION_POWER,
      EOrganizationId.STRATUS_CORE,
    );
  });

  it('highlights free actions that become available during the current turn', async () => {
    const { rerender } = render(
      <FreeActionBar
        gameState={createMockGameState({
          turnIndex: 7,
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              completableMissionBranches: [],
            }),
          ],
        })}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId(`free-action-${EFreeAction.COMPLETE_MISSION}`),
    ).not.toHaveAttribute('data-newly-available', 'true');

    rerender(
      <FreeActionBar
        gameState={createMockGameState({
          turnIndex: 7,
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              completableMissionBranches: [{ cardId: '37', branchIndex: 0 }],
            }),
          ],
        })}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId(`free-action-${EFreeAction.COMPLETE_MISSION}`),
      ).toHaveAttribute('data-newly-available', 'true'),
    );
  });

  it('enables Fenwick and Sentinel organization powers with organization-specific payloads', () => {
    const onActionClick = vi.fn();
    const gameState = createMockGameState({
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [
            EOrganizationId.FENWICK_RESEARCH_CENTER,
            EOrganizationId.SENTINEL_PROBE_NETWORK,
          ],
          usableOrganizationPowerIds: [
            EOrganizationId.FENWICK_RESEARCH_CENTER,
            EOrganizationId.SENTINEL_PROBE_NETWORK,
          ],
          oncePerRoundUsed: {
            [EOrganizationId.FENWICK_RESEARCH_CENTER]: false,
            [EOrganizationId.SENTINEL_PROBE_NETWORK]: false,
          },
          resources: {
            [EResource.CREDIT]: 10,
            [EResource.ENERGY]: 5,
            [EResource.DATA]: 0,
            [EResource.PUBLICITY]: 1,
            [EResource.SIGNAL_TOKEN]: 0,
          },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    const fenwickButton = screen.getByTestId(
      `organization-power-${EOrganizationId.FENWICK_RESEARCH_CENTER}`,
    );
    const sentinelButton = screen.getByTestId(
      `organization-power-${EOrganizationId.SENTINEL_PROBE_NETWORK}`,
    );

    expect(fenwickButton).toBeEnabled();
    expect(sentinelButton).toBeEnabled();
    expect(fenwickButton).toHaveAccessibleName(
      'Fenwick Research Center Organization Power',
    );
    expect(sentinelButton).toHaveAccessibleName(
      'Sentinel Probe Network Organization Power',
    );
    fireEvent.click(fenwickButton);
    fireEvent.click(sentinelButton);

    expect(onActionClick).toHaveBeenCalledWith(
      EFreeAction.USE_ORGANIZATION_POWER,
      EOrganizationId.FENWICK_RESEARCH_CENTER,
    );
    expect(onActionClick).toHaveBeenCalledWith(
      EFreeAction.USE_ORGANIZATION_POWER,
      EOrganizationId.SENTINEL_PROBE_NETWORK,
    );
  });

  it('highlights organization powers that become available during the current turn', async () => {
    const onActionClick = vi.fn();
    const { rerender } = render(
      <FreeActionBar
        gameState={createMockGameState({
          turnIndex: 9,
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              organizationIds: [EOrganizationId.COSMOS_STRATEGY_GROUP],
              usableOrganizationPowerIds: [],
            }),
          ],
        })}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByTestId(
        `organization-power-${EOrganizationId.COSMOS_STRATEGY_GROUP}`,
      ),
    ).not.toHaveAttribute('data-newly-available', 'true');

    rerender(
      <FreeActionBar
        gameState={createMockGameState({
          turnIndex: 9,
          players: [
            createMockPlayerState({
              playerId: 'player-1',
              organizationIds: [EOrganizationId.COSMOS_STRATEGY_GROUP],
              usableOrganizationPowerIds: [
                EOrganizationId.COSMOS_STRATEGY_GROUP,
              ],
            }),
          ],
        })}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={onActionClick}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId(
          `organization-power-${EOrganizationId.COSMOS_STRATEGY_GROUP}`,
        ),
      ).toHaveAttribute('data-newly-available', 'true'),
    );
  });

  it('does not highlight organization powers that were already available before pending input cleared', () => {
    const gameState = createMockGameState({
      turnIndex: 10,
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [EOrganizationId.COSMOS_STRATEGY_GROUP],
          usableOrganizationPowerIds: [EOrganizationId.COSMOS_STRATEGY_GROUP],
        }),
      ],
    });
    const { rerender } = render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        pendingInput={{
          inputId: 'input-card',
          type: EPlayerInputType.CARD,
          title: 'Select a card',
          cards: [],
          minSelections: 0,
          maxSelections: 1,
        }}
        onActionClick={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('free-action-bar')).not.toBeInTheDocument();

    rerender(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByTestId(
        `organization-power-${EOrganizationId.COSMOS_STRATEGY_GROUP}`,
      ),
    ).not.toHaveAttribute('data-newly-available', 'true');
  });

  it('disables Stratus Core when the row has unsupported input corners', () => {
    const gameState = createMockGameState({
      cardRow: [
        {
          id: 'card-any-row',
          freeAction: [{ type: EResource.CARD_ANY, value: 1 }],
        } as never,
      ],
      players: [
        createMockPlayerState({
          playerId: 'player-1',
          organizationIds: [EOrganizationId.STRATUS_CORE],
          oncePerRoundUsed: { [EOrganizationId.STRATUS_CORE]: false },
        }),
      ],
    });

    render(
      <FreeActionBar
        gameState={gameState}
        myPlayerId='player-1'
        isMyTurn
        onActionClick={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByTestId(`organization-power-${EOrganizationId.STRATUS_CORE}`),
    ).toBeDisabled();
  });
});
