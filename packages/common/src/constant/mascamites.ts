import type { TAlienSlotReward } from './alienBoardConfig';
import { EPlanet } from '../types/element';

export type TMascamitesSampleTokenId =
  | 'mascamites-credit-2'
  | 'mascamites-energy-2'
  | 'mascamites-card-2'
  | 'mascamites-publicity-3'
  | 'mascamites-data-2'
  | 'mascamites-vp-3-card-any-1'
  | 'mascamites-vp-7';

export interface IMascamitesSampleToken {
  id: TMascamitesSampleTokenId;
  rewards: readonly TAlienSlotReward[];
}

export type TMascamitesSampleSourcePlanet = EPlanet.JUPITER | EPlanet.SATURN;

export type TMascamitesSamplePools = Record<
  TMascamitesSampleSourcePlanet,
  TMascamitesSampleTokenId[]
>;

export const MASCAMITES_SAMPLE_SOURCE_PLANETS: readonly TMascamitesSampleSourcePlanet[] =
  [EPlanet.JUPITER, EPlanet.SATURN];

export const MASCAMITES_SAMPLE_TOKENS: readonly IMascamitesSampleToken[] = [
  {
    id: 'mascamites-credit-2',
    rewards: [{ type: 'CREDIT', amount: 2 }],
  },
  {
    id: 'mascamites-energy-2',
    rewards: [{ type: 'ENERGY', amount: 2 }],
  },
  {
    id: 'mascamites-card-2',
    rewards: [{ type: 'CARD', amount: 2 }],
  },
  {
    id: 'mascamites-publicity-3',
    rewards: [{ type: 'PUBLICITY', amount: 3 }],
  },
  {
    id: 'mascamites-data-2',
    rewards: [{ type: 'DATA', amount: 2 }],
  },
  {
    id: 'mascamites-vp-3-card-any-1',
    rewards: [
      { type: 'VP', amount: 3 },
      { type: 'CARD_ANY', amount: 1 },
    ],
  },
  {
    id: 'mascamites-vp-7',
    rewards: [{ type: 'VP', amount: 7 }],
  },
];

export function getMascamitesSampleToken(
  sampleTokenId: TMascamitesSampleTokenId,
): IMascamitesSampleToken | undefined {
  return MASCAMITES_SAMPLE_TOKENS.find((token) => token.id === sampleTokenId);
}

export function createEmptyMascamitesSamplePools(): TMascamitesSamplePools {
  return {
    [EPlanet.JUPITER]: [],
    [EPlanet.SATURN]: [],
  };
}
