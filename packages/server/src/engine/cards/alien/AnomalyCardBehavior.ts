import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

type TAnomalyCardEffect = (
  player: IPlayer,
  game: IGame,
) => IPlayerInput | undefined;

export function behaviorWithoutCustom(cardId: string): IBehavior {
  const behavior = {
    ...behaviorFromEffects(loadCardData(cardId).effects ?? []),
  };
  delete behavior.custom;
  return behavior;
}

export function enqueueAnomalyCardEffect(
  context: ICardRuntimeContext,
  effect: TAnomalyCardEffect,
): void {
  context.game.deferredActions.push(
    new SimpleDeferredAction(
      context.player,
      (game) => effect(context.player, game),
      EPriority.CORE_EFFECT,
    ),
  );
}

export function toCardId(card: unknown, fallback: string): string {
  if (typeof card === 'string') return card;
  return (card as { id?: string })?.id ?? fallback;
}

export function gainResourceByIncome(
  player: IPlayer,
  game: IGame,
  income: EResource,
): void {
  switch (income) {
    case EResource.CREDIT:
      player.resources.gain({ credits: 1 });
      return;
    case EResource.ENERGY:
      player.resources.gain({ energy: 1 });
      return;
    case EResource.DATA:
      player.resources.gain({ data: 1 });
      return;
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: 1 });
      return;
    case EResource.SCORE:
      player.score += 1;
      return;
    case EResource.MOVE:
      player.gainMove(1);
      return;
    case EResource.CARD:
    case EResource.CARD_ANY: {
      const drawn = game.mainDeck.drawWithReshuffle(game.random);
      if (drawn !== undefined) {
        player.hand.push(drawn);
        game.lockCurrentTurn();
      }
      return;
    }
    default:
      return;
  }
}

export function incomeForCard(cardId: string): EResource | undefined {
  if (!hasCardData(cardId)) return undefined;
  return loadCardData(cardId).income;
}
