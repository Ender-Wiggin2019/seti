/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/*
 * @Author: Ender-Wiggin
 * @Date: 2024-10-22 00:01:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:33:54
 * @Description:
 */

import { DESC, e, m } from '@/constant/effect';
import { FAQ } from '@/data/faq';

import { EAlienType, IBaseCard } from '@/types/BaseCard';
import { CardSource } from '@/types/CardSource';
import { EAlienIcon, EResource, ESector } from '@/types/element';

const _spaceAgencyAliens: IBaseCard[] = [
  {
    id: 'ET.1',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.1.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_ORANGE, value: 1 } as any],
    sector: ESector.BLACK,
    price: 1,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.GLYPH_YELLOW(1, '', 'xs'),
      e.GLYPH_GREEN(1, '', 'xs'),
      DESC('OR'),
      e.GLYPH_BLUE(1, '', 'xs'),
      e.GLYPH_PURPLE(1, '', 'xs'),
      m.END_GAME('sa.desc.card_et_1'),
    ],
  },
  {
    id: 'ET.2',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.2.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_ORANGE, value: 1 } as any],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      DESC('{glyph-purple[sm]} {glyph-purple[sm]} {glyph-red[sm]}'),
      DESC('———————— OR ————————'),
      DESC('{glyph-blue[sm]} {glyph-blue[sm]} {glyph-green[sm]}'),
    ],
  },
  {
    id: 'ET.3',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.3.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_GREEN, value: 1 } as any],
    sector: ESector.YELLOW,
    price: 0,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      m.FULL_MISSION([
        { req: e.ORBIT_OR_LAND_COUNT(), reward: e.GLYPH_YELLOW() },
        { req: e.ORBIT_OR_LAND_COUNT(), reward: e.GLYPH_GRAY() },
        { req: e.ORBIT_OR_LAND_COUNT(), reward: e.GLYPH_BLUE() },
      ]),
    ],
  },
  {
    id: 'ET.4',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.4.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_GRAY, value: 1 } as any],
    sector: ESector.RED,
    price: 0,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      m.FULL_MISSION([
        { req: e.TECH_PROBE(), reward: e.GLYPH_YELLOW() },
        { req: e.TECH_SCAN(), reward: e.GLYPH_ORANGE() },
        { req: e.TECH_COMPUTER(), reward: e.GLYPH_RED() },
      ]),
    ],
  },
  {
    id: 'ET.5',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.5.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_GRAY, value: 1 } as any],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.SIGNAL_TOKEN(),
      m.FULL_MISSION([
        { req: e.SCAN(), reward: e.GLYPH_YELLOW() },
        { req: e.SCAN(), reward: e.GLYPH_PURPLE() },
      ]),
    ],
  },
  {
    id: 'ET.6',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.6.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_PURPLE, value: 1 } as any],
    sector: ESector.RED,
    price: 1,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.PUBLICITY(1, '', 'xxs'),
      e.DATA(1, '', 'xxs'),

      m.FULL_MISSION([
        { req: e.LAUNCH(), reward: e.GLYPH_ORANGE() },
        { req: e.LAUNCH(), reward: e.GLYPH_GREEN() },
      ]),
    ],
  },
  {
    id: 'ET.7',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.7.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_BLUE, value: 1 } as any],
    sector: ESector.RED,
    price: 1,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.CARD_ANY(),
      m.FULL_MISSION([
        { req: e.TRACE_ANY(), reward: e.GLYPH_RED() },
        { req: e.TRACE_ANY(), reward: e.GLYPH_GRAY() },
        { req: e.TRACE_ANY(), reward: e.GLYPH_PURPLE() },
      ]),
    ],
  },
  {
    id: 'ET.8',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.8.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_YELLOW, value: 1 } as any],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.ENERGY,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      DESC('{glyph-green[sm]} {glyph-green[sm]} {glyph-red[sm]}'),
      DESC('———————— OR ————————'),
      DESC('{glyph-gray[sm]} {glyph-gray[sm]} {glyph-orange[sm]}'),
    ],
  },
  {
    id: 'ET.9',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.9.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_GREEN, value: 1 } as any],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.CREDIT,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.GLYPH_YELLOW(1, '', 'xs'),
      e.GLYPH_PURPLE(1, '', 'xs'),
      DESC('OR'),
      e.GLYPH_BLUE(1, '', 'xs'),
      e.GLYPH_PURPLE(1, '', 'xs'),
      m.END_GAME('sa.desc.card_et_9'),
    ],
  },
  {
    id: 'ET.10',
    name: 'sa.glyphids-title',
    image: '/images/aliens/glyphids/ET.10.jpg',
    freeAction: [{ type: EAlienIcon.GLYPH_RED, value: 1 } as any],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.CARD,
    special: {
      enableEffectRender: true,
    },
    alien: EAlienType.GLYPHIDS,
    effects: [
      e.LAUNCH(),
      e.GLYPH_GREEN(),
      m.QUICK_MISSION(DESC('sa.desc.card_et_10'), [
        e.GLYPH_RED(),
        e.GLYPH_BLUE(),
      ]),
    ],
  },
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
    price: 1,
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

export default spaceAgencyAliens;
