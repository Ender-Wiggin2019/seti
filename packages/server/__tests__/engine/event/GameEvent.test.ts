import { EResource } from '@seti/common/types/element';
import {
  createActionEvent,
  createDiscRotatedEvent,
  createGameEndEvent,
  createProbeMovedEvent,
  createResourceChangeEvent,
  createRoundEndEvent,
  createScoreChangeEvent,
} from '@/engine/event/GameEvent.js';

describe('GameEvent helpers', () => {
  it('creates action event draft with expected semantic fields', () => {
    const event = createActionEvent('p1', 'SCAN', { sector: 'RED' });

    expect(event.type).toBe('ACTION');
    expect('id' in event).toBe(false);
    expect('seq' in event).toBe(false);
    expect(event.actorId).toBe('p1');
    expect(event.level).toBe('info');
    expect(event).toMatchObject({
      type: 'ACTION',
      action: 'SCAN',
      details: { sector: 'RED' },
    });
  });

  it('creates movement and rotation event drafts', () => {
    const moveEvent = createProbeMovedEvent('p1', 'probe-1', [
      'ring-1-cell-0',
      'ring-1-cell-1',
    ]);
    const rotateEvent = createDiscRotatedEvent(2, 3);

    expect(moveEvent).toMatchObject({
      type: 'PROBE_MOVED',
      actorId: 'p1',
      probeId: 'probe-1',
      path: ['ring-1-cell-0', 'ring-1-cell-1'],
    });
    expect(rotateEvent).toMatchObject({
      type: 'DISC_ROTATED',
      actorId: null,
      ring: 2,
      steps: 3,
    });
  });

  it('creates resource and score delta event drafts with before and after values', () => {
    const resourceEvent = createResourceChangeEvent(
      'p1',
      EResource.CREDIT,
      6,
      4,
    );
    const scoreEvent = createScoreChangeEvent('p1', 10, 12, 'mission');

    expect(resourceEvent).toMatchObject({
      type: 'RESOURCE_CHANGED',
      actorId: 'p1',
      resource: EResource.CREDIT,
      before: 6,
      after: 4,
    });
    expect(scoreEvent).toMatchObject({
      type: 'SCORE_CHANGED',
      actorId: 'p1',
      before: 10,
      after: 12,
      source: 'mission',
    });
  });

  it('creates round end and game end event drafts', () => {
    const roundEvent = createRoundEndEvent();
    const gameEvent = createGameEndEvent({ p1: 42, p2: 40 });

    expect(roundEvent).toMatchObject({
      type: 'ROUND_END',
      actorId: null,
      level: 'info',
    });
    expect(gameEvent).toMatchObject({
      type: 'GAME_END',
      actorId: null,
      finalScores: { p1: 42, p2: 40 },
    });
  });
});
