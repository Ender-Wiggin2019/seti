import type { IBaseCard } from '@seti/common/types/BaseCard';
import { DEFAULT_COLUMN_CONFIGS } from '@seti/common/types/computer';
import { EResource, ETech } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EFreeAction, EMainAction } from '@seti/common/types/protocol/enums';
import { ETechId } from '@seti/common/types/tech';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerDashboard } from '@/features/player';
import { getTechTileImageById } from '@/features/tech/techTileImages';
import { useDebugStore } from '@/stores/debugStore';
import { createMockPlayerState } from '../../../test/mocks/gameState';

function createCard(id: string, name = `Card ${id}`): IBaseCard {
  return {
    id,
    name,
    price: 1,
    income: EResource.CREDIT,
    effects: [],
  };
}

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
    useDebugStore.setState({ textMode: true });

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

  it('renders the supplied player board artwork in image mode', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          dataPoolCount: 2,
          techs: [ETechId.PROBE_ASTEROID, ETechId.SCAN_EARTH_LOOK],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
        income={{ credit: 2, energy: 1, card: 1 }}
      />,
    );

    const imageModeBoard = screen.getByTestId('player-board-image-mode');
    expect(imageModeBoard).toBeInTheDocument();
    expect(imageModeBoard).toHaveClass('aspect-[2160/728]');
    expect(screen.getByTestId('player-board-image')).toHaveAttribute(
      'src',
      '/assets/seti/refine/8e4f86f5-9689-4000-88fd-344aa94604eb.png',
    );
    expect(screen.queryByTestId('tech-row')).not.toBeInTheDocument();
    expect(screen.queryByTestId('computer-row')).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^player-board-data-token-/)).toHaveLength(2);
  });

  it('keeps income and mission summary areas visible in image mode', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          techs: [ETechId.PROBE_ASTEROID],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
        income={{ credit: 2, energy: 1, card: 1 }}
        playedMissions={[createCard('mission-1'), createCard('mission-2')]}
      />,
    );

    expect(screen.getByTestId('player-board-image-mode')).toBeInTheDocument();
    expect(screen.getByTestId('income-tracker')).toBeInTheDocument();
    expect(
      screen.getByTestId('player-board-mission-summary'),
    ).toHaveTextContent('2');
    expect(
      screen.getByTestId('player-board-mission-summary'),
    ).toHaveTextContent('1');
  });

  it('places income above the player board when no organization is present', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState()}
        pendingInput={null}
        onFreeAction={() => undefined}
        income={{ credit: 2, energy: 1, card: 1 }}
      />,
    );

    const incomeTracker = screen.getByTestId('income-tracker');
    const playerBoard = screen.getByTestId('player-board-image-mode');

    expect(
      incomeTracker.compareDocumentPosition(playerBoard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('places income in the organization row when organizations are present', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.HELION_ASSEMBLY],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
        income={{ credit: 2, energy: 1, card: 1 }}
      />,
    );

    const organizationRow = screen.getByTestId('player-organizations');
    const incomeTracker = screen.getByTestId('income-tracker');
    const playerBoard = screen.getByTestId('player-board-image-mode');

    expect(organizationRow).toContainElement(incomeTracker);
    expect(
      incomeTracker.compareDocumentPosition(playerBoard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('uses image-mode computer hotspots for place-data interaction', () => {
    const onFreeAction = vi.fn();
    const computer = {
      columns: Array.from({ length: 6 }, (_, index) => ({
        topFilled: index === 0,
        topReward: null,
        techId: null,
        hasBottomSlot: false,
        bottomFilled: false,
        bottomReward: null,
        techSlotAvailable: true,
      })),
    };

    render(
      <PlayerDashboard
        player={createMockPlayerState({
          computer,
          dataPoolCount: 1,
        })}
        pendingInput={null}
        onFreeAction={onFreeAction}
      />,
    );

    const topSlot = screen.getByTestId('player-board-computer-slot-top-1');
    expect(topSlot).toHaveAttribute('data-hotspot-scene', 'player-board');
    expect(topSlot).toHaveAttribute('data-hotspot-id', 'computer-top-1');
    expect(topSlot).toHaveAttribute('data-hotspot-variant', 'image');
    expect(topSlot).toHaveAttribute('data-hotspot-role', 'interactive');

    fireEvent.click(topSlot);

    expect(onFreeAction).toHaveBeenCalledWith({
      type: EFreeAction.PLACE_DATA,
      slotIndex: 1,
    });
  });

  it('does not expose impossible bottom computer slots for built-in reward columns', () => {
    const computer = {
      columns: DEFAULT_COLUMN_CONFIGS.map((config) => ({
        topFilled: false,
        topReward: config.topReward,
        techId: null,
        hasBottomSlot: false,
        bottomFilled: false,
        bottomReward: null,
        techSlotAvailable: config.techSlotAvailable,
      })),
    };

    const { container } = render(
      <PlayerDashboard
        player={createMockPlayerState({ computer })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-0"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-1"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-2"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-3"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-4"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id="computer-bottom-5"]'),
    ).toBeInTheDocument();
  });

  it('uses image-mode main action hotspots for launch scan and analyze', () => {
    const onMainAction = vi.fn();

    render(
      <PlayerDashboard
        player={createMockPlayerState()}
        pendingInput={null}
        onFreeAction={() => undefined}
        onMainAction={onMainAction}
        availableMainActions={[
          EMainAction.LAUNCH_PROBE,
          EMainAction.SCAN,
          EMainAction.ANALYZE_DATA,
        ]}
      />,
    );

    for (const [testId, action] of [
      ['player-board-main-action-launch-probe', EMainAction.LAUNCH_PROBE],
      ['player-board-main-action-scan', EMainAction.SCAN],
      ['player-board-main-action-analyze-data', EMainAction.ANALYZE_DATA],
    ] as const) {
      const hotspot = screen.getByTestId(testId);
      expect(hotspot).toHaveAttribute('data-hotspot-scene', 'player-board');
      expect(hotspot).toHaveAttribute('data-hotspot-variant', 'image');
      fireEvent.click(hotspot);
      expect(onMainAction).toHaveBeenLastCalledWith({ type: action });
    }
  });

  it('exposes and renders all 12 player board tech slots in image mode', () => {
    const allTechIds = Object.values(ETechId);

    render(
      <PlayerDashboard
        player={createMockPlayerState({
          techs: allTechIds,
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    for (const techId of allTechIds) {
      const slot = screen.getByTestId(`player-board-tech-slot-${techId}`);
      expect(slot).toHaveAttribute('data-hotspot-scene', 'player-board');
      expect(slot).toHaveAttribute('data-hotspot-id', `tech-slot-${techId}`);
      expect(slot).toHaveAttribute('data-hotspot-variant', 'image');
      expect(Number.parseFloat(slot.style.width)).toBeCloseTo(
        (197 / 2160) * 100,
        5,
      );
      expect(Number.parseFloat(slot.style.height)).toBeCloseTo(
        (276 / 728) * 100,
        5,
      );
      expect(screen.getByTestId(`player-board-tech-${techId}`)).toHaveAttribute(
        'src',
        getTechTileImageById(techId),
      );
    }
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
    expect(organizationCard).toHaveTextContent('1x');
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

  it('renders image-mode organization cards at the original image aspect without direct ability text', () => {
    render(
      <PlayerDashboard
        player={createMockPlayerState({
          organizationIds: [EOrganizationId.HELION_ASSEMBLY],
        })}
        pendingInput={null}
        onFreeAction={() => undefined}
      />,
    );

    const organizationCard = screen.getByTestId(
      `organization-card-${EOrganizationId.HELION_ASSEMBLY}`,
    );
    expect(organizationCard).toHaveClass('aspect-[671/507]');
    expect(organizationCard).not.toHaveTextContent(
      /free action|destroy one of your probe\/orange or scan\/purple techs/i,
    );
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

  it('exposes image-mode organization use markers through the shared anchor debug layer', () => {
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

    const marker = screen.getByTestId(
      `organization-power-card-${EOrganizationId.HELION_ASSEMBLY}`,
    );
    const anchor = screen.getByTestId(
      `organization-power-anchor-${EOrganizationId.HELION_ASSEMBLY}`,
    );
    expect(anchor).toHaveAttribute('data-hotspot-scene', 'corporation-board');
    expect(anchor).toHaveAttribute(
      'data-hotspot-id',
      `${EOrganizationId.HELION_ASSEMBLY}-power`,
    );
    expect(anchor).toHaveAttribute('data-hotspot-role', 'anchor');
    expect(marker).toHaveAttribute('data-hotspot-scene', 'corporation-board');
    expect(marker).toHaveAttribute(
      'data-hotspot-id',
      `${EOrganizationId.HELION_ASSEMBLY}-power`,
    );
    expect(marker).toHaveAttribute('data-hotspot-role', 'interactive');
    fireEvent.mouseEnter(marker);
    expect(screen.getByText('Helion Assembly use marker')).toBeInTheDocument();
  });

  it('renders paired image-mode organization hotspots for the use marker', () => {
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

    const hotspots = screen
      .getByTestId(`organization-card-${EOrganizationId.HELION_ASSEMBLY}`)
      .querySelectorAll('[data-hotspot-scene="corporation-board"]');

    expect(hotspots).toHaveLength(2);
    expect(
      screen.getByTestId(
        `organization-power-anchor-${EOrganizationId.HELION_ASSEMBLY}`,
      ),
    ).toHaveAttribute('data-hotspot-role', 'anchor');
    expect(
      screen.getByTestId(
        `organization-power-card-${EOrganizationId.HELION_ASSEMBLY}`,
      ),
    ).toHaveAttribute('data-hotspot-role', 'interactive');
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
