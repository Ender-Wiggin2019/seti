import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType } from '@seti/common/types/effect';
import { EndGameScoringCard, ImmediateCard, MissionCard } from '../Card.js';
import type { ICard } from '../ICard.js';

class GenericImmediateCard extends ImmediateCard {
  public constructor(cardData: IBaseCard) {
    super(cardData);
  }
}

class GenericMissionCard extends MissionCard {
  public constructor(cardData: IBaseCard) {
    super(cardData);
  }
}

class GenericEndGameCard extends EndGameScoringCard {
  public constructor(cardData: IBaseCard) {
    super(cardData);
  }
}

export function createGenericCard(cardData: IBaseCard): ICard {
  const effects = cardData.effects ?? [];
  if (effects.some((effect) => effect.effectType === EEffectType.END_GAME)) {
    return new GenericEndGameCard(cardData);
  }
  if (
    effects.some(
      (effect) =>
        effect.effectType === EEffectType.MISSION_FULL ||
        effect.effectType === EEffectType.MISSION_QUICK,
    )
  ) {
    return new GenericMissionCard(cardData);
  }
  return new GenericImmediateCard(cardData);
}
