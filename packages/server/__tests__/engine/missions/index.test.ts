import * as missions from '@/engine/missions/index.js';

describe('missions index', () => {
  it('re-exports mission builders and tracker', () => {
    expect(missions.buildQuickMissionDef).toBeTypeOf('function');
    expect(missions.applyMissionRewards).toBeTypeOf('function');
    expect(missions.MissionTracker).toBeDefined();
    expect(missions.EMissionType).toBeDefined();
  });
});
