import { ALL_CARDS } from '@seti/common/data/index';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

const CARD_DATA_MAP = new Map<string, IBaseCard>(
  ALL_CARDS.map((card) => [card.id, card]),
);

export function loadCardData(cardId: string): IBaseCard {
  const card = CARD_DATA_MAP.get(cardId);
  if (!card) {
    throw new GameError(EErrorCode.INVALID_ACTION, 'Card data not found', {
      cardId,
    });
  }
  return card;
}

export function loadAllCardData(): IBaseCard[] {
  return ALL_CARDS;
}

export function hasCardData(cardId: string): boolean {
  return CARD_DATA_MAP.has(cardId);
}
