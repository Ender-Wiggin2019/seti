import type { IGame } from '../../IGame.js';

const movementPublicityDisabledByTurn = new WeakMap<
  IGame,
  Map<string, number>
>();

export function disableMovementPublicityForCurrentTurn(
  game: IGame,
  playerId: string,
): void {
  const byPlayer =
    movementPublicityDisabledByTurn.get(game) ?? new Map<string, number>();
  byPlayer.set(playerId, game.turnIndex);
  movementPublicityDisabledByTurn.set(game, byPlayer);
}

export function isMovementPublicityDisabledForCurrentTurn(
  game: IGame,
  playerId: string,
): boolean {
  const byPlayer = movementPublicityDisabledByTurn.get(game);
  if (!byPlayer) return false;

  const turnIndex = byPlayer.get(playerId);
  return turnIndex !== undefined && turnIndex === game.turnIndex;
}
