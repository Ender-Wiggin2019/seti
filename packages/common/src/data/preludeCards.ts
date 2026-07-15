/*
 * @Author: Ender-Wiggin
 * @Date: 2025-11-05 00:08:55
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-05 02:16:08
 * @Description: Prelude Cards Data
 */

import { DESC, e } from '@seti/common/constant/effect';
import { EStarName } from '@seti/common/constant/sectorSetup';

import { EPlanet, EResource, ETrace } from '@seti/common/types/element';
import { IPreludeCard } from '@seti/common/types/prelude';

export const preludeCards: IPreludeCard[] = [
  {
    id: 'SR.1',
    upperEffects: [e.TRACE_YELLOW()],
    upperText: 'prelude.mark',
    middleText: 'in the discovery space of the right species',
    lowerEffects: [e.SCORE(3), e.PUBLICITY()],
    setupMarks: [{ kind: 'trace', trace: ETrace.YELLOW, alienIndex: 1 }],
    watermark: true,
  },
  {
    id: 'SR.2',
    upperEffects: [e.TRACE_RED()],
    upperText: 'prelude.mark',
    middleText: 'in the discovery space of the right species',
    lowerEffects: [e.SCORE(3), e.PUBLICITY()],
    setupMarks: [{ kind: 'trace', trace: ETrace.PINK, alienIndex: 1 }],
    watermark: true,
  },
  {
    id: 'SR.3',
    upperEffects: [e.SIGNAL_RED(2)],
    upperText: 'prelude.mark',
    middleText: "in Barnard's Star",
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [
      { kind: 'signal', starName: EStarName.BARNARDS_STAR, count: 2 },
    ],

    watermark: true,
  },
  {
    id: 'SR.4',
    upperEffects: [e.SIGNAL_RED(2)],
    upperText: 'prelude.mark',
    middleText: 'in Proxima Centauri',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [
      { kind: 'signal', starName: EStarName.PROXIMA_CENTAURI, count: 2 },
    ],

    watermark: true,
  },
  {
    id: 'SR.5',
    upperEffects: [e.SIGNAL_BLUE(2)],
    upperText: 'prelude.mark',
    middleText: 'in Sirius A',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [{ kind: 'signal', starName: EStarName.SIRIUS_A, count: 2 }],

    watermark: true,
  },
  {
    id: 'SR.6',
    upperEffects: [e.SIGNAL_BLUE(2)],
    upperText: 'prelude.mark',
    middleText: 'in Procyon',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [{ kind: 'signal', starName: EStarName.PROCYON, count: 2 }],

    watermark: true,
  },
  {
    id: 'SR.7',
    upperEffects: [e.SIGNAL_YELLOW(2)],
    upperText: 'prelude.mark',
    middleText: 'in Kepler 22',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [{ kind: 'signal', starName: EStarName.KEPLER_22, count: 2 }],

    watermark: true,
  },
  {
    id: 'SR.8',
    upperEffects: [e.SIGNAL_YELLOW(2)],
    upperText: 'prelude.mark',
    middleText: 'in 61 Virginis',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [
      { kind: 'signal', starName: EStarName.SIXTY_ONE_VIRGINIS, count: 2 },
    ],

    watermark: true,
  },
  {
    id: 'SR.9',
    upperEffects: [e.SIGNAL_BLACK(2)],
    upperText: 'prelude.mark',
    middleText: 'in Beta Pictoris',
    lowerEffects: [e.SCORE(2), e.DATA(2)],
    setupMarks: [
      { kind: 'signal', starName: EStarName.BETA_PICTORIS, count: 2 },
    ],

    watermark: true,
  },
  {
    id: 'SR.10',
    upperEffects: [e.SIGNAL_BLACK()],
    upperText: 'prelude.mark',
    middleText: 'in Vega',
    lowerEffects: [e.SIGNAL_TOKEN(), e.DATA(1)],
    setupMarks: [{ kind: 'signal', starName: EStarName.VEGA, count: 1 }],

    watermark: true,
  },
  {
    id: 'SR.11',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Saturn',
    lowerEffects: [e.SCORE(4), e.PUBLICITY(2)],
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.SATURN }],

    watermark: true,
  },
  {
    id: 'SR.12',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Venus',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.ENERGY()],
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.VENUS }],

    watermark: true,
  },
  {
    id: 'SR.13',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Jupiter',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.DATA()],
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.JUPITER }],

    watermark: true,
  },
  {
    id: 'SR.14',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Mercury',
    lowerEffects: [e.SCORE(2), e.PUBLICITY(), e.CREDIT()],
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.MERCURY }],

    watermark: true,
  },
  {
    id: 'SR.15',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Uranus',
    lowerEffects: [DESC('prelude.card_income')],
    income: EResource.CARD,
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.URANUS }],
    watermark: true,
  },
  {
    id: 'SR.16',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Neptune',
    lowerEffects: [DESC('prelude.data_income')],
    income: EResource.DATA,
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.NEPTUNE }],
    watermark: true,
  },
  {
    id: 'SR.17',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Mars',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.CARD()],
    setupMarks: [{ kind: 'orbiter', planet: EPlanet.MARS }],

    watermark: true,
  },
  {
    id: 'SR.18',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.CREDIT(), e.CARD()],
    setupMarks: [],

    watermark: true,
  },
  {
    id: 'SR.19',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.ENERGY(), e.CARD()],
    setupMarks: [],

    watermark: true,
  },
  {
    id: 'SR.20',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(4), e.SIGNAL_TOKEN(), e.PUBLICITY()],
    setupMarks: [],

    watermark: true,
  },
  {
    id: 'SR.21',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(3)],
    setupMarks: [],

    watermark: true,
  },
];

export const PRELUDE_CARDS_BY_ID: Readonly<Record<string, IPreludeCard>> =
  Object.freeze(
    Object.fromEntries(preludeCards.map((card) => [card.id, card])),
  );

export function createPreludeSetupCandidates(): Array<{
  id: string;
  label: string;
  permission: { canChoose: true };
}> {
  return preludeCards.map((card) => ({
    id: card.id,
    label: `Quick Start Card ${card.id}`,
    permission: { canChoose: true },
  }));
}
