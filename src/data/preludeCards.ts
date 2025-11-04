/*
 * @Author: Ender-Wiggin
 * @Date: 2025-11-05 00:08:55
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-05 02:16:08
 * @Description: Prelude Cards Data
 */

import { DESC, e } from '@/constant/effect';

import { EResource } from '@/types/element';
import { IPreludeCard } from '@/types/prelude';

export const preludeCards: IPreludeCard[] = [
  {
    id: 'SR.1',
    upperEffects: [e.TRACE_YELLOW()],
    upperText: 'prelude.mark',
    middleText: 'in the discovery space of the right species',
    lowerEffects: [e.SCORE(3), e.PUBLICITY()],
    watermark: true,
  },
  {
    id: 'SR.2',
    upperEffects: [e.TRACE_RED()],
    upperText: 'prelude.mark',
    middleText: 'in the discovery space of the right species',
    lowerEffects: [e.SCORE(3), e.PUBLICITY()],
    watermark: true,
  },
  {
    id: 'SR.3',
    upperEffects: [e.SIGNAL_RED(2)],
    upperText: 'prelude.mark',
    middleText: "in Barnard's Star",
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.4',
    upperEffects: [e.SIGNAL_RED(2)],
    upperText: 'prelude.mark',
    middleText: 'in Proxima Centauri',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.5',
    upperEffects: [e.SIGNAL_BLUE(2)],
    upperText: 'prelude.mark',
    middleText: 'in Sirius A',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.6',
    upperEffects: [e.SIGNAL_BLUE(2)],
    upperText: 'prelude.mark',
    middleText: 'in Procyon',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.7',
    upperEffects: [e.SIGNAL_YELLOW(2)],
    upperText: 'prelude.mark',
    middleText: 'in Kepler 22',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.8',
    upperEffects: [e.SIGNAL_YELLOW(2)],
    upperText: 'prelude.mark',
    middleText: 'in 61 Virginis',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.9',
    upperEffects: [e.SIGNAL_BLACK(2)],
    upperText: 'prelude.mark',
    middleText: 'in Beta Pictoris',
    lowerEffects: [e.SCORE(2), e.DATA(2)],

    watermark: true,
  },
  {
    id: 'SR.10',
    upperEffects: [e.SIGNAL_BLACK()],
    upperText: 'prelude.mark',
    middleText: 'in Vega',
    lowerEffects: [e.SIGNAL_TOKEN(), e.DATA(1)],

    watermark: true,
  },
  {
    id: 'SR.11',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Saturn',
    lowerEffects: [e.SCORE(4), e.PUBLICITY(2)],

    watermark: true,
  },
  {
    id: 'SR.12',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Venus',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.ENERGY()],

    watermark: true,
  },
  {
    id: 'SR.13',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Jupiter',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.DATA()],

    watermark: true,
  },
  {
    id: 'SR.14',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Mercury',
    lowerEffects: [e.SCORE(2), e.PUBLICITY(), e.CREDIT()],

    watermark: true,
  },
  {
    id: 'SR.15',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Uranus',
    lowerEffects: [DESC('prelude.card_income')],
    income: EResource.CARD,
    watermark: true,
  },
  {
    id: 'SR.16',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Neptune',
    lowerEffects: [DESC('prelude.data_income')],
    income: EResource.DATA,
    watermark: true,
  },
  {
    id: 'SR.17',
    upperEffects: [e.ORBIT_COUNT()],
    upperText: 'prelude.place',
    middleText: 'at Mars',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(), e.CARD()],

    watermark: true,
  },
  {
    id: 'SR.18',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.CREDIT(), e.CARD()],

    watermark: true,
  },
  {
    id: 'SR.19',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.ENERGY(), e.CARD()],

    watermark: true,
  },
  {
    id: 'SR.20',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(4), e.SIGNAL_TOKEN(), e.PUBLICITY()],

    watermark: true,
  },
  {
    id: 'SR.21',
    upperEffects: [],
    upperText: '',
    middleText: '',
    lowerEffects: [e.SCORE(3), e.PUBLICITY(3)],

    watermark: true,
  },
];
