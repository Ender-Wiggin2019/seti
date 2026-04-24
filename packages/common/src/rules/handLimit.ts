import { EAlienType, type IBaseCard } from '../types/BaseCard';

export function isHandLimitExemptCard(card: unknown): boolean {
  return (
    typeof card === 'object' &&
    card !== null &&
    (card as Partial<IBaseCard>).alien === EAlienType.EXERTIANS
  );
}

export function countCardsTowardHandLimit(hand: readonly unknown[]): number {
  return hand.filter((card) => !isHandLimitExemptCard(card)).length;
}
