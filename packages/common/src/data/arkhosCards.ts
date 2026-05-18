import { DESC } from '@seti/common/constant/effect';
import { EAlienType, type IBaseCard } from '@seti/common/types/BaseCard';
import { CardSource } from '@seti/common/types/CardSource';
import { EResource, ETrace } from '@seti/common/types/element';

export type TArkhosSecurityTrace = ETrace.RED | ETrace.YELLOW | ETrace.BLUE;

export type TArkhosSecurityCardZone = 'front' | 'hand' | 'used';

export type TArkhosExplorationRewardSize = 'minor' | 'major';

export interface IArkhosExplorationCardData {
  cardId: string;
  minorEffectId: string;
  majorEffectId: string;
}

export interface IArkhosSecurityCardData {
  cardId: string;
  traceColor: TArkhosSecurityTrace;
  questCondition: string;
  minorEffectId: string;
  majorEffectId: string;
  creditCost: number;
}

export interface IArkhosSecurityCardState {
  cardId: string;
  traceColor: TArkhosSecurityTrace;
  zone: TArkhosSecurityCardZone;
}

export type TArkhosSecurityCardsByPlayer = Record<
  string,
  IArkhosSecurityCardState[]
>;

export interface IArkhosAccessState {
  breachedCount: number;
  accessLevel: number;
}

export type TArkhosAccessByPlayer = Record<string, IArkhosAccessState>;

export interface IArkhosExplorationRewardRecord {
  playerId: string;
  cardId: string;
  size: TArkhosExplorationRewardSize;
  effectId: string;
}

export const ARKHOS_EXPLORATION_CARD_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 9 }, (_, index) => `ARKHOS.EXPLORATION.${index + 1}`),
);

export const ARKHOS_SECURITY_CARD_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 12 }, (_, index) => {
    const id = index + 1;
    return `AIcard${id.toString().padStart(2, '0')}`;
  }),
);

const ARKHOS_SECURITY_TRACE_GROUPS: readonly TArkhosSecurityTrace[] =
  Object.freeze([ETrace.RED, ETrace.YELLOW, ETrace.BLUE]);

export const ARKHOS_EXPLORATION_CARDS: readonly IArkhosExplorationCardData[] =
  Object.freeze(
    ARKHOS_EXPLORATION_CARD_IDS.map((cardId, index) => {
      const effectNumber = (index + 1).toString().padStart(2, '0');
      return Object.freeze({
        cardId,
        minorEffectId: `ARKHOS_EXPLORATION_${effectNumber}_MINOR_UNMAPPED`,
        majorEffectId: `ARKHOS_EXPLORATION_${effectNumber}_MAJOR_UNMAPPED`,
      });
    }),
  );

export const ARKHOS_SECURITY_CARDS: readonly IArkhosSecurityCardData[] =
  Object.freeze(
    ARKHOS_SECURITY_CARD_IDS.map((cardId, index) => {
      const traceColor = ARKHOS_SECURITY_TRACE_GROUPS[Math.floor(index / 4)];
      return Object.freeze({
        cardId,
        traceColor,
        questCondition: `useLife${traceColor}`,
        minorEffectId: `${cardId}_MINOR_EXPLORATION`,
        majorEffectId: `${cardId}_MAJOR_EXPLORATION`,
        creditCost: 2,
      });
    }),
  );

export const arkhosCards: IBaseCard[] = ARKHOS_SECURITY_CARDS.map((card) => ({
  id: card.cardId,
  name: `Arkhos Security ${card.cardId.slice(-2)}`,
  price: card.creditCost,
  income: EResource.CREDIT,
  alien: EAlienType.ARKHOS,
  effects: [
    DESC(`arkhos.security.${card.traceColor}.minor`),
    DESC(`arkhos.security.${card.traceColor}.major`),
  ],
  special: {
    enableEffectRender: true,
    watermark: false,
  },
  source: CardSource.SPACE_AGENCY,
}));

export function getArkhosSecurityCardsByTrace(
  traceColor: TArkhosSecurityTrace,
): IArkhosSecurityCardData[] {
  return ARKHOS_SECURITY_CARDS.filter(
    (card) => card.traceColor === traceColor,
  ).map((card) => ({ ...card }));
}
