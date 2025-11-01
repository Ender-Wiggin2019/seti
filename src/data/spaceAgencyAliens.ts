/*
 * @Author: Ender-Wiggin
 * @Date: 2024-10-22 00:01:17
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 17:05:56
 * @Description:
 */
// import {Size} from "@/types/Size";

import { DESC, e, m } from '@/constant/effect';
import { FAQ } from '@/data/faq';

import { EAlienType, IBaseCard } from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { EResource, ESector } from '@/types/element';

const _spaceAgencyAliens: IBaseCard[] = [
  {
    id: 'ET.11',
    name: 'Biosignature Screening',
    image: '/images/aliens/amoeba/ET.11.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.CARD_ANY(),
      e.ORGANELLE_RED(),
      m.END_GAME('sa.desc.card_et_11'),
    ],
  },
  {
    id: 'ET.12',
    name: 'Physical Characterization',
    image: '/images/aliens/amoeba/ET.12.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.CARD_ANY(),
      e.ORGANELLE_YELLOW(),
      m.END_GAME('sa.desc.card_et_12'),
    ],
  },
  {
    id: 'ET.13',
    name: 'Genome Characterization',
    image: '/images/aliens/amoeba/ET.13.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.CARD_ANY(),
      e.ORGANELLE_BLUE(),
      m.END_GAME('sa.desc.card_et_13'),
    ],
  },
  {
    id: 'ET.14',
    name: 'Breakthrough Theory',
    image: '/images/aliens/amoeba/ET.14.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.PUBLICITY(3),
      m.QUICK_MISSION(DESC('sa.desc.card_et_14_req'), [
        DESC('sa.desc.card_et_14_reward'),
      ]),
    ],
  },
  {
    id: 'ET.15',
    name: 'Low-gravity Research',
    image: '/images/aliens/amoeba/ET.15.jpg',
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 2,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.LAUNCH(),
      e.ORGANELLE_YELLOW(),
      m.FULL_MISSION([
        { req: e.TRACE_BLUE(), reward: e.DATA() },
        { req: e.TRACE_BLUE(), reward: e.DATA() },
      ]),
    ],
  },
  {
    id: 'ET.16',
    name: 'Automated Analysis',
    image: '/images/aliens/amoeba/ET.16.jpg',
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.DATA(3),
      e.ORGANELLE_BLUE(),
      m.FULL_MISSION([
        { req: e.TRACE_RED(), reward: e.DATA() },
        { req: e.TRACE_YELLOW(), reward: e.DATA() },
      ]),
    ],
  },
  {
    id: 'ET.17',
    name: 'Safety Protocols',
    image: '/images/aliens/amoeba/ET.17.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.PUBLICITY(1, '', 'xxs'),
      m.FULL_MISSION([
        { req: e.TECH_PROBE(), reward: e.ORGANELLE_YELLOW() },
        { req: e.TECH_SCAN(), reward: e.ORGANELLE_RED() },
        { req: e.TECH_COMPUTER(), reward: e.ORGANELLE_BLUE() },
      ]),
    ],
  },
  {
    id: 'ET.18',
    name: 'Scientific Papers',
    image: '/images/aliens/amoeba/ET.18.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [
      e.CARD(2),
      m.FULL_MISSION([
        { req: e.TRACE_ANY(1, 'for this species'), reward: e.PUBLICITY() },
        { req: e.TRACE_ANY(1, 'for this species'), reward: e.PUBLICITY() },
      ]),
    ],
  },
  {
    id: 'ET.19',
    name: 'Extreme Conditions Testing',
    image: '/images/aliens/amoeba/ET.19.jpg',
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLACK,
    price: 0,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [DESC('sa.desc.card_et_18')],
  },
  {
    id: 'ET.20',
    name: 'Place of Origin',
    image: '/images/aliens/amoeba/ET.20.jpg',
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 0,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.AMOEBA,
    effects: [e.SIGNAL_TOKEN(), e.PUBLICITY(), e.ORGANELLE_RED()],
  },
];

// add flavorText
export const spaceAgencyAliens: IBaseCard[] = _spaceAgencyAliens.map((card) => {
  const id = `SA.${card.id}`;
  return {
    ...card,
    id,
    flavorText: `sa.flavor_text.card_${card.id}`,
    special: {
      ...card.special,
      titleHeight: 86,
      enableEffectRender: true,
      watermark: true,
      faq: FAQ[id],
    },
    source: CardSource.SPACE_AGENCY,
  };
});

console.log('🎸 [test] - spaceAgencyAliens:', spaceAgencyAliens);
export default spaceAgencyAliens;
