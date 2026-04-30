import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutHandledCustom,
  createProbeAndNeighborSectorSignalInput,
  enqueueProbeSectorSignalEffect,
} from './probeSectorSignalCardUtils.js';

const CARD_ID = '29';
const HANDLED_CUSTOM_ID = 'desc.card-29';

export class JamesWebbSpaceTelescope extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutHandledCustom(CARD_ID, HANDLED_CUSTOM_ID),
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    enqueueProbeSectorSignalEffect(context, (player, game) =>
      createProbeAndNeighborSectorSignalInput(player, game),
    );
    return undefined;
  }
}
