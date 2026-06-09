import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EPlanet } from '@seti/common/types/element';
import { getMascamitesSampleDeliveryDestination } from '@seti/common/utils/mascamitesSampleDelivery';
import type { IPlayedMissionRow } from '@/features/player';
import type { IMilestoneItem } from '@/features/scoring';
import type {
  IPublicAlienState,
  IPublicGameState,
  IPublicMascamitesCapsule,
  IPublicMilestoneState,
  IPublicOumuamuaTile,
  IPublicPlayerState,
} from '@/types/re-exports';

/**
 * Shared helpers used by layout sections to compose player, alien, and
 * scoring data without tying that logic to one render shell.
 */

const CARD_BY_ID = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

export function findOumuamuaTile(
  aliens: IPublicAlienState[] | undefined,
): IPublicOumuamuaTile | null {
  const oumuamua = aliens?.find((alien) => alien.board?.type === 'oumuamua');
  return oumuamua?.board?.type === 'oumuamua'
    ? (oumuamua.board.tile ?? null)
    : null;
}

export function findMascamitesCapsules(
  aliens: IPublicAlienState[] | undefined,
): IPublicMascamitesCapsule[] {
  return (
    aliens?.flatMap((alien) =>
      alien.board?.type === 'mascamites' ? alien.board.capsules : [],
    ) ?? []
  );
}

export function buildPendingCentaurianRows(
  aliens: IPublicAlienState[] | undefined,
  playerId: string | null,
  currentScore: number,
): IPlayedMissionRow[] {
  if (!playerId) return [];
  const centaurians = aliens?.find(
    (alien) => alien.board?.type === 'centaurians',
  );
  const board =
    centaurians?.board?.type === 'centaurians' ? centaurians.board : null;
  if (!board) return [];

  const pendingCardIds = board.pendingMessagesByPlayer[playerId] ?? [];
  if (pendingCardIds.length === 0) return [];

  return pendingCardIds.map((cardId, queueIndex) => {
    const card = CARD_BY_ID.get(cardId);
    const milestone = board.messageMilestones.find(
      (entry) =>
        entry.playerId === playerId &&
        entry.sourceCardId === cardId &&
        !entry.resolved,
    );
    const threshold = milestone?.threshold;
    const toGo =
      threshold !== undefined ? Math.max(0, threshold - currentScore) : null;
    return {
      card: card ?? ({ id: cardId, name: cardId } as IBaseCard),
      key: `centaurian-pending-${cardId}-${queueIndex}`,
      annotation: {
        label:
          threshold !== undefined ? `→ ${threshold} VP` : 'pending milestone',
        hint: toGo !== null ? `${toGo} VP to go` : undefined,
        tone: 'pending',
      },
    };
  });
}

export interface ISampleDeliveryOption {
  capsuleId: string;
  cardId: string;
  label: string;
}

export function buildSampleDeliveryOptions(
  gameState: IPublicGameState | null,
  playerId: string,
): ISampleDeliveryOption[] {
  if (!gameState) return [];

  const player = gameState.players.find(
    (candidate) => candidate.playerId === playerId,
  );
  const missionCards = player?.playedMissions ?? [];
  if (!player || missionCards.length === 0) return [];

  return findMascamitesCapsules(gameState.aliens)
    .filter((capsule) => capsule.ownerId === playerId)
    .flatMap((capsule) =>
      missionCards
        .filter((mission) =>
          isCapsuleAtPlanet(
            gameState,
            capsule,
            getMascamitesSampleDeliveryDestination(mission),
          ),
        )
        .map((mission) => ({
          capsuleId: capsule.capsuleId,
          cardId: mission.id,
          label: `${mission.name ?? mission.id} / ${capsule.capsuleId}`,
        })),
    );
}

function isCapsuleAtPlanet(
  gameState: IPublicGameState,
  capsule: IPublicMascamitesCapsule,
  planet: EPlanet | undefined,
): boolean {
  if (!planet) return false;
  const solarSystem = gameState.solarSystem;
  if (solarSystem.planetSpaceIds?.[planet] === capsule.spaceId) return true;
  const state = solarSystem.spaceStates?.[capsule.spaceId];
  if (!state) return false;
  return (
    state.elements?.some(
      (element) =>
        element.planet === planet ||
        (planet === EPlanet.EARTH && element.type === 'EARTH'),
    ) ??
    (planet === EPlanet.EARTH && state.elementTypes.includes('EARTH'))
  );
}

export interface IPlaceDataOption {
  slotIndex: number;
  row: 'top' | 'bottom';
}

export function buildPlaceDataOptions(
  player: IPublicPlayerState | null | undefined,
): IPlaceDataOption[] {
  const columns = player?.computer?.columns ?? [];
  if (!columns.length) return [];

  const topIndex = columns.findIndex((col) => !col.topFilled);
  const options: IPlaceDataOption[] = [];

  if (topIndex >= 0) {
    options.push({ slotIndex: topIndex, row: 'top' });
  }

  options.push(
    ...columns
      .map((col, index) => ({ col, index }))
      .filter(
        ({ col }) => col.hasBottomSlot && col.topFilled && !col.bottomFilled,
      )
      .map(({ index }) => ({ slotIndex: index, row: 'bottom' as const })),
  );

  return options;
}

export function buildMilestoneItems(
  milestones: IPublicMilestoneState,
  playerColors: Record<string, string>,
): IMilestoneItem[] {
  const items: IMilestoneItem[] = [];
  const totalPlayers = Math.max(Object.keys(playerColors).length, 1);

  for (const bucket of milestones.goldMilestones) {
    for (const pid of bucket.resolvedPlayerIds) {
      items.push({
        id: `gold-${bucket.threshold}-${pid}`,
        threshold: bucket.threshold,
        type: 'gold',
        claimedBy: pid,
      });
    }
    if (bucket.resolvedPlayerIds.length < totalPlayers) {
      items.push({
        id: `gold-${bucket.threshold}-open`,
        threshold: bucket.threshold,
        type: 'gold',
      });
    }
  }

  for (const bucket of milestones.neutralMilestones) {
    for (const pid of bucket.resolvedPlayerIds) {
      items.push({
        id: `neutral-${bucket.threshold}-${pid}`,
        threshold: bucket.threshold,
        type: 'neutral',
        claimedBy: pid,
      });
    }
    for (let i = 0; i < bucket.markersRemaining; i++) {
      items.push({
        id: `neutral-${bucket.threshold}-open-${i}`,
        threshold: bucket.threshold,
        type: 'neutral',
      });
    }
  }

  return items;
}
