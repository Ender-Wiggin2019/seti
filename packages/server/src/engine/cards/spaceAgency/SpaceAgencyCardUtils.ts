import { EResource, ESector, ETech } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import type { ETechId } from '@seti/common/types/tech';
import { getTechDescriptor } from '@seti/common/types/tech';
import type { Sector } from '@/engine/board/Sector.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { AnyCardChoiceEffect } from '@/engine/effects/card/AnyCardChoiceEffect.js';
import { createActionEvent } from '@/engine/event/GameEvent.js';
import { EGameRuntimeEvent } from '@/engine/events/GameEventBus.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import {
  EMissionEventType,
  type IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import type { IPlayer, TCardItem } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { emitSectorCompletedTurnEvent } from '@/engine/turnEffects/TurnEffects.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

export function behaviorWithoutCustom(
  cardId: string,
  handledCustomIds: readonly string[],
): IBehavior {
  const handled = new Set(handledCustomIds);
  const behavior = behaviorFromEffects(loadCardData(cardId).effects);
  const custom = behavior.custom?.filter((id) => !handled.has(id));
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export function behaviorWithoutCustomAnd(
  cardId: string,
  handledCustomIds: readonly string[],
  omittedKeys: ReadonlyArray<keyof IBehavior>,
): IBehavior {
  const behavior: IBehavior = {
    ...behaviorWithoutCustom(cardId, handledCustomIds),
  };
  for (const key of omittedKeys) {
    delete behavior[key];
  }
  return behavior;
}

export function pushCoreAction(
  player: IPlayer,
  game: IGame,
  callback: (game: IGame) => ReturnType<SimpleDeferredAction['execute']>,
): void {
  game.deferredActions.push(
    new SimpleDeferredAction(player, callback, EPriority.CORE_EFFECT),
  );
}

export function returnCardToHand(
  player: IPlayer,
  cardId: string,
  game?: IGame,
): void {
  if (player.findCardInHand(cardId) < 0) {
    player.hand.push(game?.mainDeck.removeFromDiscard(cardId) ?? cardId);
  }
}

export function cardItemId(card: TCardItem): string | undefined {
  if (typeof card === 'string') return card;
  return card.id;
}

export function isAlienCardId(cardId: string): boolean {
  if (cardId.startsWith('ET.') || cardId.startsWith('SA.ET.')) {
    return true;
  }
  return hasCardData(cardId) && loadCardData(cardId).alien !== undefined;
}

export function gainFreeActionCorner(
  player: IPlayer,
  game: IGame,
  cardId: string,
  multiplier: number,
  onComplete?: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  if (!hasCardData(cardId)) return onComplete?.();

  const cardData = loadCardData(cardId);
  const rewards = cardData.freeAction ?? [];
  const applyAt = (index: number): IPlayerInput | undefined => {
    const reward = rewards[index];
    if (reward === undefined) {
      return onComplete?.();
    }

    const amount = reward.value * multiplier;
    if (amount <= 0) return applyAt(index + 1);

    switch (reward.type) {
      case EResource.CREDIT:
        player.resources.gain({ credits: amount });
        return applyAt(index + 1);
      case EResource.ENERGY:
        player.resources.gain({ energy: amount });
        return applyAt(index + 1);
      case EResource.PUBLICITY:
        player.resources.gain({ publicity: amount });
        return applyAt(index + 1);
      case EResource.DATA:
        player.resources.gain({ data: amount });
        return applyAt(index + 1);
      case EResource.SIGNAL_TOKEN:
        player.resources.gain({ signalTokens: amount });
        return applyAt(index + 1);
      case EResource.MOVE:
        player.gainMove(amount);
        return applyAt(index + 1);
      case EResource.SCORE:
        player.score += amount;
        return applyAt(index + 1);
      case EResource.CARD:
        drawCards(player, game, amount);
        return applyAt(index + 1);
      case EResource.CARD_ANY:
        return AnyCardChoiceEffect.execute(player, game, amount, () =>
          applyAt(index + 1),
        );
      default:
        return applyAt(index + 1);
    }
  };

  return applyAt(0);
}

export function drawCards(player: IPlayer, game: IGame, count: number): void {
  for (let index = 0; index < count; index += 1) {
    const drawn = game.mainDeck.drawWithReshuffle(game.random);
    if (drawn === undefined) break;
    player.hand.push(drawn);
    game.lockCurrentTurn();
  }
}

export function countPlayerSignalsInSector(
  sector: Sector,
  playerId: string,
): number {
  return sector.signals.filter(
    (signal) => signal.type === 'player' && signal.playerId === playerId,
  ).length;
}

export function markSectorSignalWithoutData(
  player: IPlayer,
  game: IGame,
  sector: Sector,
): void {
  player.pieces.deploy(EPieceType.SECTOR_MARKER);
  const result = sector.markSignal(player.id);
  game.missionTracker.recordEvent({
    type: EMissionEventType.SIGNAL_PLACED,
    color: sector.color,
  });
  if (result.vpAwarded > 0) {
    player.score += result.vpAwarded;
  }
  if (sector.completed) {
    emitSectorCompletedTurnEvent(game, player, sector.id);
  }
  game.eventLog?.append(
    createActionEvent(
      player.id,
      'SECTOR_MARKED',
      {
        sectorId: sector.id,
        sectorColor: sector.color,
        sourceAction: game.currentMainAction ?? undefined,
        dataGained: false,
        vpAwarded: result.vpAwarded,
        completed: sector.completed,
      },
      'debug',
    ),
  );
  game.eventBus?.emit({
    type: EGameRuntimeEvent.MARK_PLACED,
    game,
    player,
    sectorId: sector.id,
    sectorColor: sector.color,
    dataGained: false,
    vpAwarded: result.vpAwarded,
    completed: sector.completed,
  });
}

export function hasProbeOnAsteroids(player: IPlayer, game: IGame): boolean {
  return (
    game.solarSystem?.spaces.some(
      (space) =>
        space.occupants.some((probe) => probe.playerId === player.id) &&
        space.elements.some(
          (element) => element.type === ESolarSystemElementType.ASTEROID,
        ),
    ) ?? false
  );
}

export function hasProbesAtTwoDifferentNonEarthPlanets(
  player: IPlayer,
  game: IGame,
): boolean {
  const planets = new Set<EPlanet>();
  for (const space of game.solarSystem?.spaces ?? []) {
    if (!space.occupants.some((probe) => probe.playerId === player.id)) {
      continue;
    }
    for (const element of space.elements) {
      if (
        element.type === ESolarSystemElementType.PLANET &&
        element.planet !== undefined &&
        element.planet !== EPlanet.EARTH
      ) {
        planets.add(element.planet);
      }
    }
  }
  return planets.size >= 2;
}

export function hasProbeAdjacentToEarth(player: IPlayer, game: IGame): boolean {
  const solarSystem = game.solarSystem;
  const earthSpace = solarSystem?.getPlanetLocation(EPlanet.EARTH)?.space;
  if (!solarSystem || !earthSpace) return false;
  const adjacentIds = new Set(
    solarSystem.getAdjacentSpaces(earthSpace.id).map((space) => space.id),
  );
  return solarSystem.spaces.some(
    (space) =>
      adjacentIds.has(space.id) &&
      space.occupants.some((probe) => probe.playerId === player.id),
  );
}

export function countDataInPoolAndComputer(player: IPlayer): number {
  return player.dataPool.count + player.computer.getPlacedCount();
}

export function hasSignalsInEverySectorColor(
  player: IPlayer,
  game: IGame,
): boolean {
  const coveredColors = new Set<ESector>();
  for (const sector of game.sectors) {
    if (countPlayerSignalsInSector(sector, player.id) > 0) {
      coveredColors.add(sector.color);
    }
  }
  return [ESector.RED, ESector.YELLOW, ESector.BLUE, ESector.BLACK].every(
    (color) => coveredColors.has(color),
  );
}

export function hasSignalOrFulfillmentInEverySector(
  player: IPlayer,
  game: IGame,
): boolean {
  return game.sectors.every(
    (sector) =>
      countPlayerSignalsInSector(sector, player.id) > 0 ||
      sector.sectorWinners.includes(player.id),
  );
}

export function countNonMoonPlanetsWithTwoLanders(
  player: IPlayer,
  game: IGame,
): number {
  let count = 0;
  for (const state of game.planetaryBoard?.planets.values() ?? []) {
    if (
      state.landingSlots.filter((slot) => slot.playerId === player.id).length >=
      2
    ) {
      count += 1;
    }
  }
  return count;
}

export function countNonMoonPlanetsWithOrbiterOrLander(
  player: IPlayer,
  game: IGame,
): number {
  let count = 0;
  for (const state of game.planetaryBoard?.planets.values() ?? []) {
    if (
      state.orbitSlots.some((slot) => slot.playerId === player.id) ||
      state.landingSlots.some((slot) => slot.playerId === player.id)
    ) {
      count += 1;
    }
  }
  return count;
}

export function gainIncomeCornerResource(
  player: IPlayer,
  game: IGame,
  cardId: string,
  onComplete?: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  if (!hasCardData(cardId)) return onComplete?.();

  const income = loadCardData(cardId).income;
  switch (income) {
    case EResource.CREDIT:
      player.resources.gain({ credits: 1 });
      return onComplete?.();
    case EResource.ENERGY:
      player.resources.gain({ energy: 1 });
      return onComplete?.();
    case EResource.CARD:
      drawCards(player, game, 1);
      return onComplete?.();
    case EResource.CARD_ANY:
      return AnyCardChoiceEffect.execute(player, game, 1, onComplete);
    case EResource.DATA:
      player.resources.gain({ data: 1 });
      return onComplete?.();
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: 1 });
      return onComplete?.();
    case EResource.SIGNAL_TOKEN:
      player.resources.gain({ signalTokens: 1 });
      return onComplete?.();
    case EResource.MOVE:
      player.gainMove(1);
      return onComplete?.();
    case EResource.SCORE:
      player.score += 1;
      return onComplete?.();
    default:
      return onComplete?.();
  }
}

export function unregisterMissionState(
  game: IGame,
  playerId: string,
  cardId: string,
): void {
  const missions = game.missionTracker.getAllMissions(
    playerId,
  ) as IMissionRuntimeState[];
  const index = missions.findIndex((mission) => mission.def.cardId === cardId);
  if (index >= 0) {
    missions.splice(index, 1);
  }
}

export function researchedByAnotherPlayerTechIds(
  game: IGame,
  playerId: string,
): ETechId[] {
  const techBoard = game.techBoard;
  if (!techBoard) return [];

  return techBoard.getAvailableTechs(playerId).filter((techId) => {
    const stack = techBoard.getStack(techId);
    return stack !== undefined && !stack.firstTakeBonusAvailable;
  });
}

export function countComputerTechs(player: IPlayer): number {
  return player.techs.filter(
    (techId) => getTechDescriptor(techId).type === ETech.COMPUTER,
  ).length;
}

export function largestTechCategoryCount(player: IPlayer): number {
  const counts = new Map<ETech, number>();
  for (const techId of player.techs) {
    const type = getTechDescriptor(techId).type;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}
