import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  discardTopDeckCardsForSignals,
  enqueueCoreCardEffect,
} from './baseSignalBatchCardUtils.js';

export class AmateurAstronomersCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('122'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueCoreCardEffect(context, (player, game) =>
      discardTopDeckCardsForSignals(player, game, 3),
    );
    return undefined;
  }
}
