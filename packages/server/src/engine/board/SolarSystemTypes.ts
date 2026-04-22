import type { EPlanet } from '@seti/common/types/protocol/enums';

export enum ESolarSystemElementType {
  NULL = 'NULL',
  EMPTY = 'EMPTY',
  COMET = 'COMET',
  ASTEROID = 'ASTEROID',
  PLANET = 'PLANET',
  EARTH = 'EARTH',
  SUN = 'SUN',
}

export interface ISolarSystemElement {
  type: ESolarSystemElementType;
  amount: number;
  planet?: EPlanet;
}

export interface ISolarProbe {
  id: string;
  playerId: string;
}

export interface ISolarSystemSpace {
  id: string;
  ringIndex: number;
  indexInRing: number;
  discIndex: number | null;
  hasPublicityIcon: boolean;
  /**
   * Amount of publicity granted when a probe enters via the publicity
   * icon. Optional: when `hasPublicityIcon === true` and this field is
   * omitted, it defaults to `1` (the standard printed icon).
   */
  publicityIconAmount?: number;
  elements: ISolarSystemElement[];
  occupants: ISolarProbe[];
}

export interface IDisc {
  index: number;
  currentRotation: number;
  spaces: string[];
}

export interface IProbeMoveResult {
  probeId: string;
  fromId: string;
  toId: string;
  movementCost: number;
  publicityGained: number;
}
