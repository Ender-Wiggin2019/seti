import type { IMovementFreeActionRequest } from '@/types/re-exports';
import { EFreeAction } from '@/types/re-exports';

export function buildMoveAction(
  fromSpaceId: string,
  toSpaceId: string,
): IMovementFreeActionRequest {
  return {
    type: EFreeAction.MOVEMENT,
    path: [fromSpaceId, toSpaceId],
  };
}
