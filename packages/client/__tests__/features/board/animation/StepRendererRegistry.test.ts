import { getStepRenderer } from '@/features/board/animation/StepRendererRegistry';
import { EAnimationStepKind, type IProbeMoveStep } from '@/types/re-exports';

describe('StepRendererRegistry', () => {
  it('splits probe move duration across each hop', async () => {
    const dispatched: Array<{ probeId: string; spaceId: string }> = [];
    const waits: number[] = [];
    const step: IProbeMoveStep = {
      kind: EAnimationStepKind.PROBE_MOVE,
      sourceEventId: 'event-1',
      durationMs: 12,
      actorId: 'p2',
      probeId: 'probe-1',
      path: ['space-0', 'space-1', 'space-2', 'space-3'],
    };

    await getStepRenderer(step).play(step, {
      dispatch: (action) => {
        if (action.type === 'probePosition') {
          dispatched.push({
            probeId: action.probeId,
            spaceId: action.spaceId,
          });
        }
      },
      getDiscAngle: () => 0,
      wait: async (durationMs) => {
        waits.push(durationMs);
      },
    });

    expect(dispatched).toEqual([
      { probeId: 'probe-1', spaceId: 'space-1' },
      { probeId: 'probe-1', spaceId: 'space-2' },
      { probeId: 'probe-1', spaceId: 'space-3' },
    ]);
    expect(waits).toEqual([4, 4, 4]);
  });
});
