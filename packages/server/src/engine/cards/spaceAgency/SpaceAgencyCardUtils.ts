import { EResource, ETech } from '@seti/common/types/element';
import type { ETechId } from '@seti/common/types/tech';
import { getTechDescriptor } from '@seti/common/types/tech';
import type { Sector } from '@/engine/board/Sector.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IGame } from '@/engine/IGame.js';
import {
  EMissionEventType,
  type IMissionRuntimeState,
} from '@/engine/missions/IMission.js';
import type { IPlayer, TCardItem } from '@/engine/player/IPlayer.js';
import { EPieceType } from '@/engine/player/Pieces.js';
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

export function returnCardToHand(player: IPlayer, cardId: string): void {
  if (player.findCardInHand(cardId) < 0) {
    player.hand.push(cardId);
  }
}

export function cardItemId(card: TCardItem): string | undefined {
  if (typeof card === 'string') return card;
  return card.id;
}

export function isAlienCardId(cardId: string): boolean {
  return cardId.startsWith('ET.');
}

export function gainFreeActionCorner(
  player: IPlayer,
  game: IGame,
  cardId: string,
  multiplier: number,
): void {
  if (!hasCardData(cardId)) return;

  const cardData = loadCardData(cardId);
  for (const reward of cardData.freeAction ?? []) {
    const amount = reward.value * multiplier;
    if (amount <= 0) continue;

    switch (reward.type) {
      case EResource.CREDIT:
        player.resources.gain({ credits: amount });
        break;
      case EResource.ENERGY:
        player.resources.gain({ energy: amount });
        break;
      case EResource.PUBLICITY:
        player.resources.gain({ publicity: amount });
        break;
      case EResource.DATA:
        player.resources.gain({ data: amount });
        break;
      case EResource.SIGNAL_TOKEN:
        player.resources.gain({ signalTokens: amount });
        break;
      case EResource.MOVE:
        player.gainMove(amount);
        break;
      case EResource.SCORE:
        player.score += amount;
        break;
      case EResource.CARD:
      case EResource.CARD_ANY:
        drawCards(player, game, amount);
        break;
      default:
        break;
    }
  }
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
}

export function gainIncomeCornerResource(
  player: IPlayer,
  game: IGame,
  cardId: string,
): void {
  if (!hasCardData(cardId)) return;

  const income = loadCardData(cardId).income;
  switch (income) {
    case EResource.CREDIT:
      player.resources.gain({ credits: 1 });
      break;
    case EResource.ENERGY:
      player.resources.gain({ energy: 1 });
      break;
    case EResource.CARD:
    case EResource.CARD_ANY:
      drawCards(player, game, 1);
      break;
    case EResource.DATA:
      player.resources.gain({ data: 1 });
      break;
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: 1 });
      break;
    case EResource.SIGNAL_TOKEN:
      player.resources.gain({ signalTokens: 1 });
      break;
    case EResource.MOVE:
      player.gainMove(1);
      break;
    case EResource.SCORE:
      player.score += 1;
      break;
    default:
      break;
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
