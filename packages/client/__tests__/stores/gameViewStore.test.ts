import { beforeEach, describe, expect, it } from 'vitest';
import { useGameViewStore } from '@/stores/gameViewStore';

describe('useGameViewStore', () => {
  beforeEach(() => {
    useGameViewStore.setState({
      activeTab: 'board',
      zoom: 1,
      hoveredPieceId: null,
    });
  });

  it('updates board tab and zoom', () => {
    useGameViewStore.getState().setActiveTab('tech');
    useGameViewStore.getState().setZoom(1.25);

    expect(useGameViewStore.getState().activeTab).toBe('tech');
    expect(useGameViewStore.getState().zoom).toBe(1.25);
  });

  it('tracks hovered piece id', () => {
    useGameViewStore.getState().setHoveredPieceId('probe-1');

    expect(useGameViewStore.getState().hoveredPieceId).toBe('probe-1');
  });
});
