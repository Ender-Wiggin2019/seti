import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ESolarSystemElementType } from '../../board/SolarSystem.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

export function behaviorWithoutHandledCustom(
  cardId: string,
  handledCustomId: string,
): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(cardId).effects);
  const custom = behavior.custom?.filter((id) => id !== handledCustomId);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export function enqueueProbeSectorSignalEffect(
  context: ICardRuntimeContext,
  effect: (player: IPlayer, game: IGame) => PlayerInput | undefined,
): void {
  context.game.deferredActions.push(
    new SimpleDeferredAction(
      context.player,
      (game) => effect(context.player, game),
      EPriority.CORE_EFFECT,
    ),
  );
}

export function createProbeSectorSignalInput(
  player: IPlayer,
  game: IGame,
  markCount: number,
): PlayerInput | undefined {
  const sectorIndexes = getSectorIndexesWithPlayerProbes(player, game);
  if (sectorIndexes.length === 0) return undefined;
  if (sectorIndexes.length === 1) {
    return markSectorRepeatedly(player, game, sectorIndexes[0], markCount);
  }

  return new SelectOption(
    player,
    sectorIndexes.map((sectorIndex) => ({
      id: `probe-sector-${sectorIndex}`,
      label: `Sector ${sectorIndex + 1}`,
      onSelect: () =>
        markSectorRepeatedly(player, game, sectorIndex, markCount),
    })),
    'Choose sector with your probe',
  );
}

export function createProbeAndNeighborSectorSignalInput(
  player: IPlayer,
  game: IGame,
): PlayerInput | undefined {
  const sectorIndexes = getSectorIndexesWithPlayerProbes(player, game);
  if (sectorIndexes.length === 0) return undefined;
  if (sectorIndexes.length === 1) {
    return markSectorAndNeighbors(player, game, sectorIndexes[0]);
  }

  return new SelectOption(
    player,
    sectorIndexes.map((sectorIndex) => ({
      id: `probe-sector-${sectorIndex}`,
      label: `Sector ${sectorIndex + 1}`,
      onSelect: () => markSectorAndNeighbors(player, game, sectorIndex),
    })),
    'Choose sector with your probe',
  );
}

export function countOtherPlanetsAndCometsInEarthSector(game: IGame): number {
  const solarSystem = game.solarSystem;
  if (!solarSystem) return 0;
  const earthSectorIndex = solarSystem.getSectorIndexOfPlanet(EPlanet.EARTH);
  if (earthSectorIndex === null) return 0;

  let count = 0;
  for (const space of solarSystem.getSpacesInSector(earthSectorIndex)) {
    for (const element of space.elements) {
      if (
        element.type === ESolarSystemElementType.PLANET &&
        element.planet !== EPlanet.EARTH
      ) {
        count += 1;
      }
      if (element.type === ESolarSystemElementType.COMET) {
        count += 1;
      }
    }
  }
  return count;
}

function getSectorIndexesWithPlayerProbes(
  player: IPlayer,
  game: IGame,
): number[] {
  const solarSystem = game.solarSystem;
  if (!solarSystem) return [];

  const sectorIndexes = new Set<number>();
  for (const space of solarSystem.spaces) {
    if (!space.occupants.some((probe) => probe.playerId === player.id)) {
      continue;
    }
    const sectorIndex = solarSystem.getSectorIndexOfSpace(space.id);
    if (sectorIndex !== null) {
      sectorIndexes.add(sectorIndex);
    }
  }

  return Array.from(sectorIndexes).sort((left, right) => left - right);
}

function markSectorRepeatedly(
  player: IPlayer,
  game: IGame,
  sectorIndex: number,
  remaining: number,
): PlayerInput | undefined {
  if (remaining <= 0) return undefined;
  return MarkSectorSignalEffect.markByIndexWithAlternatives(
    player,
    game,
    sectorIndex,
    () => markSectorRepeatedly(player, game, sectorIndex, remaining - 1),
  );
}

function markSectorAndNeighbors(
  player: IPlayer,
  game: IGame,
  sectorIndex: number,
): PlayerInput | undefined {
  const indexes = [(sectorIndex + 7) % 8, sectorIndex, (sectorIndex + 1) % 8];
  return markSectorIndexChain(player, game, indexes);
}

function markSectorIndexChain(
  player: IPlayer,
  game: IGame,
  indexes: number[],
): PlayerInput | undefined {
  const [current, ...rest] = indexes;
  if (current === undefined) return undefined;
  return MarkSectorSignalEffect.markByIndexWithAlternatives(
    player,
    game,
    current,
    () => markSectorIndexChain(player, game, rest),
  );
}
