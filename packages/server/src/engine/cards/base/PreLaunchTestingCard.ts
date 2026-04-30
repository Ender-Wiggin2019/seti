import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { LaunchProbeEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

function toCardId(card: TCardItem, fallback: string): string {
  if (typeof card === 'string') return card;
  return card.id ?? fallback;
}

function hasMoveCorner(card: TCardItem, fallback: string): boolean {
  const cardId = toCardId(card, fallback);
  if (!hasCardData(cardId)) return false;
  return (loadCardData(cardId).freeAction ?? []).some(
    (corner) => corner.type === EResource.MOVE && corner.value > 0,
  );
}

/**
 * Card No.74 - Pre-launch Testing.
 * Launch a probe, then gain 1 movement for each shown hand card with a move
 * free-action corner.
 */
export class PreLaunchTestingCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('74'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (LaunchProbeEffect.canExecute(context.player, game)) {
            LaunchProbeEffect.execute(context.player, game);
          }

          const movement = context.player.hand.filter((card, index) =>
            hasMoveCorner(card, `hand-card-${index}`),
          ).length;
          if (movement > 0) {
            context.player.gainMove(movement);
          }
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
