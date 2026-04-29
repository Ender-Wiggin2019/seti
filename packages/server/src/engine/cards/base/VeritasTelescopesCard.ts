import { ESector } from '@seti/common/types/element';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { enqueueScanWithColorScore } from './baseSignalBatchCardUtils.js';

export class VeritasTelescopesCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('54'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueScanWithColorScore(context, ESector.BLUE);
    return undefined;
  }
}
