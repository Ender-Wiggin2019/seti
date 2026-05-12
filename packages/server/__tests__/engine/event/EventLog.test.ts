import { EGameEventType } from '@seti/common/types/protocol/events';
import { EventLog } from '@/engine/event/EventLog.js';

describe('EventLog', () => {
  it('appends events and returns recent entries', () => {
    const log = new EventLog();

    log.append({
      type: EGameEventType.ACTION,
      playerId: 'p1',
      action: 'PASS',
      at: 1,
    });
    log.append({ type: EGameEventType.ROUND_END, round: 1, at: 2 });

    expect(log.size()).toBe(2);
    expect(log.recent(1)).toEqual([
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        round: 1,
        at: 2,
        id: expect.any(String),
      }),
    ]);
  });

  it('enforces capacity by dropping oldest events', () => {
    const log = new EventLog(2);

    log.append({ type: EGameEventType.ROUND_END, round: 1, at: 1 });
    log.append({ type: EGameEventType.ROUND_END, round: 2, at: 2 });
    log.append({ type: EGameEventType.ROUND_END, round: 3, at: 3 });

    expect(log.toArray()).toEqual([
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        round: 2,
        at: 2,
        id: expect.any(String),
      }),
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        round: 3,
        at: 3,
        id: expect.any(String),
      }),
    ]);
  });
});
