import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { RefillCardRowEffect } from '@/engine/effects/index.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

const CARD_ID = '11';

export class GrantCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const drawn = game.mainDeck.drawWithReshuffle(game.random);
          if (drawn === undefined) return undefined;

          context.player.hand.push(drawn);
          game.lockCurrentTurn();
          RefillCardRowEffect.execute(game);
          applyCornerReward(context.player, game, drawn);
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function applyCornerReward(player: IPlayer, game: IGame, cardId: string): void {
  if (!hasCardData(cardId)) return;
  const cardData = loadCardData(cardId);
  for (const cornerReward of cardData.freeAction ?? []) {
    const value = cornerReward.value;
    if (value <= 0) continue;
    game.missionTracker.recordEvent({
      type: EMissionEventType.CARD_CORNER_USED,
      resourceType: cornerReward.type,
    });

    switch (cornerReward.type) {
      case EResource.CREDIT:
        player.resources.gain({ credits: value });
        break;
      case EResource.ENERGY:
        player.resources.gain({ energy: value });
        break;
      case EResource.DATA:
        player.resources.gain({ data: value });
        break;
      case EResource.PUBLICITY:
        player.resources.gain({ publicity: value });
        break;
      case EResource.SIGNAL_TOKEN:
        player.resources.gain({ signalTokens: value });
        break;
      case EResource.SCORE:
        player.score += value;
        break;
      case EResource.MOVE:
        player.gainMove(value);
        break;
      default:
        break;
    }
  }
}
