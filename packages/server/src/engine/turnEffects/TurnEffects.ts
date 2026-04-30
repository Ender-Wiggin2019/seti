import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
} from '../board/SolarSystem.js';
import { behaviorFromEffects, type IBehavior } from '../cards/Behavior.js';
import { loadCardData } from '../cards/loadCardData.js';
import { EPriority } from '../deferred/Priority.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IMovementStepTurnEvent {
  readonly fromSpace: ISolarSystemSpace;
  readonly toSpace: ISolarSystemSpace;
  publicityGained: number;
}

export interface IPlanetVisitedTurnEvent {
  readonly planet: EPlanet;
  publicityGained: number;
  readonly movement?: IMovementStepTurnEvent;
}

export interface ITurnEffectContext {
  readonly game: IGame;
  readonly player: IPlayer;
}

type TurnEffectInput = IPlayerInput | undefined | void;

export interface ITurnEffect {
  readonly id: string;
  readonly ignoreAsteroidLeaveCost?: boolean;
  readonly onMovementStep?: (
    context: ITurnEffectContext,
    event: IMovementStepTurnEvent,
  ) => TurnEffectInput;
  readonly onPlanetVisited?: (
    context: ITurnEffectContext,
    event: IPlanetVisitedTurnEvent,
  ) => TurnEffectInput;
  readonly onAsteroidsVisited?: (context: ITurnEffectContext) => void;
  readonly onCometVisited?: (context: ITurnEffectContext) => void;
  readonly onSectorCompleted?: (
    context: ITurnEffectContext,
    sectorId: string,
  ) => void;
}

interface IStoredTurnEffect {
  readonly playerId: string;
  readonly turnIndex: number;
  readonly effect: ITurnEffect;
}

const turnEffectsByGame = new WeakMap<IGame, IStoredTurnEffect[]>();

export function behaviorWithoutTurnEffectCustom(
  cardId: string,
  handledCustomIds: readonly string[],
): IBehavior {
  const handled = new Set(handledCustomIds);
  const behavior = behaviorFromEffects(loadCardData(cardId).effects ?? []);
  const custom = behavior.custom?.filter((id) => !handled.has(id));
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export function enqueueTurnEffectRegistration(
  player: IPlayer,
  game: IGame,
  effect: ITurnEffect,
): void {
  game.deferredActions.push(
    new SimpleDeferredAction(
      player,
      (currentGame) => {
        registerTurnEffect(currentGame, player, effect);
        return undefined;
      },
      EPriority.COST,
    ),
  );
}

export function registerTurnEffect(
  game: IGame,
  player: IPlayer,
  effect: ITurnEffect,
): void {
  const effects = getStoredEffects(game).filter(
    (stored) => stored.turnIndex === game.turnIndex,
  );
  effects.push({
    playerId: player.id,
    turnIndex: game.turnIndex,
    effect,
  });
  turnEffectsByGame.set(game, effects);
}

export function clearTurnEffectsForPlayer(game: IGame, playerId: string): void {
  const effects = turnEffectsByGame.get(game);
  if (!effects) return;
  turnEffectsByGame.set(
    game,
    effects.filter((effect) => effect.playerId !== playerId),
  );
}

export function shouldIgnoreAsteroidLeaveCostForTurnEffects(
  game: IGame,
  playerId: string,
): boolean {
  return getActiveEffects(game, playerId).some(
    (stored) => stored.effect.ignoreAsteroidLeaveCost === true,
  );
}

export function emitMovementStepTurnEvent(
  game: IGame,
  player: IPlayer,
  event: IMovementStepTurnEvent,
): IPlayerInput | undefined {
  let pendingInput: IPlayerInput | undefined;
  for (const stored of getActiveEffects(game, player.id)) {
    const input = stored.effect.onMovementStep?.({ game, player }, event);
    if (input !== undefined) {
      pendingInput ??= input;
    }
  }

  for (const element of event.toSpace.elements) {
    if (
      (element.type === ESolarSystemElementType.PLANET ||
        element.type === ESolarSystemElementType.EARTH) &&
      element.planet
    ) {
      const input = emitPlanetVisitedTurnEvent(game, player, {
        planet: element.planet,
        publicityGained: event.publicityGained,
        movement: event,
      });
      if (input !== undefined) {
        pendingInput ??= input;
      }
    }
    if (
      element.type === ESolarSystemElementType.ASTEROID &&
      element.amount > 0
    ) {
      emitAsteroidsVisitedTurnEvent(game, player);
    }
    if (element.type === ESolarSystemElementType.COMET && element.amount > 0) {
      emitCometVisitedTurnEvent(game, player);
    }
  }

  return pendingInput;
}

export function emitPlanetVisitedTurnEvent(
  game: IGame,
  player: IPlayer,
  event: IPlanetVisitedTurnEvent,
): IPlayerInput | undefined {
  let pendingInput: IPlayerInput | undefined;
  for (const stored of getActiveEffects(game, player.id)) {
    const input = stored.effect.onPlanetVisited?.({ game, player }, event);
    if (input !== undefined) {
      pendingInput ??= input;
    }
  }
  return pendingInput;
}

export function emitAsteroidsVisitedTurnEvent(
  game: IGame,
  player: IPlayer,
): void {
  for (const stored of getActiveEffects(game, player.id)) {
    stored.effect.onAsteroidsVisited?.({ game, player });
  }
}

export function emitCometVisitedTurnEvent(game: IGame, player: IPlayer): void {
  for (const stored of getActiveEffects(game, player.id)) {
    stored.effect.onCometVisited?.({ game, player });
  }
}

export function emitSectorCompletedTurnEvent(
  game: IGame,
  player: IPlayer,
  sectorId: string,
): void {
  for (const stored of getActiveEffects(game, player.id)) {
    stored.effect.onSectorCompleted?.({ game, player }, sectorId);
  }
}

function getStoredEffects(game: IGame): IStoredTurnEffect[] {
  return turnEffectsByGame.get(game) ?? [];
}

function getActiveEffects(game: IGame, playerId: string): IStoredTurnEffect[] {
  const effects = getStoredEffects(game);
  const active = effects.filter(
    (stored) =>
      stored.playerId === playerId && stored.turnIndex === game.turnIndex,
  );
  if (active.length !== effects.length) {
    turnEffectsByGame.set(
      game,
      effects.filter((stored) => stored.turnIndex === game.turnIndex),
    );
  }
  return active;
}
