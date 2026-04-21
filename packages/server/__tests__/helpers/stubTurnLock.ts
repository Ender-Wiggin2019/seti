import type { IGame } from '@/engine/IGame.js';

/**
 * Minimal `turnLocked` / `lockCurrentTurn` for partial `IGame` mocks.
 * Production code calls `lockCurrentTurn()` after hidden-information actions
 * (draws, refills); unit tests that stub `IGame` must include this pair.
 */
export function stubTurnLockFields(): Pick<
  IGame,
  'turnLocked' | 'lockCurrentTurn'
> {
  const stub = {
    turnLocked: false,
    lockCurrentTurn(this: { turnLocked: boolean }) {
      this.turnLocked = true;
    },
  };
  return stub;
}
