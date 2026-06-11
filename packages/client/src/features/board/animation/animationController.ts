import type { IAnimationBatch } from '@/types/re-exports';

export interface IAnimationRenderState {
  renderProbeSpaceById: Record<string, string>;
  renderDiscAngles: Partial<Record<1 | 2 | 3, number>>;
}

export interface IAnimationControllerState extends IAnimationRenderState {
  activeBatchId: string | null;
  completedBatchIds: Set<string>;
}

export const EMPTY_ANIMATION_RENDER_STATE: IAnimationRenderState = {
  renderProbeSpaceById: {},
  renderDiscAngles: {},
};

export type TAnimationControllerAction =
  | { type: 'beginBatch'; batch: IAnimationBatch }
  | { type: 'completeBatch'; batch: IAnimationBatch }
  | { type: 'markBatchComplete'; batch: IAnimationBatch }
  | { type: 'probePosition'; probeId: string; spaceId: string }
  | { type: 'discAngle'; ring: 1 | 2 | 3; angle: number }
  | { type: 'snap' };

export function createInitialAnimationControllerState(): IAnimationControllerState {
  return {
    ...EMPTY_ANIMATION_RENDER_STATE,
    activeBatchId: null,
    completedBatchIds: new Set(),
  };
}

export function animationControllerReducer(
  state: IAnimationControllerState,
  action: TAnimationControllerAction,
): IAnimationControllerState {
  switch (action.type) {
    case 'beginBatch':
      return {
        ...state,
        activeBatchId: action.batch.batchId,
      };
    case 'completeBatch': {
      const completedBatchIds = new Set(state.completedBatchIds);
      completedBatchIds.add(action.batch.batchId);
      return {
        ...state,
        activeBatchId: null,
        completedBatchIds,
        renderProbeSpaceById: {},
        renderDiscAngles: {},
      };
    }
    case 'markBatchComplete': {
      const completedBatchIds = new Set(state.completedBatchIds);
      completedBatchIds.add(action.batch.batchId);
      return {
        ...state,
        completedBatchIds,
      };
    }
    case 'probePosition':
      return {
        ...state,
        renderProbeSpaceById: {
          ...state.renderProbeSpaceById,
          [action.probeId]: action.spaceId,
        },
      };
    case 'discAngle':
      return {
        ...state,
        renderDiscAngles: {
          ...state.renderDiscAngles,
          [action.ring]: action.angle,
        },
      };
    case 'snap':
      return {
        ...state,
        activeBatchId: null,
        renderProbeSpaceById: {},
        renderDiscAngles: {},
      };
  }
}
