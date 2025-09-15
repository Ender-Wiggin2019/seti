/*
 * @Author: Ender-Wiggin
 * @Date: 2024-10-22 00:01:17
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-09-15 15:15:28
 * @Description:
 */
// import {Size} from "@/types/Size";

// import baseCards from '@/data/baseCards';
// import { flavorTexts } from '@/data/flavorTexts';

import { DESC, DESC_WITH_TYPE, e, m } from '@/constant/effect';

import { EAlienType, IBaseCard } from '@/types/BaseCard';
import { EResource, EScanAction, ESector } from '@/types/element';

export const _alienCards: any[] = [
  {
    id: 'ET.20',
    name: 'Amazing Uncertainty',
    position: { src: '/images/aliens/anomalies.webp', row: 0, col: 0 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.ANOMALIES,
    effects: [e.SIGNAL_ANY(), DESC('in any sector.'), DESC('desc.et-20')],
  },
  {
    id: 'ET.17',
    name: 'Are we Being Observed?',
    position: { src: '/images/aliens/anomalies.webp', row: 0, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.ANOMALIES,
    effects: [
      DESC('desc.et-17'),
      m.QUICK_MISSION(
        [
          e.TRACE_RED(1, '', 'desc'),
          e.TRACE_YELLOW(1, '', 'desc'),
          e.TRACE_BLUE(1, '', 'desc'),
          DESC('for this species'),
        ],
        [e.SCORE(3), e.PUBLICITY(2)]
      ),
    ],
    special: {
      descHelper:
        'Gain the reward from the anomaly which is going to be triggered next.',
    },
  },
  {
    id: 'ET.12',
    name: 'Close-up View',
    position: { src: '/images/aliens/anomalies.webp', row: 0, col: 2 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.RED,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.ANOMALIES,
    effects: [e.MOVE(5), DESC('desc.et-12')],
  },
  {
    id: 'ET.13',
    name: 'Concerned People',
    position: { src: '/images/aliens/anomalies.webp', row: 0, col: 3 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.ANOMALIES,
    effects: [
      e.PUBLICITY(1),
      m.FULL_MISSION([
        {
          req: e.TECH_ANY(),
          reward: e.ENERGY(),
        },
        {
          req: e.TECH_ANY(),
          reward: e.CARD_ANY(),
        },
        {
          req: e.TECH_ANY(),
          reward: e.SCORE(3),
        },
      ]),
    ],
  },
  {
    id: 'ET.16',
    name: 'Flooding the Media Space',
    position: { src: '/images/aliens/anomalies.webp', row: 0, col: 4 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.ANOMALIES,
    effects: [DESC_WITH_TYPE(EResource.CARD_ANY, 'desc.et-16')],
  },
  {
    id: 'ET.14',
    name: 'Listening Carefully',
    position: { src: '/images/aliens/anomalies.webp', row: 1, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 2,
    income: EResource.CARD,
    alien: EAlienType.ANOMALIES,
    effects: [e.SCAN(), DESC_WITH_TYPE(EScanAction.ANY, 'desc.et-14')],
  },
  {
    id: 'ET.18',
    name: 'Message Capsule',
    position: { src: '/images/aliens/anomalies.webp', row: 1, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.CREDIT,
    alien: EAlienType.ANOMALIES,
    effects: [e.ROTATE(), e.TECH_ANY()],
  },
  {
    id: 'ET.19',
    name: 'New Physics',
    position: { src: '/images/aliens/anomalies.webp', row: 1, col: 2 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLACK,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.ANOMALIES,
    effects: [e.TRACE_ANY()],
  },
  {
    id: 'ET.15',
    name: 'Part of Everyday Life',
    position: { src: '/images/aliens/anomalies.webp', row: 1, col: 3 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.ANOMALIES,
    special: {
      descHelper:
        'Discard one of them for its free-action corner effect and then discard another one to gain a resource corresponding to its income.',
    },
    effects: [e.CARD(3), DESC('desc.et-15')],
  },
  {
    id: 'ET.11',
    name: 'Signs of Life',
    position: { src: '/images/aliens/anomalies.webp', row: 1, col: 4 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.ANOMALIES,
    effects: [e.LAUNCH(), DESC('desc.et-11')],
  },

  {
    id: 'ET.34',
    name: 'A Message from Afar',
    position: { src: '/images/aliens/centaurians.webp', row: 0, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.36',
    name: 'Alien Schematics',
    position: { src: '/images/aliens/centaurians.webp', row: 0, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.32',
    name: 'Exocomputers',
    position: { src: '/images/aliens/centaurians.webp', row: 0, col: 2 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.DATA,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.38',
    name: 'Hivemind Concept',
    position: { src: '/images/aliens/centaurians.webp', row: 0, col: 3 },
    freeAction: [{ type: EResource.PUBLICITY, value: 1 }],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.DATA,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.33',
    name: 'Infocluster',
    position: { src: '/images/aliens/centaurians.webp', row: 0, col: 4 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.PUBLICITY,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.37',
    name: 'Music of the Spheres',
    position: { src: '/images/aliens/centaurians.webp', row: 1, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLACK,
    price: 2,
    income: EResource.ENERGY,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.35',
    name: 'Synthesis Instructions',
    position: { src: '/images/aliens/centaurians.webp', row: 1, col: 1 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.39',
    name: 'Telescope Blueprints',
    position: { src: '/images/aliens/centaurians.webp', row: 1, col: 2 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 2,
    income: EResource.PUBLICITY,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.40',
    name: 'Torrent-chain Signal',
    position: { src: '/images/aliens/centaurians.webp', row: 1, col: 3 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 2,
    income: EResource.DATA,
    alien: EAlienType.CENTAURIANS,
  },
  {
    id: 'ET.31',
    name: 'Vessel Designs',
    position: { src: '/images/aliens/centaurians.webp', row: 1, col: 4 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.PUBLICITY,
    alien: EAlienType.CENTAURIANS,
  },

  {
    id: 'ET.7',
    name: 'Breeding Sample',
    position: { src: '/images/aliens/mascamites.webp', row: 0, col: 0 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.RED,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.MASCAMITES,
    special: {
      enableEffectRender: false,
    },
    effects: [
      e.LAND(),
      DESC('desc.et-pickup'),
      m.QUICK_MISSION(DESC('Deliver {sample} to Earth'), DESC('desc.et-7')),
    ],
  },
  {
    id: 'ET.10',
    name: 'Computer Simulations',
    position: { src: '/images/aliens/mascamites.webp', row: 0, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 3,
    income: EResource.CARD,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.PUBLICITY(),
      e.ROTATE(),
      e.TECH_COMPUTER(),
      m.QUICK_MISSION(
        [DESC('desc.et-10-req')],
        [DESC('desc.et-pickup-back-reward')],
        'large'
      ),
    ],
  },
  {
    id: 'ET.5',
    name: 'Ecosystem Study',
    position: { src: '/images/aliens/mascamites.webp', row: 0, col: 2 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.MASCAMITES,
    effects: [DESC('desc.et-pickup-back'), m.END_GAME('desc.et-5-endgame')],
  },
  {
    id: 'ET.1',
    name: 'First Contact',
    position: { src: '/images/aliens/mascamites.webp', row: 0, col: 3 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.MOVE(1, '', 'xs'),
      e.LAND(1, '', 'xs'),
      DESC('desc.et-pickup', 'half'),
      m.QUICK_MISSION(
        [DESC('Deliver {sample} to Earth')],
        [e.FULFILL_SAMPLE(), e.DATA(2)]
      ),
    ],
  },
  {
    id: 'ET.8',
    name: 'Hive Sample',
    position: { src: '/images/aliens/mascamites.webp', row: 0, col: 4 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 3,
    income: EResource.ENERGY,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.PUBLICITY(),
      e.ROTATE(),
      e.TECH_PROBE(),
      m.QUICK_MISSION(
        [DESC('desc.et-8-req')],
        [DESC('desc.et-pickup-back-reward')],
        'large'
      ),
    ],
  },
  {
    id: 'ET.4',
    name: 'Martian Quarantine Lab',
    position: { src: '/images/aliens/mascamites.webp', row: 1, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.LAND(),
      DESC('desc.et-pickup', 'half'),
      m.QUICK_MISSION(
        [DESC('Deliver {sample} to Mars')],
        [e.FULFILL_SAMPLE(), e.SCORE(2), e.CARD_ANY()]
      ),
    ],
  },
  {
    id: 'ET.3',
    name: 'Mass Sample Collection',
    position: { src: '/images/aliens/mascamites.webp', row: 1, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.ORBIT_OR_LAND(),
      DESC('desc.et-pickup', 'half'),
      m.QUICK_MISSION(
        [DESC('Deliver {sample} to Earth')],
        [e.FULFILL_SAMPLE(), e.SCORE(3), e.CREDIT()]
      ),
    ],
  },
  {
    id: 'ET.9',
    name: 'Orbital Monitoring',
    position: { src: '/images/aliens/mascamites.webp', row: 1, col: 2 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 3,
    income: EResource.CREDIT,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.PUBLICITY(),
      e.ROTATE(),
      e.TECH_SCAN(),
      m.QUICK_MISSION(
        [DESC('desc.et-9-req')],
        [DESC('desc.et-pickup-back-reward')],
        'large'
      ),
    ],
  },
  {
    id: 'ET.2',
    name: 'Rover Exploration',
    position: { src: '/images/aliens/mascamites.webp', row: 1, col: 3 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLACK,
    price: 2,
    income: EResource.ENERGY,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.LAND(),
      DESC('desc.et-pickup-moon', 'half'),
      m.QUICK_MISSION(
        [DESC('Deliver {sample} to Earth')],
        [e.FULFILL_SAMPLE(), e.SCORE(3), e.DATA(3)]
      ),
    ],
  },
  {
    id: 'ET.6',
    name: 'The Queen',
    position: { src: '/images/aliens/mascamites.webp', row: 1, col: 4 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 2,
    income: EResource.CREDIT,
    alien: EAlienType.MASCAMITES,
    effects: [
      e.LAND(),
      DESC('desc.et-pickup-moon', 'half'),
      m.QUICK_MISSION(
        [DESC('Deliver {sample} to Earth')],
        [e.FULFILL_SAMPLE(), e.SCORE(6), e.PUBLICITY(2)]
      ),
    ],
  },

  {
    id: 'ET.22',
    name: 'Altered Trajectory',
    position: { src: '/images/aliens/oumuamua.webp', row: 0, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 2,
    income: EResource.ENERGY,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.SCAN(),
      DESC('desc.et-22', 'half'),
      m.QUICK_MISSION(DESC('desc.et-22-req'), e.SCORE(4)),
    ],
  },
  {
    id: 'ET.29',
    name: 'Comparative Analysis',
    position: { src: '/images/aliens/oumuamua.webp', row: 0, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.RED,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.EXOFOSSIL(1, '', 'xs'),
      m.FULL_MISSION([
        { req: e.TRACE_ANY(), reward: e.DATA(1) },
        { req: e.TRACE_ANY(), reward: e.PUBLICITY(1) },
        { req: e.TRACE_ANY(), reward: e.SCORE(3) },
      ]),
    ],
  },
  {
    id: 'ET.23',
    name: 'Exofossil Discovery',
    position: { src: '/images/aliens/oumuamua.webp', row: 0, col: 2 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.YELLOW,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.SIGNAL_ANY(),
      DESC('desc.et-23'),
      m.QUICK_MISSION(DESC('desc.et-23-req'), [
        e.USE_EXOFOSSIL(2),
        e.SCORE(11),
      ]),
    ],
  },
  {
    id: 'ET.30',
    name: 'Excavation Rover',
    position: { src: '/images/aliens/oumuamua.webp', row: 0, col: 3 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLACK,
    price: 1,
    income: EResource.CARD,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.LAND(),
      DESC('desc.et-30', 'half'),
      m.QUICK_MISSION(
        [
          e.TRACE_RED(1, '', 'desc'),
          e.TRACE_YELLOW(1, '', 'desc'),
          e.TRACE_BLUE(1, '', 'desc'),
          DESC('for this species'),
        ],
        [e.EXOFOSSIL()]
      ),
    ],
  },
  {
    id: 'ET.28',
    name: 'Exofossil Samples',
    position: { src: '/images/aliens/oumuamua.webp', row: 0, col: 4 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.CARD,
    alien: EAlienType.OUMUAMUA,
    effects: [e.ROTATE(), e.TECH_COMPUTER(), DESC('desc.et-28')],
  },
  {
    id: 'ET.27',
    name: 'Perfect Timing',
    position: { src: '/images/aliens/oumuamua.webp', row: 1, col: 0 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 2,
    income: EResource.CREDIT,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.MOVE(4),
      DESC('desc.et-27', 'half'),
      m.QUICK_MISSION(DESC('desc.et-27-req'), [e.EXOFOSSIL(1)]),
    ],
  },
  {
    id: 'ET.25',
    name: 'Probe Customisation',
    position: { src: '/images/aliens/oumuamua.webp', row: 1, col: 1 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.DATA, value: 1 },
    ],
    sector: ESector.BLUE,
    price: 1,
    income: EResource.CREDIT,
    alien: EAlienType.OUMUAMUA,
    effects: [DESC('desc.et-25'), DESC('Then'), e.LAND()],
  },
  {
    id: 'ET.26',
    name: 'Race Against Time',
    position: { src: '/images/aliens/oumuamua.webp', row: 1, col: 2 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.RED,
    price: 1,
    income: EResource.ENERGY,
    alien: EAlienType.OUMUAMUA,
    effects: [e.LAUNCH(), e.EXOFOSSIL()],
  },
  {
    id: 'ET.24',
    name: 'Terrain Mapping',
    position: { src: '/images/aliens/oumuamua.webp', row: 1, col: 3 },
    freeAction: [
      { type: EResource.SCORE, value: 1 },
      { type: EResource.MOVE, value: 1 },
    ],
    sector: ESector.YELLOW,
    price: 3,
    income: EResource.CREDIT,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.SIGNAL_YELLOW(),
      e.SIGNAL_RED(),
      e.SIGNAL_BLUE(),

      DESC('desc.et-24'),
      m.END_GAME('desc.et-24-endgame'),
    ],
  },
  {
    id: 'ET.21',
    name: 'Visitor in the Sky',
    position: { src: '/images/aliens/oumuamua.webp', row: 1, col: 4 },
    freeAction: [{ type: EResource.PUBLICITY, value: 2 }],
    sector: ESector.BLUE,
    price: 2,
    income: EResource.CARD,
    alien: EAlienType.OUMUAMUA,
    effects: [
      e.SCAN(),
      DESC('desc.et-21', 'half'),
      m.QUICK_MISSION(DESC('desc.et-21-req'), e.DATA()),
    ],
  },

  {
    id: 'ET.52',
    name: 'Automated Lab',
    position: { src: '/images/aliens/exertians.webp', row: 0, col: 0 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 0,
    },
  },
  {
    id: 'ET.50',
    name: 'Casette Deployment',
    position: { src: '/images/aliens/exertians.webp', row: 0, col: 1 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 2,
    },
  },
  {
    id: 'ET.45',
    name: 'Core-breach Exoplanet',
    position: { src: '/images/aliens/exertians.webp', row: 0, col: 2 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 4,
    },
  },
  {
    id: 'ET.42',
    name: 'Deflector',
    position: { src: '/images/aliens/exertians.webp', row: 0, col: 3 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 7,
    },
  },
  {
    id: 'ET.43',
    name: 'Expender Core',
    position: { src: '/images/aliens/exertians.webp', row: 0, col: 4 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 3,
    },
  },
  {
    id: 'ET.51',
    name: 'Extractor',
    position: { src: '/images/aliens/exertians.webp', row: 1, col: 0 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 8,
    },
  },
  {
    id: 'ET.47',
    name: 'Fission-sun Exoplanet',
    position: { src: '/images/aliens/exertians.webp', row: 1, col: 1 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 5,
    },
  },
  {
    id: 'ET.49',
    name: 'Generative Infrastructure',
    position: { src: '/images/aliens/exertians.webp', row: 1, col: 2 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 7,
    },
  },
  {
    id: 'ET.54',
    name: 'Nanowielder Node',
    position: { src: '/images/aliens/exertians.webp', row: 1, col: 3 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 1,
    },
  },
  {
    id: 'ET.53',
    name: 'Neuralab',
    position: { src: '/images/aliens/exertians.webp', row: 1, col: 4 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 9,
    },
  },
  {
    id: 'ET.48',
    name: 'Oscillating Probes',
    position: { src: '/images/aliens/exertians.webp', row: 2, col: 0 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 3,
    },
  },
  {
    id: 'ET.44',
    name: 'pierced Exoplanet',
    position: { src: '/images/aliens/exertians.webp', row: 2, col: 1 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 4,
    },
  },
  {
    id: 'ET.41',
    name: 'Razor-edge Shuttle',
    position: { src: '/images/aliens/exertians.webp', row: 2, col: 2 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 6,
    },
  },
  {
    id: 'ET.55',
    name: 'Stratoelevator',
    position: { src: '/images/aliens/exertians.webp', row: 2, col: 3 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 4,
    },
  },
  {
    id: 'ET.46',
    name: 'Vortex Exoplanet',
    position: { src: '/images/aliens/exertians.webp', row: 2, col: 4 },
    price: 0,
    alien: EAlienType.EXERTIANS,
    special: {
      danger: 4,
    },
  },
];

// add flavorText
export const alienCards: IBaseCard[] = _alienCards.map((card) => {
  const id = Number(card.id.split('.')?.[1]);
  return {
    ...card,
    flavorText: `${card.id}_flavor_text`,
    special: {
      ...card.special,
      titleHeight: 86,
      enableEffectRender: id >= 0 && id <= 30,
    },
  };
});

// const res = [];

// const _aalienCards = alienCards.filter(a => a.alien === EAlienType.EXERTIANS);
// for (let i = 0; i < flavorTexts.length; i ++ ) {
//   const f = flavorTexts[i];
//   const id = _aalienCards[i].id;
//   res.push(`\"${id + '_flavor_text'}\": \"${f.flavorText}\"`);
// }

// console.log(res)
// console.log(a.map((a) => a.name).join(', '));
