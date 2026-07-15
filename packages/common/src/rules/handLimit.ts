import { alienCards } from '../data/alienCards';
import { EAlienType, type IBaseCard } from '../types/BaseCard';

const EXERTIAN_CARD_IDS = new Set(
  alienCards
    .filter((card) => card.alien === EAlienType.EXERTIANS)
    .map((card) => card.id),
);

function getCardId(card: unknown): string | undefined {
  if (typeof card === 'string') return card;
  if (typeof card === 'object' && card !== null) {
    return (card as Partial<IBaseCard>).id;
  }
  return undefined;
}

export function isHandLimitExemptCard(card: unknown): boolean {
  const cardId = getCardId(card);
  return (
    isExertianCard(card) || (cardId ? EXERTIAN_CARD_IDS.has(cardId) : false)
  );
}

export function countCardsTowardHandLimit(hand: readonly unknown[]): number {
  return hand.filter((card) => !isHandLimitExemptCard(card)).length;
}

export function isDiscardProhibitedCard(card: unknown): boolean {
  return isHandLimitExemptCard(card);
}

export function isStandardPlayProhibitedCard(card: unknown): boolean {
  return isHandLimitExemptCard(card);
}

function isExertianCard(card: unknown): boolean {
  return (
    typeof card === 'object' &&
    card !== null &&
    (card as Partial<IBaseCard>).alien === EAlienType.EXERTIANS
  );
}
