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

/**
 * Card-reference token used in server-emitted input labels so the
 * client can swap it for the locale-specific card name at render
 * time. Falls back to a bare id reference when the card isn't in
 * the registry (transient/test ids).
 *
 * Examples:
 *   `Discard ${describeCard('67')}` → "Discard [[card:67]]"
 *   `Take ${describeCard('128')} from card row` → "Take [[card:128]] from card row"
 *
 * The client's `localizeCardNameSuffix` resolves `[[card:N]]` to
 * `<localized name> (#N)` (or just `(#N)` for unknown ids).
 */
export function describeCard(cardId: string): string {
  const card = CARD_DATA_MAP.get(cardId);
  if (!card) return `(#${cardId})`;
  return `[[card:${cardId}]]`;
}
