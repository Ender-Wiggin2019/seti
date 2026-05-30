import {
  PLANETARY_BOARD_CONFIG,
  PLANETARY_PLANETS,
} from '@seti/common/constant/boardLayout';
import { EAlienType } from '@seti/common/types/BaseCard';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HotspotsDebugPage } from '@/pages/game/HotspotsDebugPage';
import { useDebugStore } from '@/stores/debugStore';

vi.mock('@/features/hotspots/hotspotOverridesApi', () => ({
  createSolarHotspotSpaceId: (index: number) => {
    const ringIndex = Math.floor(index / 8) + 1;
    const sectorIndex = index % 8;
    return `ring-${ringIndex}-cell-${sectorIndex * ringIndex}`;
  },
  loadHotspotOverridesFile: vi.fn(async () => ({})),
  saveHotspotOverridesFile: vi.fn(async () => undefined),
}));

import {
  loadHotspotOverridesFile,
  saveHotspotOverridesFile,
} from '@/features/hotspots/hotspotOverridesApi';

const loadHotspotOverridesFileMock = vi.mocked(loadHotspotOverridesFile);
const saveHotspotOverridesFileMock = vi.mocked(saveHotspotOverridesFile);

describe('HotspotsDebugPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loadHotspotOverridesFileMock.mockResolvedValue({});
    saveHotspotOverridesFileMock.mockResolvedValue(undefined);
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      showInteractiveHotspots: true,
      showAnchorHotspots: true,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
  });

  it('is a standalone hotspot calibration surface and turns hotspot debug on', async () => {
    render(<HotspotsDebugPage />);

    expect(screen.getByTestId('hotspots-debug-page')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Hotspot Debug' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Solar System' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    for (const tab of [
      'Solar System',
      'Sectors',
      'Planet Board',
      'Tech Board',
      'Personal Board',
      'Rival Board',
      'Aliens',
      'Corporations',
    ]) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });
    const spaceHotspot = await screen.findByTestId('solar-space-ring-1-cell-0');
    expect(screen.queryByText('ring-1-cell-0')).not.toBeInTheDocument();

    fireEvent.mouseEnter(spaceHotspot);

    expect(screen.getByText('ring-1-cell-0')).toBeInTheDocument();
  });

  it('saves draft hotspot edits only when Save Hotspots is clicked', async () => {
    render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });
    const saveButton = screen.getByRole('button', { name: 'Save Hotspots' });
    expect(saveButton).toBeDisabled();

    act(() => {
      useDebugStore
        .getState()
        .setHotspotDraftOverride('solar-system', 'ring-1-cell-0', {
          x: 120,
          y: 88,
          width: 32,
          height: 32,
        });
    });

    expect(saveButton).not.toBeDisabled();
    expect(useDebugStore.getState().hotspotOverrides).toEqual({});

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotOverrides).toEqual({
        'solar-system': {
          'ring-1-cell-0': {
            x: 120,
            y: 88,
            width: 32,
            height: 32,
          },
        },
      });
    });
    expect(useDebugStore.getState().hotspotDraftOverrides).toEqual({});
    expect(saveButton).toBeDisabled();
    await waitFor(() => {
      expect(saveHotspotOverridesFileMock).toHaveBeenCalledWith({
        'solar-system': {
          'ring-1-cell-0': {
            x: 120,
            y: 88,
            width: 32,
            height: 32,
          },
        },
      });
    });
  });

  it('loads saved hotspot overrides from the JSON source', async () => {
    loadHotspotOverridesFileMock.mockResolvedValue({
      'solar-system': {
        'ring-1-cell-0': { x: 120, y: 88, width: 32, height: 32 },
      },
    });

    render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotOverrides).toEqual({
        'solar-system': {
          'ring-1-cell-0': { x: 120, y: 88, width: 32, height: 32 },
        },
      });
    });
  });

  it('uses explicit image and text mode controls', async () => {
    render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });

    const imageModeButton = screen.getByRole('button', { name: 'Image Mode' });
    const textModeButton = screen.getByRole('button', { name: 'Text Mode' });
    expect(imageModeButton).toHaveAttribute('aria-pressed', 'true');
    expect(textModeButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Text Mode Off' })).toBeNull();

    fireEvent.click(textModeButton);

    expect(useDebugStore.getState().textMode).toBe(true);
    expect(imageModeButton).toHaveAttribute('aria-pressed', 'false');
    expect(textModeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters interactive hotspots and pure anchors independently', async () => {
    render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });

    const spaceHotspot = screen.getByTestId('solar-space-ring-1-cell-0');
    const sunAnchor = screen.getByTestId('solar-sun');
    fireEvent.mouseEnter(spaceHotspot);
    expect(screen.getByText('ring-1-cell-0')).toBeInTheDocument();
    fireEvent.mouseLeave(spaceHotspot);
    fireEvent.mouseEnter(sunAnchor);
    expect(screen.getByText('solar sun')).toBeInTheDocument();
    fireEvent.mouseLeave(sunAnchor);

    fireEvent.click(screen.getByRole('button', { name: 'Anchors On' }));

    fireEvent.mouseEnter(sunAnchor);
    expect(screen.queryByText('solar sun')).not.toBeInTheDocument();
    fireEvent.mouseEnter(spaceHotspot);
    expect(screen.getByText('ring-1-cell-0')).toBeInTheDocument();
    fireEvent.mouseLeave(spaceHotspot);

    fireEvent.click(screen.getByRole('button', { name: 'Interactive On' }));

    fireEvent.mouseEnter(spaceHotspot);
    expect(screen.queryByText('ring-1-cell-0')).not.toBeInTheDocument();
    expect(useDebugStore.getState().showAnchorHotspots).toBe(false);
    expect(useDebugStore.getState().showInteractiveHotspots).toBe(false);
  });

  it('switches tabs to each component family with visible hotspot scenes', async () => {
    const { container } = render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });
    expect(
      container.querySelector('[data-hotspot-scene="solar-system"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(
        `[data-testid^="solar-alien-token-${EAlienType.ANOMALIES}-"]`,
      ),
    ).toHaveLength(6);

    fireEvent.click(screen.getByRole('tab', { name: 'Sectors' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-sectors'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="sector-board"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Planet Board' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-planet'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="planet-board"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Tech Board' }));
    expect(screen.getByTestId('hotspots-debug-panel-tech')).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="tech-board"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Personal Board' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-player'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="player-board"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Rival Board' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-rival'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="rival-board"]'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Aliens' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-aliens'),
    ).toBeInTheDocument();
    for (const alien of [
      'Anomalies',
      'Centaurians',
      'Exertians',
      'Mascamites',
      'Oumuamua',
      'Glyphids',
      'Amoeba',
      'Arkhos',
    ]) {
      expect(screen.getAllByText(alien).length).toBeGreaterThan(0);
    }
    expect(
      container.querySelector('[data-hotspot-scene="alien-board"]'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('anomalies red-trace trace 1'),
    ).not.toBeInTheDocument();
    fireEvent.mouseEnter(
      screen.getByTestId('alien-0-anomalies-marker-red-trace-0'),
    );
    expect(screen.getByText('anomalies red-trace trace 1')).toBeInTheDocument();
    fireEvent.mouseEnter(
      screen.getByTestId('alien-1-centaurians-marker-red-trace-0-0'),
    );
    expect(
      screen.getByText('centaurians red-trace trace 1'),
    ).toBeInTheDocument();
    const centauriansTopRedSlot = screen.getByTestId(
      'alien-1-centaurians-slot-red-trace-4',
    );
    fireEvent.mouseEnter(centauriansTopRedSlot);
    expect(screen.getByText('Trace bonus: 6 VP')).toBeInTheDocument();
    const mascamitesBottomRedSlot = screen.getByTestId(
      'alien-3-mascamites-slot-red-trace-0',
    );
    fireEvent.mouseEnter(mascamitesBottomRedSlot);
    expect(
      screen.getByText('Trace bonus: 5 VP + DRAW_ALIEN_CARD'),
    ).toBeInTheDocument();
    const mascamitesFirstSampleSlot = screen.getByTestId(
      'alien-3-mascamites-slot-blue-trace-2',
    );
    fireEvent.mouseEnter(mascamitesFirstSampleSlot);
    expect(screen.getByText('Trace bonus: 2 credit')).toBeInTheDocument();
    const mascamitesLastSampleSlot = screen.getByTestId(
      'alien-3-mascamites-slot-blue-trace-8',
    );
    fireEvent.mouseEnter(mascamitesLastSampleSlot);
    expect(screen.getByText('Trace bonus: 7 VP')).toBeInTheDocument();
    const oumuamuaBottomSlot = screen.getByTestId(
      'alien-4-oumuamua-slot-red-trace-0',
    );
    fireEvent.mouseEnter(oumuamuaBottomSlot);
    expect(screen.getByText('Trace bonus: 25 VP')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Corporations' }));
    expect(
      screen.getByTestId('hotspots-debug-panel-corporations'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-scene="corporation-board"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-hotspot-id$="-used-badge"]'),
    ).toBeInTheDocument();
  });

  it('shows every configured planet board orbit, land, and moon hotspot', async () => {
    const { container } = render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Planet Board' }));

    const expectedHotspotIds = PLANETARY_PLANETS.flatMap((planet) => {
      const config = PLANETARY_BOARD_CONFIG[planet];
      let moonOrdinal = 0;
      return [
        ...config.orbitSlots.map((_, index) => `${planet}-orbit-${index}`),
        ...config.landingSlots.map((_, index) => {
          if (config.landingSlotKinds[index] !== 'moon') {
            return `${planet}-planet-land-${index}`;
          }
          const moonId = config.moonIds[moonOrdinal];
          moonOrdinal += 1;
          return `${planet}-moon-${moonId}`;
        }),
      ];
    });

    for (const hotspotId of expectedHotspotIds) {
      expect(
        container.querySelector(
          `[data-hotspot-scene="planet-board"][data-hotspot-id="${hotspotId}"]`,
        ),
      ).toBeInTheDocument();
    }
    expect(
      container.querySelectorAll('[data-hotspot-scene="planet-board"]'),
    ).toHaveLength(expectedHotspotIds.length);
  });

  it('renders sector slots fully populated with no empty debug placeholders', async () => {
    const { container } = render(<HotspotsDebugPage />);

    await waitFor(() => {
      expect(useDebugStore.getState().hotspotDebug).toBe(true);
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Sectors' }));

    expect(
      container.querySelectorAll(
        '[data-hotspot-scene="sector-board"][data-signal-type="empty"]',
      ),
    ).toHaveLength(0);
  });
});
