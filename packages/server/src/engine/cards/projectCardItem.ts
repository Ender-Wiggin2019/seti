import type { IBaseCard } from '@seti/common/types/BaseCard';
import type { TCardItem } from '../player/IPlayer.js';
import { hasCardData, loadCardData } from './loadCardData.js';

export function projectCardItem(card: TCardItem): IBaseCard {
  if (typeof card === 'string') {
    return { ...loadCardData(card) };
  }

  const candidate = card as Record<string, unknown>;
  const optionId = typeof candidate.id === 'string' ? candidate.id : undefined;
  const cardId =
    typeof candidate.cardId === 'string' ? candidate.cardId : undefined;
  const baseOptionId = optionId?.split('@')[0];
  const lookupId =
    optionId && hasCardData(optionId)
      ? optionId
      : baseOptionId && hasCardData(baseOptionId)
        ? baseOptionId
        : (cardId ?? optionId);
  const projectedId = optionId ?? cardId;

  if (!lookupId || !projectedId || !hasCardData(lookupId)) {
    return { ...(candidate as unknown as IBaseCard) };
  }

  return {
    ...loadCardData(lookupId),
    ...candidate,
    id: projectedId,
  };
}

export function projectCardItems(cards: readonly TCardItem[]): IBaseCard[] {
  return cards.map((card) => projectCardItem(card));
}
