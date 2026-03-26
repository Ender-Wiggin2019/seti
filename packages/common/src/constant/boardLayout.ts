import { EPlanet, ETech } from '@seti/common/types/element';

export interface IBoardPosition {
  x: number;
  y: number;
}

export interface IPlanetMissionConfig {
  label: string;
  anchor: IBoardPosition;
  orbitSlots: readonly IBoardPosition[];
  landingSlots: readonly IBoardPosition[];
  landingSlotKinds: readonly ('planet' | 'moon')[];
  firstLandDataBonusSlots: number;
  moonSlots: number;
  moonNames: readonly string[];
}

export interface ITechStackLayout {
  tech: ETech.PROBE | ETech.SCAN | ETech.COMPUTER;
  level: 0 | 1 | 2 | 3;
  x: number;
  y: number;
}

export const PLANETARY_BOARD_DIMENSIONS = {
  width: 500,
  height: 700,
} as const;

export const TECH_BOARD_DIMENSIONS = {
  width: 380,
  height: 310,
} as const;

export const PLANETARY_PLANETS = [
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
] as const;

export const SOLAR_SYSTEM_PLANETS = [
  EPlanet.EARTH,
  ...PLANETARY_PLANETS,
] as const;

export const PLANET_MISSION_CONFIG: Readonly<
  Record<(typeof PLANETARY_PLANETS)[number], IPlanetMissionConfig>
> = {
  [EPlanet.MERCURY]: {
    label: 'Mercury',
    anchor: { x: 89, y: 23 },
    orbitSlots: [{ x: 77, y: 10 }],
    landingSlots: [{ x: 81, y: 19 }],
    landingSlotKinds: ['planet'],
    firstLandDataBonusSlots: 1,
    moonSlots: 0,
    moonNames: [],
  },
  [EPlanet.VENUS]: {
    label: 'Venus',
    anchor: { x: 56, y: 25 },
    orbitSlots: [{ x: 42, y: 9 }],
    landingSlots: [{ x: 48, y: 21 }],
    landingSlotKinds: ['planet'],
    firstLandDataBonusSlots: 1,
    moonSlots: 0,
    moonNames: [],
  },
  [EPlanet.MARS]: {
    label: 'Mars',
    anchor: { x: 24, y: 25 },
    orbitSlots: [{ x: 8, y: 8 }],
    landingSlots: [
      { x: 16, y: 21 },
      { x: 11, y: 16 },
      { x: 9, y: 28 },
    ],
    landingSlotKinds: ['planet', 'planet', 'moon'],
    firstLandDataBonusSlots: 2,
    moonSlots: 1,
    moonNames: ['Phobos/Deimos'],
  },
  [EPlanet.JUPITER]: {
    label: 'Jupiter',
    anchor: { x: 20, y: 57 },
    orbitSlots: [{ x: 3, y: 41 }],
    landingSlots: [
      { x: 12, y: 53 },
      { x: 25, y: 63 },
      { x: 32, y: 58 },
      { x: 15, y: 65 },
      { x: 35, y: 50 },
    ],
    landingSlotKinds: ['planet', 'moon', 'moon', 'moon', 'moon'],
    firstLandDataBonusSlots: 1,
    moonSlots: 4,
    moonNames: ['Europa', 'Ganymede', 'Callisto', 'Io'],
  },
  [EPlanet.SATURN]: {
    label: 'Saturn',
    anchor: { x: 69, y: 56 },
    orbitSlots: [{ x: 55, y: 38 }],
    landingSlots: [
      { x: 61, y: 52 },
      { x: 83, y: 48 },
      { x: 77, y: 58 },
    ],
    landingSlotKinds: ['planet', 'moon', 'moon'],
    firstLandDataBonusSlots: 1,
    moonSlots: 2,
    moonNames: ['Titan', 'Enceladus'],
  },
  [EPlanet.URANUS]: {
    label: 'Uranus',
    anchor: { x: 51, y: 90 },
    orbitSlots: [{ x: 40, y: 75 }],
    landingSlots: [
      { x: 43, y: 86 },
      { x: 61, y: 86 },
    ],
    landingSlotKinds: ['planet', 'moon'],
    firstLandDataBonusSlots: 1,
    moonSlots: 1,
    moonNames: ['Miranda'],
  },
  [EPlanet.NEPTUNE]: {
    label: 'Neptune',
    anchor: { x: 27, y: 85 },
    orbitSlots: [{ x: 7, y: 76 }],
    landingSlots: [
      { x: 11, y: 87 },
      { x: 22, y: 93 },
    ],
    landingSlotKinds: ['planet', 'moon'],
    firstLandDataBonusSlots: 1,
    moonSlots: 1,
    moonNames: ['Triton'],
  },
};

export const TECH_STACK_LAYOUT: readonly ITechStackLayout[] = [
  { tech: ETech.PROBE, level: 1, x: 10, y: 10 },
  { tech: ETech.PROBE, level: 0, x: 30, y: 10 },
  { tech: ETech.PROBE, level: 2, x: 50, y: 10 },
  { tech: ETech.PROBE, level: 3, x: 70, y: 10 },
  { tech: ETech.SCAN, level: 0, x: 10, y: 30 },
  { tech: ETech.SCAN, level: 3, x: 30, y: 30 },
  { tech: ETech.SCAN, level: 1, x: 50, y: 30 },
  { tech: ETech.SCAN, level: 2, x: 70, y: 30 },
  { tech: ETech.COMPUTER, level: 2, x: 10, y: 50 },
  { tech: ETech.COMPUTER, level: 3, x: 30, y: 50 },
  { tech: ETech.COMPUTER, level: 1, x: 50, y: 50 },
  { tech: ETech.COMPUTER, level: 0, x: 70, y: 50 },
] as const;
