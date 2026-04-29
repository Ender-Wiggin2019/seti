import { EResource } from '@seti/common/types/element';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';

export function resolveCardIncomeType(cardId: string): EResource | undefined {
  if (!hasCardData(cardId)) return undefined;
  return loadCardData(cardId).income;
}
