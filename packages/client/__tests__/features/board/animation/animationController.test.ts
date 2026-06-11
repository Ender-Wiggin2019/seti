import { EAnimationStepKind, type IAnimationBatch } from '@/types/re-exports';
import {
  animationControllerReducer,
  createInitialAnimationControllerState,
} from '@/features/board/animation/animationController';

describe('animationControllerReducer', () => {
  it('applies probe and disc render overrides, then snaps back to authoritative state', () => {
    let state = createInitialAnimationControllerState();

    state = animationControllerReducer(state, {
      type: 'probePosition',
      probeId: 'probe-1',
      spaceId: 'space-2',
    });
    state = animationControllerReducer(state, {
      type: 'discAngle',
      ring: 2,
      angle: 5,
    });

    expect(state.renderProbeSpaceById).toEqual({ 'probe-1': 'space-2' });
    expect(state.renderDiscAngles).toEqual({ 2: 5 });

    state = animationControllerReducer(state, { type: 'snap' });

    expect(state.renderProbeSpaceById).toEqual({});
    expect(state.renderDiscAngles).toEqual({});
  });

  it('tracks active and deduped batches', () => {
    const batch: IAnimationBatch = {
      batchId: 'batch-1',
      actorId: 'p2',
      turnIndex: 2,
      finalStateVersion: 3,
      steps: [
        {
          kind: EAnimationStepKind.GENERIC,
          sourceEventId: 'event-1',
          durationMs: 1,
        },
      ],
    };

    let state = animationControllerReducer(
      createInitialAnimationControllerState(),
      {
        type: 'beginBatch',
        batch,
      },
    );
    state = animationControllerReducer(state, { type: 'completeBatch', batch });

    expect(state.activeBatchId).toBeNull();
    expect(state.completedBatchIds.has('batch-1')).toBe(true);
  });

  it('can mark a skipped batch complete without clearing the active render state', () => {
    const activeBatch: IAnimationBatch = {
      batchId: 'opponent-batch',
      actorId: 'p2',
      turnIndex: 2,
      finalStateVersion: 3,
      steps: [],
    };
    const skippedBatch: IAnimationBatch = {
      batchId: 'self-batch',
      actorId: 'p1',
      turnIndex: 2,
      finalStateVersion: 4,
      steps: [],
    };

    let state = animationControllerReducer(
      createInitialAnimationControllerState(),
      {
        type: 'beginBatch',
        batch: activeBatch,
      },
    );
    state = animationControllerReducer(state, {
      type: 'probePosition',
      probeId: 'probe-1',
      spaceId: 'space-2',
    });
    state = animationControllerReducer(state, {
      type: 'markBatchComplete',
      batch: skippedBatch,
    });

    expect(state.activeBatchId).toBe('opponent-batch');
    expect(state.renderProbeSpaceById).toEqual({ 'probe-1': 'space-2' });
    expect(state.completedBatchIds.has('self-batch')).toBe(true);
  });
});
