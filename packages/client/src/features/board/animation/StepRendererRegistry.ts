import {
  EAnimationStepKind,
  type IDiscRotateStep,
  type IProbeMoveStep,
  type TAnimationStep,
} from '@/types/re-exports';
import type { TAnimationControllerAction } from './animationController';

export interface IStepRendererContext {
  dispatch: (action: TAnimationControllerAction) => void;
  getDiscAngle: (ring: 1 | 2 | 3) => number;
  wait: (durationMs: number) => Promise<void>;
}

export interface IStepRenderer<TStep extends TAnimationStep = TAnimationStep> {
  play: (step: TStep, ctx: IStepRendererContext) => Promise<void>;
}

async function playProbeMove(
  step: IProbeMoveStep,
  ctx: IStepRendererContext,
): Promise<void> {
  const hopCount = Math.max(1, step.path.length - 1);
  const hopDurationMs = step.durationMs / hopCount;
  for (const spaceId of step.path.slice(1)) {
    ctx.dispatch({
      type: 'probePosition',
      probeId: step.probeId,
      spaceId,
    });
    await ctx.wait(hopDurationMs);
  }
}

async function playDiscRotate(
  step: IDiscRotateStep,
  ctx: IStepRendererContext,
): Promise<void> {
  const currentAngle = ctx.getDiscAngle(step.ring);
  ctx.dispatch({
    type: 'discAngle',
    ring: step.ring,
    angle: currentAngle + step.steps,
  });
  await ctx.wait(step.durationMs);
}

async function waitForStep(
  step: TAnimationStep,
  ctx: IStepRendererContext,
): Promise<void> {
  await ctx.wait(step.durationMs);
}

export const STEP_RENDERERS: ReadonlyMap<
  EAnimationStepKind,
  IStepRenderer
> = new Map<EAnimationStepKind, IStepRenderer>([
  [
    EAnimationStepKind.PROBE_MOVE,
    {
      play: (step, ctx) => playProbeMove(step as IProbeMoveStep, ctx),
    },
  ],
  [
    EAnimationStepKind.DISC_ROTATE,
    {
      play: (step, ctx) => playDiscRotate(step as IDiscRotateStep, ctx),
    },
  ],
  [EAnimationStepKind.RESOURCE_DELTA, { play: waitForStep }],
  [EAnimationStepKind.SCORE_DELTA, { play: waitForStep }],
  [EAnimationStepKind.TRACE_PLACE, { play: waitForStep }],
  [EAnimationStepKind.GENERIC, { play: waitForStep }],
]);

export function getStepRenderer(step: TAnimationStep): IStepRenderer {
  return STEP_RENDERERS.get(step.kind) ?? { play: waitForStep };
}
