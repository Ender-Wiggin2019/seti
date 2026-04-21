import { EResource } from '@seti/common/types/element';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';

const INCOME_RESOURCE_MAP: Record<EResource, EResource | undefined> = {
  [EResource.CREDIT]: EResource.CREDIT,
  [EResource.ENERGY]: EResource.ENERGY,
  [EResource.CARD]: EResource.CARD,
  [EResource.DATA]: EResource.DATA,
  [EResource.PUBLICITY]: undefined,
  [EResource.SCORE]: undefined,
  [EResource.CARD_ANY]: undefined,
  [EResource.MOVE]: undefined,
};

export function resolveCardIncomeType(cardId: string): EResource | undefined {
  if (!hasCardData(cardId)) return undefined;
  return loadCardData(cardId).income;
}

export function resolveIncomeResourceFromCardId(
  cardId: string,
): EResource | undefined {
  const incomeType = resolveCardIncomeType(cardId);
  if (!incomeType) return undefined;
  return INCOME_RESOURCE_MAP[incomeType];
}
