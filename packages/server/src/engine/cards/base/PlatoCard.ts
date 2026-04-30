import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  createProbeSectorNoDataSignalInput,
  enqueueCoreCardEffect,
} from './baseSignalBatchCardUtils.js';

export class PlatoCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('118'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueCoreCardEffect(context, (player, game) =>
      createProbeSectorNoDataSignalInput(player, game, 3),
    );
    return undefined;
  }
}
