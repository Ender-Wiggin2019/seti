import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustomIds,
  createOptionalHandSignalDiscardInput,
  enqueueCoreCardEffect,
} from './baseSignalBatchCardUtils.js';

const CARD_ID = '114';
const HANDLED_CUSTOM_ID = 'desc.card-114';

export class PlanetHuntersCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustomIds(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueCoreCardEffect(context, (player, game) =>
      createOptionalHandSignalDiscardInput(player, game, 3),
    );
    return undefined;
  }
}
