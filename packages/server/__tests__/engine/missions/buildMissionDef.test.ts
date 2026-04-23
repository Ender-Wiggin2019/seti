import {
  buildMissionDefWithEventMatchers,
  buildQuickMissionDef,
} from '@/engine/missions/buildMissionDef.js';
import { EMissionEventType, EMissionType } from '@/engine/missions/IMission.js';

describe('buildMissionDef', () => {
  it('buildQuickMissionDef attaches custom condition to all branches', () => {
    const checkCondition = vi.fn(() => true);

    const def = buildQuickMissionDef('70', checkCondition);

    expect(def.cardId).toBe('70');
    expect(def.type).toBe(EMissionType.QUICK);
    expect(def.branches.length).toBeGreaterThan(0);
    expect(def.branches[0]?.checkCondition).toBe(checkCondition);
  });

  it('buildMissionDefWithEventMatchers attaches matcher by branch index', () => {
    const matcher = vi.fn(
      (event: { type: EMissionEventType }) =>
        event.type === EMissionEventType.PROBE_LAUNCHED,
    );

    const def = buildMissionDefWithEventMatchers('70', [matcher]);

    expect(def.cardId).toBe('70');
    expect(def.branches[0]?.matchEvent).toBe(matcher);
  });
});
