import { ESector } from '@seti/common/types/element';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  enqueueCoreCardEffect,
  markColorChainWithoutData,
} from './baseSignalBatchCardUtils.js';

const SIGNAL_COLORS = [
  ESector.YELLOW,
  ESector.RED,
  ESector.BLUE,
  ESector.BLACK,
] as const;

export class AlgonquinRadioObservatoryCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('136'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueCoreCardEffect(context, (player, game) =>
      markColorChainWithoutData(player, game, SIGNAL_COLORS),
    );
    return undefined;
  }
}
