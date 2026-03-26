import { EPriority } from './Priority.js';

describe('EPriority', () => {
  it('orders priorities from high to low as ascending numbers', () => {
    expect(EPriority.COST).toBe(0);
    expect(EPriority.COST).toBeLessThan(EPriority.ROTATION);
    expect(EPriority.ROTATION).toBeLessThan(EPriority.CORE_EFFECT);
    expect(EPriority.CORE_EFFECT).toBeLessThan(EPriority.IMMEDIATE_REWARD);
    expect(EPriority.IMMEDIATE_REWARD).toBeLessThan(EPriority.CARD_TRIGGER);
    expect(EPriority.CARD_TRIGGER).toBeLessThan(EPriority.SECTOR_COMPLETION);
    expect(EPriority.SECTOR_COMPLETION).toBeLessThan(EPriority.DEFAULT);
    expect(EPriority.DEFAULT).toBeLessThan(EPriority.HAND_LIMIT);
    expect(EPriority.HAND_LIMIT).toBeLessThan(EPriority.END_OF_ROUND_CARD);
    expect(EPriority.END_OF_ROUND_CARD).toBeLessThan(EPriority.MILESTONE);
    expect(EPriority.MILESTONE).toBeLessThan(EPriority.DISCOVERY);
    expect(EPriority.DISCOVERY).toBeLessThan(EPriority.TURN_HANDOFF);
  });
});
