import { ETech } from '@seti/common/types/element';
import type { TTechCategory } from '@seti/common/types/tech';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import {
  extractSectorColorFromCardItem,
  MarkSectorSignalEffect,
} from '@/engine/effects/index.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { TCardItem } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const SCAN_TECH_FILTER = {
  mode: 'category' as const,
  categories: [ETech.SCAN as TTechCategory],
};

function toCardId(card: TCardItem, fallback: string): string {
  if (typeof card === 'string') return card;
  return card.id ?? fallback;
}

/**
 * Card No.67 - Yevpatoria Telescope Construction.
 * Gain publicity, rotate, research scan tech, then discard a hand card to
 * mark a signal matching that card's sector color.
 */
export class YevpatoriaTelescopeCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('67'), {
      behavior: {
        gainResources: { publicity: 1 },
        rotateSolarSystem: true,
      },
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const discardForSignal = () =>
            this.createOptionalHandSignalInput(context);

          if (
            !ResearchTechEffect.canExecute(
              context.player,
              game,
              SCAN_TECH_FILTER,
            )
          ) {
            return discardForSignal();
          }

          return ResearchTechEffect.execute(context.player, game, {
            filter: SCAN_TECH_FILTER,
            onComplete: () => discardForSignal(),
          });
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private createOptionalHandSignalInput(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    if (context.player.hand.length === 0) return undefined;

    const handCards = context.player.hand.map((card, index) => ({
      optionId: `discard-${toCardId(card, `hand-card-${index}`)}@${index}`,
      discardCardId: toCardId(card, `hand-card-${index}`),
      handIndex: index,
      rawCard: card,
    }));

    return new SelectOption(
      context.player,
      [
        {
          id: 'skip-hand-signal',
          label: 'Skip discard',
          onSelect: () => undefined,
        },
        ...handCards.map((card) => ({
          id: card.optionId,
          label: `Discard ${card.discardCardId}`,
          onSelect: () => {
            const discarded = context.player.removeCardAt(card.handIndex);
            context.game.mainDeck.discard(card.discardCardId);

            const sectorColor = extractSectorColorFromCardItem(discarded);
            if (sectorColor === null) return undefined;
            return MarkSectorSignalEffect.markByColor(
              context.player,
              context.game,
              sectorColor,
            );
          },
        })),
      ],
      'Discard a card from hand for a signal',
    );
  }
}
