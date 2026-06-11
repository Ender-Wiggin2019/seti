import { EResource } from '@seti/common/types/element';
import { EAnimationStepKind } from '@seti/common/types/protocol/animation';
import { ETrace } from '@seti/common/types/protocol/enums';
import { EventLog } from '@/engine/event/EventLog.js';
import {
  createActionEvent,
  createDiscRotatedEvent,
  createProbeMovedEvent,
  createResourceChangeEvent,
  createScoreChangeEvent,
  createTraceMarkedEvent,
} from '@/engine/event/GameEvent.js';
import { buildAnimationBatch } from '@/gateway/AnimationProjector.js';

describe('AnimationProjector', () => {
  it('projects registered events into ordered animation steps', () => {
    const log = new EventLog(500, () => ({ turnIndex: 4, round: 2 }));
    const action = log.append(createActionEvent('p1', 'SCAN'));
    const moved = log.append(
      createProbeMovedEvent('p1', 'probe-1', ['s0', 's1', 's2'], 1),
    );
    const rotated = log.append(createDiscRotatedEvent(2, 1));
    const resource = log.append(
      createResourceChangeEvent('p1', EResource.CREDIT, 6, 4),
    );
    const score = log.append(createScoreChangeEvent('p1', 10, 12, 'mission'));
    const trace = log.append(
      createTraceMarkedEvent('p1', ETrace.BLUE, 0, false),
    );

    const batch = buildAnimationBatch(log.toArray(), 'p1', 4, 9);

    expect(batch).toEqual({
      batchId: `animation-${action.seq}-${trace.seq}`,
      actorId: 'p1',
      turnIndex: 4,
      finalStateVersion: 9,
      steps: [
        {
          kind: EAnimationStepKind.PROBE_MOVE,
          sourceEventId: moved.id,
          durationMs: 1800,
          actorId: 'p1',
          probeId: 'probe-1',
          path: ['s0', 's1', 's2'],
        },
        {
          kind: EAnimationStepKind.DISC_ROTATE,
          sourceEventId: rotated.id,
          durationMs: 900,
          ring: 2,
          steps: 1,
        },
        {
          kind: EAnimationStepKind.RESOURCE_DELTA,
          sourceEventId: resource.id,
          durationMs: 500,
          actorId: 'p1',
          resource: EResource.CREDIT,
          before: 6,
          after: 4,
        },
        {
          kind: EAnimationStepKind.SCORE_DELTA,
          sourceEventId: score.id,
          durationMs: 500,
          actorId: 'p1',
          before: 10,
          after: 12,
          source: 'mission',
        },
        {
          kind: EAnimationStepKind.TRACE_PLACE,
          sourceEventId: trace.id,
          durationMs: 500,
          actorId: 'p1',
          traceColor: ETrace.BLUE,
          alienIndex: 0,
          isOverflow: false,
        },
      ],
    });
  });

  it('returns null when no event has an animation renderer', () => {
    const log = new EventLog(500, () => ({ turnIndex: 1, round: 1 }));
    log.append(createActionEvent('p1', 'PASS'));

    expect(buildAnimationBatch(log.toArray(), 'p1', 1, 2)).toBeNull();
  });
});
