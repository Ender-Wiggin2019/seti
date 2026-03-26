import { EResource } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { RefillCardRowEffect } from '@/engine/effects/cardRow/RefillCardRowEffect.js';
import { SelectCardFromCardRowEffect } from '@/engine/effects/cardRow/SelectCardFromCardRowEffect.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.106 - Strategic Planning.
 *
 * Bespoke branch used by representative-card tests:
 * pay 2 credits to either draw from deck or pick from card row.
 */
export class StrategicPlanning extends MissionCard {
  public constructor() {
    super(loadCardData('106'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          if (!context.player.resources.has({ credits: 2 })) {
            return undefined;
          }
          return new SelectOption(
            context.player,
            [
              {
                id: 'spend-2',
                label: 'Spend 2 credits',
                onSelect: () => this.buildSpendBranch(context),
              },
              {
                id: 'skip',
                label: 'Skip',
                onSelect: () => undefined,
              },
            ],
            'Strategic Planning',
          );
        },
        EPriority.DEFAULT,
      ),
    );
    return undefined;
  }

  private buildSpendBranch(context: ICardRuntimeContext): IPlayerInput {
    context.player.resources.spend({ credits: 2 });
    return new SelectOption(
      context.player,
      [
        {
          id: 'draw-deck',
          label: 'Draw from deck',
          onSelect: () => {
            const drawn = context.game.mainDeck.drawWithReshuffle(
              context.game.random,
            );
            if (drawn !== undefined) {
              context.player.hand.push(drawn);
            }
            return undefined;
          },
        },
        {
          id: 'select-row',
          label: 'Take from row',
          onSelect: () =>
            SelectCardFromCardRowEffect.execute(context.player, context.game, {
              destination: 'hand',
              onComplete: () => {
                RefillCardRowEffect.execute(context.game);
                return undefined;
              },
            }),
        },
      ],
      `Pay 2 ${EResource.CREDIT}`,
    );
  }
}
