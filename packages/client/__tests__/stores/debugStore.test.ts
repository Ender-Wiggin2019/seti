import { beforeEach, describe, expect, it } from 'vitest';
import { useDebugStore } from '@/stores/debugStore';

describe('useDebugStore hotspot settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useDebugStore.setState({
      textMode: false,
      hotspotDebug: false,
      showInteractiveHotspots: true,
      showAnchorHotspots: true,
      hotspotOverrides: {},
      hotspotDraftOverrides: {},
    });
  });

  it('toggles hotspot debug independently from text mode', () => {
    useDebugStore.getState().setTextMode(true);
    useDebugStore.getState().setHotspotDebug(true);

    expect(useDebugStore.getState().textMode).toBe(true);
    expect(useDebugStore.getState().hotspotDebug).toBe(true);

    useDebugStore.getState().toggleHotspotDebug();

    expect(useDebugStore.getState().textMode).toBe(true);
    expect(useDebugStore.getState().hotspotDebug).toBe(false);
  });

  it('toggles interactive and anchor hotspot visibility independently', () => {
    useDebugStore.getState().setShowInteractiveHotspots(false);
    useDebugStore.getState().setShowAnchorHotspots(false);

    expect(useDebugStore.getState().showInteractiveHotspots).toBe(false);
    expect(useDebugStore.getState().showAnchorHotspots).toBe(false);
  });

  it('restores both hotspot layers when enabling hotspot debug', () => {
    useDebugStore.getState().setShowInteractiveHotspots(false);
    useDebugStore.getState().setShowAnchorHotspots(false);

    useDebugStore.getState().setHotspotDebug(true);

    expect(useDebugStore.getState().hotspotDebug).toBe(true);
    expect(useDebugStore.getState().showInteractiveHotspots).toBe(true);
    expect(useDebugStore.getState().showAnchorHotspots).toBe(true);
  });

  it('keeps hotspot edits in draft until they are saved', () => {
    useDebugStore.getState().setHotspotDraftOverride('solar', 'earth-launch', {
      x: 120,
      y: 88,
      width: 32,
      height: 32,
    });

    expect(useDebugStore.getState().hotspotOverrides).toEqual({});
    expect(useDebugStore.getState().hotspotDraftOverrides).toEqual({
      solar: {
        'earth-launch': {
          x: 120,
          y: 88,
          width: 32,
          height: 32,
        },
      },
    });

    useDebugStore.getState().saveHotspotOverrides();

    expect(useDebugStore.getState().hotspotOverrides).toEqual({
      solar: {
        'earth-launch': {
          x: 120,
          y: 88,
          width: 32,
          height: 32,
        },
      },
    });
    expect(useDebugStore.getState().hotspotDraftOverrides).toEqual({});
  });

  it('resets committed and draft hotspot overrides together', () => {
    useDebugStore.getState().setHotspotDraftOverride('solar', 'earth-launch', {
      x: 120,
    });
    useDebugStore.getState().saveHotspotOverrides();
    useDebugStore.getState().setHotspotDraftOverride('solar', 'earth-launch', {
      y: 88,
    });

    useDebugStore.getState().resetHotspotOverrides('solar');

    expect(useDebugStore.getState().hotspotOverrides).toEqual({});
    expect(useDebugStore.getState().hotspotDraftOverrides).toEqual({});
  });

  it('does not persist hotspot overrides to localStorage', () => {
    useDebugStore.getState().setHotspotDraftOverride('solar', 'earth-launch', {
      x: 120,
      y: 88,
      width: 32,
      height: 32,
    });

    const draftSnapshot = JSON.parse(
      window.localStorage.getItem('seti-debug') ?? '{}',
    ) as { state?: Record<string, unknown> };
    expect(draftSnapshot.state?.hotspotDraftOverrides).toBeUndefined();
    expect(draftSnapshot.state?.hotspotOverrides).toBeUndefined();

    useDebugStore.getState().saveHotspotOverrides();

    const savedSnapshot = JSON.parse(
      window.localStorage.getItem('seti-debug') ?? '{}',
    ) as { state?: Record<string, unknown> };
    expect(savedSnapshot.state?.hotspotDraftOverrides).toBeUndefined();
    expect(savedSnapshot.state?.hotspotOverrides).toBeUndefined();
  });
});
