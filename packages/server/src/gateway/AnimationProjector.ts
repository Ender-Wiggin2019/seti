import {
  EAnimationStepKind,
  type IAnimationBatch,
  type TAnimationStep,
} from '@seti/common/types/protocol/animation';
import {
  EGameEventType,
  type TGameEvent,
} from '@seti/common/types/protocol/events';

type TStepFactory = (event: TGameEvent) => TAnimationStep | null;

const PROBE_HOP_DURATION_MS = 900;
const DISC_STEP_DURATION_MS = 900;
const DELTA_DURATION_MS = 500;

const EVENT_TO_STEP: Partial<Record<EGameEventType, TStepFactory>> = {
  [EGameEventType.PROBE_MOVED]: (event) => {
    if (event.type !== EGameEventType.PROBE_MOVED) return null;
    return {
      kind: EAnimationStepKind.PROBE_MOVE,
      sourceEventId: event.id,
      durationMs: PROBE_HOP_DURATION_MS * Math.max(0, event.path.length - 1),
      actorId: event.actorId,
      probeId: event.probeId,
      path: event.path,
    };
  },
  [EGameEventType.DISC_ROTATED]: (event) => {
    if (event.type !== EGameEventType.DISC_ROTATED) return null;
    return {
      kind: EAnimationStepKind.DISC_ROTATE,
      sourceEventId: event.id,
      durationMs: DISC_STEP_DURATION_MS * Math.abs(event.steps),
      ring: event.ring,
      steps: event.steps,
    };
  },
  [EGameEventType.RESOURCE_CHANGED]: (event) => {
    if (event.type !== EGameEventType.RESOURCE_CHANGED) return null;
    return {
      kind: EAnimationStepKind.RESOURCE_DELTA,
      sourceEventId: event.id,
      durationMs: DELTA_DURATION_MS,
      actorId: event.actorId,
      resource: event.resource,
      before: event.before,
      after: event.after,
    };
  },
  [EGameEventType.SCORE_CHANGED]: (event) => {
    if (event.type !== EGameEventType.SCORE_CHANGED) return null;
    return {
      kind: EAnimationStepKind.SCORE_DELTA,
      sourceEventId: event.id,
      durationMs: DELTA_DURATION_MS,
      actorId: event.actorId,
      before: event.before,
      after: event.after,
      source: event.source,
    };
  },
  [EGameEventType.TRACE_MARKED]: (event) => {
    if (event.type !== EGameEventType.TRACE_MARKED) return null;
    return {
      kind: EAnimationStepKind.TRACE_PLACE,
      sourceEventId: event.id,
      durationMs: DELTA_DURATION_MS,
      actorId: event.actorId,
      traceColor: event.traceColor,
      alienIndex: event.alienIndex,
      isOverflow: event.isOverflow,
    };
  },
};

export function buildAnimationBatch(
  appended: TGameEvent[],
  actorId: string,
  turnIndex: number,
  finalStateVersion: number,
): IAnimationBatch | null {
  if (appended.length === 0) {
    return null;
  }

  const steps = appended
    .map((event) => EVENT_TO_STEP[event.type]?.(event) ?? null)
    .filter((step): step is TAnimationStep => step !== null);
  if (steps.length === 0) {
    return null;
  }

  const first = appended[0];
  const last = appended[appended.length - 1];
  return {
    batchId: `animation-${first.seq}-${last.seq}`,
    actorId,
    turnIndex,
    steps,
    finalStateVersion,
  };
}
