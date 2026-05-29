import { EResource, ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerDashboard } from '@/features/player';
import { useDebugStore } from '@/stores/debugStore';
import { createMockPlayerState } from '../../../test/mocks/gameState';

describe('PlayerDashboard', () => {
  beforeEach(() => {
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      showInteractiveHotspots: true,
      showAnchorHotspots: true,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
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
    expect(
      screen.getByTestId(
        `organization-power-card-${EOrganizationId.HELION_ASSEMBLY}`,
      ),
    ).toHaveAttribute('data-hotspot-scene', 'corporation-board');
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

  it('uses the same organization power hotspot id with mode-specific variants', () => {
    const organizationId = EOrganizationId.HELION_ASSEMBLY;
    const player = createMockPlayerState({
      organizationIds: [organizationId],
      usableOrganizationPowerIds: [organizationId],
    });

    const { unmount } = render(
      <PlayerDashboard
        player={player}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    const imagePower = screen.getByTestId(
      `organization-power-card-${organizationId}`,
    );
    expect(imagePower).toHaveAttribute(
      'data-hotspot-id',
      `${organizationId}-power`,
    );
    expect(imagePower).toHaveAttribute('data-hotspot-variant', 'image');

    unmount();
    useDebugStore.setState({ textMode: true });
    render(
      <PlayerDashboard
        player={player}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    const textPower = screen.getByTestId(
      `organization-power-card-${organizationId}`,
    );
    expect(textPower).toHaveAttribute(
      'data-hotspot-id',
      `${organizationId}-power`,
    );
    expect(textPower).toHaveAttribute('data-hotspot-variant', 'text');
  });

  it('exposes image-mode organization used badges through the shared anchor debug layer', () => {
    useDebugStore.getState().setHotspotDebug(true);

    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.HELION_ASSEMBLY],
          oncePerRoundUsed: {
            [EOrganizationId.HELION_ASSEMBLY]: true,
          },
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    const badge = screen.getByTestId(
      `organization-used-badge-${EOrganizationId.HELION_ASSEMBLY}`,
    );
    expect(badge).toHaveAttribute('data-hotspot-scene', 'corporation-board');
    expect(badge).toHaveAttribute(
      'data-hotspot-id',
      `${EOrganizationId.HELION_ASSEMBLY}-used-badge`,
    );
    expect(badge).toHaveAttribute('data-hotspot-role', 'anchor');
    fireEvent.mouseEnter(badge);
    expect(screen.getByText('Helion Assembly used badge')).toBeInTheDocument();
  });

  it('exposes personal board regions through the shared anchor debug layer', () => {
    useDebugStore.getState().setHotspotDebug(true);

    const { container } = render(
      <PlayerDashboard
        player={createMockPlayerState()}
        pendingInput={null}
        onFreeAction={() => undefined}
        income={{ credit: 2, energy: 1, card: 1 }}
      />,
    );

    for (const hotspotId of [
      'resource-credit',
      'resource-energy',
      'resource-publicity',
      'resource-score',
      'tech-launch',
      'tech-scan',
      'data-pool',
      'computer-top-0',
      'computer-bottom-5',
      'analyze',
      'income',
      'mission-summary',
    ]) {
      expect(
        container.querySelector(
          `[data-hotspot-scene="player-board"][data-hotspot-id="${hotspotId}"]`,
        ),
      ).toBeInTheDocument();
    }
    const dataPool = container.querySelector(
      '[data-hotspot-scene="player-board"][data-hotspot-id="data-pool"]',
    );
    if (!(dataPool instanceof HTMLElement)) {
      throw new Error('Expected player board data pool hotspot');
    }
    fireEvent.mouseEnter(dataPool);
    expect(screen.getByText('player board data pool')).toBeInTheDocument();
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
