import { describe, expect, it } from 'vitest';
import type { IPublicMilestoneState } from '@/types/re-exports';
import { buildMilestoneItems } from '../GameLayout';

describe('buildMilestoneItems', () => {
  const baseState: IPublicMilestoneState = {
    goldMilestones: [{ threshold: 25, resolvedPlayerIds: ['p1'] }],
    neutralMilestones: [
      { threshold: 20, resolvedPlayerIds: ['p2'], markersRemaining: 2 },
    ],
  };

  it('includes open entries when capacity remains for gold milestones', () => {
    const items = buildMilestoneItems(baseState, {
      p1: '#f00',
      p2: '#0f0',
      p3: '#00f',
    });
    const goldItems = items.filter((item) => item.type === 'gold');

    expect(goldItems.some((item) => item.claimedBy === 'p1')).toBe(true);
    expect(goldItems.some((item) => item.claimedBy === undefined)).toBe(true);
  });

  it('creates one placeholder per remaining neutral marker', () => {
    const items = buildMilestoneItems(baseState, { p1: '#f00' });
    const neutralOpen = items.filter(
      (item) => item.type === 'neutral' && item.claimedBy === undefined,
    );
    expect(neutralOpen).toHaveLength(2);
  });
});
