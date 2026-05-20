import { EResource, ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerDashboard } from '@/features/player';
import { useDebugStore } from '@/stores/debugStore';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('PlayerDashboard', () => {
  beforeEach(() => {
    useDebugStore.setState({ textMode: false });
  });

  it('renders all core sections', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState()}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(screen.getByTestId('resource-bar')).toBeInTheDocument();
    expect(screen.getByTestId('income-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('data-pool-view')).toBeInTheDocument();
    expect(screen.getByText('Tech Slots')).toBeInTheDocument();
  });

  it('renders selected Space Agency organization cards', () => {
    const onFreeAction = vi.fn();
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.HELION_ASSEMBLY],
          usableOrganizationPowerIds: [EOrganizationId.HELION_ASSEMBLY],
        })}
        pendingInput={null}
        onFreeAction={onFreeAction}
      />,
    );

    expect(screen.getByTestId('player-organizations')).toBeInTheDocument();
    const organizationCard = screen.getByTestId(
      `organization-card-${EOrganizationId.HELION_ASSEMBLY}`,
    );
    expect(organizationCard).toHaveTextContent('Helion Assembly');
    expect(organizationCard).toHaveTextContent(
      /destroy one of your probe\/orange or scan\/purple techs/i,
    );
    expect(screen.getByAltText('Virelon Technologies')).toHaveAttribute(
      'src',
      '/assets/seti/corporations/Helion Assembly.jpg',
    );
    fireEvent.click(
      screen.getByTestId(
        `organization-power-card-${EOrganizationId.HELION_ASSEMBLY}`,
      ),
    );
    expect(onFreeAction).toHaveBeenCalledWith({
      type: 'USE_ORGANIZATION_POWER',
      organizationId: EOrganizationId.HELION_ASSEMBLY,
    });
  });

  it('renders organization reward marks in text mode', () => {
    useDebugStore.setState({ textMode: true });

    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [
            EOrganizationId.COSMOS_STRATEGY_GROUP,
            EOrganizationId.HELION_ASSEMBLY,
          ],
          usableOrganizationPowerIds: [EOrganizationId.COSMOS_STRATEGY_GROUP],
          organizationState: {
            [EOrganizationId.COSMOS_STRATEGY_GROUP]: {
              markedRewards: { [EResource.CREDIT]: true },
            },
            [EOrganizationId.HELION_ASSEMBLY]: {
              markedCategories: [ETech.PROBE],
            },
          },
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(
      screen.getByTestId(
        `organization-status-${EOrganizationId.COSMOS_STRATEGY_GROUP}`,
      ),
    ).toHaveTextContent('Reward marks');
    expect(
      screen.getByTestId(
        `organization-mark-${EOrganizationId.COSMOS_STRATEGY_GROUP}-${EResource.CREDIT}`,
      ),
    ).toHaveTextContent('marked');
    expect(
      screen.getByTestId(
        `organization-mark-${EOrganizationId.HELION_ASSEMBLY}-${ETech.PROBE}`,
      ),
    ).toHaveTextContent('marked');
  });

  it('hides Quick Start cards until the played cards dialog opens', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.ORBITAL_DYNAMICS],
          quickStartCardIds: ['SR.1', 'SR.3'],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(
      screen.queryByTestId('quick-start-card-preview-SR.1'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('show-all-played-cards'));

    expect(
      screen.getByTestId('quick-start-card-preview-SR.1'),
    ).toHaveTextContent('SR.1');
    expect(
      screen.getByTestId('quick-start-card-preview-SR.3'),
    ).toHaveTextContent('SR.3');
  });
});
