import type { Player } from '@/engine/player/Player.js';

/**
 * Simulates a mission card being "in play" by adding its id to playedMissions.
 * In production, PlayCard.ts pushes the full ICard object; for unit tests that
 * only need the tracker's `isMissionActiveOnBoard` check, pushing the cardId
 * string is sufficient since TCardItem is `string | { id?: string } | ICard`.
 */
export function activateMission(player: Player, cardId: string): void {
  player.playedMissions.push(cardId);
}
