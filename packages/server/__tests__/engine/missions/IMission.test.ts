import { EMissionEventType, EMissionType } from '@/engine/missions/IMission.js';

describe('IMission enums', () => {
  it('defines mission types', () => {
    expect(EMissionType.FULL).toBe('FULL');
    expect(EMissionType.QUICK).toBe('QUICK');
  });

  it('defines mission event types', () => {
    expect(EMissionEventType.CARD_PLAYED).toBe('CARD_PLAYED');
    expect(EMissionEventType.TECH_RESEARCHED).toBe('TECH_RESEARCHED');
    expect(EMissionEventType.SIGNAL_PLACED).toBe('SIGNAL_PLACED');
    expect(EMissionEventType.TRACE_MARKED).toBe('TRACE_MARKED');
  });
});
