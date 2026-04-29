import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutHandledCustom,
  createProbeSectorSignalInput,
  enqueueProbeSectorSignalEffect,
} from './probeSectorSignalCardUtils.js';

const CARD_ID = '27';
const HANDLED_CUSTOM_ID = 'desc.card-27';

export class HubbleSpaceTelescope extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutHandledCustom(CARD_ID, HANDLED_CUSTOM_ID),
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueProbeSectorSignalEffect(context, (player, game) =>
      createProbeSectorSignalInput(player, game, 1),
    );
    return undefined;
  }
}
