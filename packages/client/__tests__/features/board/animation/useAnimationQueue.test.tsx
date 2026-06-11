import { act, renderHook } from '@testing-library/react';
import {
  EAnimationStepKind,
  type IAnimationBatch,
  type IPublicGameState,
} from '@/types/re-exports';
import { useAnimationQueue } from '@/features/board/animation/useAnimationQueue';

let animationHandler: ((batch: IAnimationBatch) => void) | undefined;
let resyncRequestedHandler: ((payload: { gameId: string }) => void) | undefined;

vi.mock('@/api/wsClient', () => ({
  wsClient: {
    onAnimation: vi.fn((handler: (batch: IAnimationBatch) => void) => {
      animationHandler = handler;
      return () => {
        animationHandler = undefined;
      };
    }),
    onResyncRequested: vi.fn((handler: (payload: { gameId: string }) => void) => {
      resyncRequestedHandler = handler;
      return () => {
        resyncRequestedHandler = undefined;
      };
    }),
  },
}));

function createState(version: number, ring2Angle = 0): IPublicGameState {
  return {
    gameId: 'game-1',
    version,
    solarSystem: {
      discs: [{ discIndex: 1, angle: ring2Angle }],
    },
  } as IPublicGameState;
}

function genericBatch(
  overrides: Partial<IAnimationBatch> = {},
): IAnimationBatch {
  return {
    batchId: 'batch-1',
    actorId: 'p2',
    turnIndex: 3,
    finalStateVersion: 2,
    steps: [
      {
        kind: EAnimationStepKind.PROBE_MOVE,
        sourceEventId: 'event-1',
        durationMs: 2,
        actorId: 'p2',
        probeId: 'probe-1',
        path: ['space-0', 'space-1', 'space-2'],
      },
      {
        kind: EAnimationStepKind.DISC_ROTATE,
        sourceEventId: 'event-2',
        durationMs: 2,
        ring: 2,
        steps: 1,
      },
    ],
    ...overrides,
  };
}

describe('useAnimationQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    animationHandler = undefined;
    resyncRequestedHandler = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays opponent batches step by step and snaps when complete', async () => {
    const { result } = renderHook(() =>
      useAnimationQueue({
        authoritativeState: createState(2),
        myPlayerId: 'p1',
      }),
    );

    act(() => {
      animationHandler?.(genericBatch());
    });

    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });
    expect(result.current.renderDiscAngles).toEqual({});

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-2',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.renderDiscAngles).toEqual({ 2: 1 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });

    expect(result.current.renderProbeSpaceById).toEqual({});
    expect(result.current.renderDiscAngles).toEqual({});
  });

  it('skips self batches and dedupes repeated batch ids', async () => {
    const { result } = renderHook(() =>
      useAnimationQueue({
        authoritativeState: createState(2),
        myPlayerId: 'p1',
      }),
    );

    act(() => {
      animationHandler?.(genericBatch({ actorId: 'p1' }));
      animationHandler?.(genericBatch({ actorId: 'p1' }));
    });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.renderProbeSpaceById).toEqual({});
    expect(result.current.completedBatchIds.has('batch-1')).toBe(true);
  });

  it('does not clear an active opponent animation when skipping a self batch', async () => {
    const { result } = renderHook(() =>
      useAnimationQueue({
        authoritativeState: createState(2),
        myPlayerId: 'p1',
      }),
    );

    act(() => {
      animationHandler?.(
        genericBatch({
          batchId: 'opponent-batch',
          actorId: 'p2',
          steps: [
            {
              kind: EAnimationStepKind.PROBE_MOVE,
              sourceEventId: 'event-1',
              durationMs: 10,
              actorId: 'p2',
              probeId: 'probe-1',
              path: ['space-0', 'space-1', 'space-2'],
            },
          ],
        }),
      );
    });

    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });

    act(() => {
      animationHandler?.(
        genericBatch({
          batchId: 'self-batch',
          actorId: 'p1',
          finalStateVersion: 3,
          steps: [
            {
              kind: EAnimationStepKind.GENERIC,
              sourceEventId: 'event-self',
              durationMs: 1,
            },
          ],
        }),
      );
    });

    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });
    expect(result.current.activeBatchId).toBe('opponent-batch');
    expect(result.current.completedBatchIds.has('self-batch')).toBe(true);
  });

  it('snaps immediately when a newer authoritative state arrives', () => {
    const { result, rerender } = renderHook(
      ({ state }) =>
        useAnimationQueue({
          authoritativeState: state,
          myPlayerId: 'p1',
        }),
      { initialProps: { state: createState(2) } },
    );

    act(() => {
      animationHandler?.(genericBatch());
    });
    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });

    rerender({ state: createState(3) });

    expect(result.current.renderProbeSpaceById).toEqual({});
    expect(result.current.renderDiscAngles).toEqual({});
  });

  it('does not cancel earlier queued batches when the authoritative state matches a later queued batch', async () => {
    const { result } = renderHook(() =>
      useAnimationQueue({
        authoritativeState: createState(3),
        myPlayerId: 'p1',
      }),
    );

    act(() => {
      animationHandler?.(
        genericBatch({
          batchId: 'batch-1',
          finalStateVersion: 2,
        }),
      );
      animationHandler?.(
        genericBatch({
          batchId: 'batch-2',
          finalStateVersion: 3,
          steps: [
            {
              kind: EAnimationStepKind.DISC_ROTATE,
              sourceEventId: 'event-3',
              durationMs: 1,
              ring: 1,
              steps: 1,
            },
          ],
        }),
      );
    });

    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });

    expect(result.current.completedBatchIds.has('batch-1')).toBe(true);
    expect(result.current.completedBatchIds.has('batch-2')).toBe(true);
    expect(result.current.renderProbeSpaceById).toEqual({});
    expect(result.current.renderDiscAngles).toEqual({});
  });

  it('keeps disc rotation based on the batch-start angle when final state arrives during earlier steps', async () => {
    const { result, rerender } = renderHook(
      ({ state }) =>
        useAnimationQueue({
          authoritativeState: state,
          myPlayerId: 'p1',
        }),
      { initialProps: { state: createState(1, 0) } },
    );

    act(() => {
      animationHandler?.(
        genericBatch({
          finalStateVersion: 2,
          steps: [
            {
              kind: EAnimationStepKind.PROBE_MOVE,
              sourceEventId: 'event-1',
              durationMs: 2,
              actorId: 'p2',
              probeId: 'probe-1',
              path: ['space-0', 'space-1'],
            },
            {
              kind: EAnimationStepKind.DISC_ROTATE,
              sourceEventId: 'event-2',
              durationMs: 2,
              ring: 2,
              steps: 1,
            },
          ],
        }),
      );
    });

    rerender({ state: createState(2, 1) });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2);
    });

    expect(result.current.renderDiscAngles).toEqual({ 2: 1 });
  });

  it('snaps immediately when the local client requests resync', () => {
    const { result } = renderHook(() =>
      useAnimationQueue({
        authoritativeState: createState(2),
        myPlayerId: 'p1',
      }),
    );

    act(() => {
      animationHandler?.(genericBatch());
    });
    expect(result.current.renderProbeSpaceById).toEqual({
      'probe-1': 'space-1',
    });

    act(() => {
      resyncRequestedHandler?.({ gameId: 'game-1' });
    });

    expect(result.current.renderProbeSpaceById).toEqual({});
    expect(result.current.renderDiscAngles).toEqual({});
  });
});
