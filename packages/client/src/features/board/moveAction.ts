import type {
  IMovementFreeActionRequest,
  TMovementTarget,
} from '@/types/re-exports';
import { EFreeAction } from '@/types/re-exports';

export function buildMoveAction(
  fromSpaceId: string,
  toSpaceId: string,
  target: TMovementTarget,
): IMovementFreeActionRequest {
  return {
    type: EFreeAction.MOVEMENT,
    path: [fromSpaceId, toSpaceId],
    target,
  };
}
