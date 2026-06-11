import { EGameEventType } from '@seti/common/types/protocol/events';
import { EventLog } from '@/engine/event/EventLog.js';
import {
  createActionEvent,
  createRoundEndEvent,
} from '@/engine/event/GameEvent.js';

describe('EventLog', () => {
  it('injects sequence and turn context when appending event drafts', () => {
    const log = new EventLog(500, () => ({
      turnIndex: 7,
      round: 2,
    }));

    log.append(createActionEvent('p1', 'PASS'));
    log.append(createRoundEndEvent());

    expect(log.size()).toBe(2);
    expect(log.recent(1)).toEqual([
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        seq: 2,
        round: 2,
        turnIndex: 7,
        actorId: null,
        id: expect.any(String),
      }),
    ]);
  });

  it('keeps full history for persistence while limiting recent event reads', () => {
    const log = new EventLog(2, () => ({ turnIndex: 1, round: 1 }));

    log.append(createRoundEndEvent());
    log.append(createRoundEndEvent());
    log.append(createRoundEndEvent());

    expect(log.toArray()).toEqual([
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        seq: 1,
        id: expect.any(String),
      }),
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        seq: 2,
        id: expect.any(String),
      }),
      expect.objectContaining({
        type: EGameEventType.ROUND_END,
        seq: 3,
        id: expect.any(String),
      }),
    ]);
    expect(log.recent(10).map((event) => event.seq)).toEqual([2, 3]);
    expect(log.since(0).map((event) => event.seq)).toEqual([1, 2, 3]);
  });

  it('assigns deterministic metadata per log instance', () => {
    const first = new EventLog();
    const second = new EventLog();

    first.append(createActionEvent('p1', 'PASS'));
    second.append(createActionEvent('p1', 'PASS'));

    expect(first.toArray()).toEqual(second.toArray());
    expect(first.toArray()[0]).toMatchObject({
      id: 'event-1',
      seq: 1,
      actorId: 'p1',
    });
  });

  it('keeps appended event sequence monotonic after restored events', () => {
    const log = new EventLog();
    log.append({
      id: 'legacy-event',
      type: EGameEventType.ROUND_END,
      round: 1,
      turnIndex: 1,
      actorId: null,
      level: 'info',
      seq: 1_000_000,
    });

    log.append(createActionEvent('p1', 'PASS'));

    expect(log.toArray()[1]).toMatchObject({
      id: 'event-lflt',
      seq: 1_000_001,
    });
  });

  it('returns events appended after a sequence', () => {
    const log = new EventLog();

    log.append(createActionEvent('p1', 'SCAN'));
    log.append(createActionEvent('p1', 'PASS'));
    log.append(createRoundEndEvent());

    expect(log.since(1).map((event) => event.seq)).toEqual([2, 3]);
    expect(log.since(3)).toEqual([]);
  });
});
