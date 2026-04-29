import { SelectCard } from '@/engine/input/SelectCard.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  cardItemId,
  gainFreeActionCorner,
  isAlienCardId,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.20';
const HANDLED_CUSTOM_ID = 'sa.desc.card_20';

export class WellExecutedProject extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const candidates = context.player.hand
        .map((card, index) => ({ id: cardItemId(card), index }))
        .filter(
          (card): card is { id: string; index: number } =>
            card.id !== undefined && !isAlienCardId(card.id),
        );
      if (candidates.length === 0) return undefined;
      return new SelectCard(
        context.player,
        {
          cards: candidates,
          minSelections: 1,
          maxSelections: 1,
          onSelect: ([selectedId]) => {
            context.player.removeCardById(selectedId);
            game.mainDeck.discard(selectedId);
            gainFreeActionCorner(context.player, game, selectedId, 3);
            return undefined;
          },
        },
        'Discard a non-alien card',
      );
    });
    return undefined;
  }
}
