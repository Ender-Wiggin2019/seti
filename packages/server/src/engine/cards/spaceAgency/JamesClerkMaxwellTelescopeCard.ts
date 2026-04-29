import { ImmediateCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';
import { behaviorWithoutCustom } from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.13';
const HANDLED_CUSTOM_ID = 'sa.desc.card_13';

export class JamesClerkMaxwellTelescope extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: {
        ...behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
        markAnySignal: 1,
      },
    });
  }
}
