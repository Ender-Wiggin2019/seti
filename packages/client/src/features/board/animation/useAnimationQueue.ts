import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { wsClient } from '@/api/wsClient';
import type { IAnimationBatch, IPublicGameState } from '@/types/re-exports';
import {
  animationControllerReducer,
  createInitialAnimationControllerState,
  type IAnimationControllerState,
} from './animationController';
import { getStepRenderer } from './StepRendererRegistry';

interface IUseAnimationQueueOptions {
  authoritativeState: IPublicGameState | null;
  myPlayerId: string;
}

const WATCHDOG_MULTIPLIER = 1.5;
const DISC_RINGS = [1, 2, 3] as const;

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, durationMs));
  });
}

function getDiscAngle(
  state: IAnimationControllerState,
  authoritativeState: IPublicGameState | null,
  ring: 1 | 2 | 3,
  batchStartDiscAngles?: Partial<Record<1 | 2 | 3, number>>,
): number {
  const renderAngle = state.renderDiscAngles[ring];
  if (renderAngle !== undefined) {
    return renderAngle;
  }
  const batchStartAngle = batchStartDiscAngles?.[ring];
  if (batchStartAngle !== undefined) {
    return batchStartAngle;
  }
  return (
    authoritativeState?.solarSystem?.discs.find(
      (disc) => disc.discIndex === ring - 1,
    )?.angle ?? 0
  );
}

function batchDuration(batch: IAnimationBatch): number {
  return batch.steps.reduce(
    (total, step) => total + Math.max(0, step.durationMs),
    0,
  );
}

function maxKnownFinalStateVersion(
  activeBatch: IAnimationBatch | null,
  queuedBatches: readonly IAnimationBatch[],
): number {
  return Math.max(
    activeBatch?.finalStateVersion ?? 0,
    ...queuedBatches.map((batch) => batch.finalStateVersion),
  );
}

function captureDiscAngles(
  state: IAnimationControllerState,
  authoritativeState: IPublicGameState | null,
): Partial<Record<1 | 2 | 3, number>> {
  return Object.fromEntries(
    DISC_RINGS.map((ring) => [
      ring,
      getDiscAngle(state, authoritativeState, ring),
    ]),
  ) as Partial<Record<1 | 2 | 3, number>>;
}

export function useAnimationQueue({
  authoritativeState,
  myPlayerId,
}: IUseAnimationQueueOptions): IAnimationControllerState {
  const [state, dispatch] = useReducer(
    animationControllerReducer,
    undefined,
    createInitialAnimationControllerState,
  );
  const stateRef = useRef(state);
  const authoritativeStateRef = useRef(authoritativeState);
  const queueRef = useRef<IAnimationBatch[]>([]);
  const activeBatchRef = useRef<IAnimationBatch | null>(null);
  const activeBatchStartDiscAnglesRef = useRef<
    Partial<Record<1 | 2 | 3, number>>
  >({});
  const processingRef = useRef(false);
  const cancelledGenerationRef = useRef(0);

  stateRef.current = state;
  authoritativeStateRef.current = authoritativeState;

  const snap = useCallback(() => {
    cancelledGenerationRef.current += 1;
    queueRef.current = [];
    activeBatchRef.current = null;
    activeBatchStartDiscAnglesRef.current = {};
    processingRef.current = false;
    dispatch({ type: 'snap' });
  }, []);

  useEffect(() => {
    if (
      state.activeBatchId &&
      authoritativeState &&
      authoritativeState.version > 0
    ) {
      const activeBatch = activeBatchRef.current;
      const maxFinalStateVersion = maxKnownFinalStateVersion(
        activeBatch,
        queueRef.current,
      );
      if (!activeBatch || authoritativeState.version > maxFinalStateVersion) {
        snap();
      }
    }
  }, [authoritativeState, snap, state.activeBatchId]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;
    const generation = cancelledGenerationRef.current;

    while (queueRef.current.length > 0) {
      const batch = queueRef.current.shift();
      if (!batch) {
        continue;
      }
      if (stateRef.current.completedBatchIds.has(batch.batchId)) {
        continue;
      }

      activeBatchStartDiscAnglesRef.current = captureDiscAngles(
        stateRef.current,
        authoritativeStateRef.current,
      );
      dispatch({ type: 'beginBatch', batch });
      activeBatchRef.current = batch;
      const watchdogMs = Math.ceil(batchDuration(batch) * WATCHDOG_MULTIPLIER);
      const watchdog = window.setTimeout(() => {
        snap();
      }, watchdogMs);

      try {
        for (const step of batch.steps) {
          if (generation !== cancelledGenerationRef.current) {
            return;
          }
          await getStepRenderer(step).play(step, {
            dispatch,
            getDiscAngle: (ring) =>
              getDiscAngle(
                stateRef.current,
                authoritativeStateRef.current,
                ring,
                activeBatchStartDiscAnglesRef.current,
              ),
            wait,
          });
        }
      } finally {
        window.clearTimeout(watchdog);
      }

      if (generation !== cancelledGenerationRef.current) {
        return;
      }
      activeBatchRef.current = null;
      activeBatchStartDiscAnglesRef.current = {};
      dispatch({ type: 'completeBatch', batch });
    }

    processingRef.current = false;
  }, [snap]);

  useEffect(() => {
    return wsClient.onAnimation((batch) => {
      if (stateRef.current.completedBatchIds.has(batch.batchId)) {
        return;
      }
      if (batch.actorId === myPlayerId) {
        dispatch({ type: 'markBatchComplete', batch });
        return;
      }
      queueRef.current.push(batch);
      void processQueue();
    });
  }, [myPlayerId, processQueue]);

  useEffect(() => {
    return wsClient.onResyncRequested(() => {
      snap();
    });
  }, [snap]);

  return useMemo(() => state, [state]);
}
