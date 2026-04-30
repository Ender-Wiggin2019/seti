import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { drawCards, pushCoreAction } from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.32';

export class MurepIdeaCompetition extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      for (const card of [...context.player.hand]) {
        const cardId = typeof card === 'string' ? card : card.id;
        if (cardId) {
          context.player.removeCardById(cardId);
          game.mainDeck.discard(cardId);
        }
      }
      context.player.resources.gain({ publicity: 1 });
      drawCards(context.player, game, 2);
      return undefined;
    });
    return undefined;
  }
}
