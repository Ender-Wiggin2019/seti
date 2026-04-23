import {
  PLANET_MISSION_CONFIG,
  PLANETARY_PLANETS,
} from '@seti/common/constant/boardLayout';
import { EResource } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

const FIRST_ORBIT_VP_BONUS = 3;

/**
 * Orbit bonus printed above each planet (rule-simple §5.2). First orbiter also
 * scores +3 VP separately. Income is tracked like tucked income for round payout.
 */
export const PLANET_ORBIT_INCOME: Readonly<
  Record<(typeof PLANETARY_PLANETS)[number], EResource>
> = {
  [EPlanet.MERCURY]: EResource.CREDIT,
  [EPlanet.VENUS]: EResource.ENERGY,
  [EPlanet.MARS]: EResource.CARD,
  [EPlanet.JUPITER]: EResource.DATA,
  [EPlanet.SATURN]: EResource.CREDIT,
  [EPlanet.URANUS]: EResource.ENERGY,
  [EPlanet.NEPTUNE]: EResource.PUBLICITY,
};
const LANDING_COST_DEFAULT = 3;
const LANDING_COST_WITH_ORBITER = 2;

export interface IOrbitSlot {
  playerId: string;
}

export interface ILandingSlot {
  playerId: string;
}

export interface IMoonOccupant {
  playerId: string;
}

export interface IPlanetState {
  orbitSlots: IOrbitSlot[];
  landingSlots: ILandingSlot[];
  firstOrbitClaimed: boolean;
  firstLandDataBonusTaken: boolean[];
  moonOccupant: IMoonOccupant | null;
}

export interface IOrbitResult {
  vpGained: number;
  incomeResource?: EResource;
}

export interface ILandingCenterReward {
  vpGained: number;
  lifeTraceGained: number;
}

export interface ILandingResult {
  landingCost: number;
  centerReward: ILandingCenterReward;
  firstLandDataGained: number;
  isMoon: boolean;
}

const PLANET_CENTER_REWARDS: Readonly<Partial<Record<EPlanet, ILandingCenterReward>>> = {
  [EPlanet.EARTH]: { vpGained: 0, lifeTraceGained: 0 },
  [EPlanet.MERCURY]: { vpGained: 2, lifeTraceGained: 1 },
  [EPlanet.VENUS]: { vpGained: 3, lifeTraceGained: 1 },
  [EPlanet.MARS]: { vpGained: 4, lifeTraceGained: 1 },
  [EPlanet.JUPITER]: { vpGained: 5, lifeTraceGained: 1 },
  [EPlanet.SATURN]: { vpGained: 6, lifeTraceGained: 1 },
  [EPlanet.URANUS]: { vpGained: 7, lifeTraceGained: 1 },
  [EPlanet.NEPTUNE]: { vpGained: 8, lifeTraceGained: 1 },
};
const DEFAULT_PLANET_CENTER_REWARD: ILandingCenterReward = {
  vpGained: 0,
  lifeTraceGained: 0,
};
const DEFAULT_FIRST_LAND_DATA_SLOTS = 0;

function assertPlayerId(playerId: string): void {
  if (playerId.trim().length === 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      'playerId must not be empty',
      {
        playerId,
      },
    );
  }
}

export class PlanetaryBoard {
  public readonly planets: Map<EPlanet, IPlanetState>;

  private readonly probesByPlanet: Map<EPlanet, Map<string, number>>;

  public constructor() {
    this.planets = new Map();
    this.probesByPlanet = new Map();

    for (const planet of PLANETARY_PLANETS) {
      const config = PLANET_MISSION_CONFIG[planet];
      this.planets.set(planet, {
        orbitSlots: [],
        landingSlots: [],
        firstOrbitClaimed: false,
        firstLandDataBonusTaken: Array.from(
          { length: config.firstLandDataBonusSlots },
          () => false,
        ),
        moonOccupant: null,
      });
      this.probesByPlanet.set(planet, new Map());
    }
  }

  public orbit(planet: EPlanet, playerId: string): IOrbitResult {
    assertPlayerId(playerId);
    if (!this.canOrbit(planet, playerId)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Player cannot orbit this planet',
        {
          planet,
          playerId,
        },
      );
    }

    const planetState = this.getPlanetState(planet);
    planetState.orbitSlots.push({ playerId });

    const incomeResource =
      PLANET_ORBIT_INCOME[planet as (typeof PLANETARY_PLANETS)[number]] ??
      undefined;

    if (!planetState.firstOrbitClaimed) {
      planetState.firstOrbitClaimed = true;
      return { vpGained: FIRST_ORBIT_VP_BONUS, incomeResource };
    }

    return { vpGained: 0, incomeResource };
  }

  public land(
    planet: EPlanet,
    playerId: string,
    options?: {
      isMoon?: boolean;
      allowMoonLanding?: boolean;
      allowDuplicate?: boolean;
    },
  ): ILandingResult {
    assertPlayerId(playerId);
    const isMoon = options?.isMoon ?? false;
    if (
      !this.canLand(planet, playerId, {
        isMoon,
        allowMoonLanding: options?.allowMoonLanding,
        allowDuplicate: options?.allowDuplicate,
      })
    ) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Player cannot land on this target',
        {
          planet,
          playerId,
          isMoon,
        },
      );
    }

    const planetState = this.getPlanetState(planet);
    if (isMoon) {
      planetState.moonOccupant = { playerId };
    } else {
      planetState.landingSlots.push({ playerId });
    }

    const firstLandDataGained = this.takeFirstLandDataBonus(planetState);
    return {
      landingCost: this.getLandingCost(planet, playerId),
      centerReward:
        PLANET_CENTER_REWARDS[planet] ?? DEFAULT_PLANET_CENTER_REWARD,
      firstLandDataGained,
      isMoon,
    };
  }

  public canOrbit(planet: EPlanet, playerId: string): boolean {
    assertPlayerId(playerId);
    return this.getProbeCount(planet, playerId) > 0;
  }

  public canLand(
    planet: EPlanet,
    playerId: string,
    options?: {
      isMoon?: boolean;
      energy?: number;
      allowMoonLanding?: boolean;
      allowDuplicate?: boolean;
    },
  ): boolean {
    assertPlayerId(playerId);
    if (!this.canOrbit(planet, playerId)) {
      return false;
    }

    const isMoon = options?.isMoon ?? false;
    const allowMoonLanding = options?.allowMoonLanding ?? false;
    const planetState = this.getPlanetState(planet);
    if (isMoon) {
      if (!allowMoonLanding) {
        return false;
      }
      if (planetState.moonOccupant !== null) {
        return false;
      }
    } else {
      const allowDuplicate = options?.allowDuplicate ?? false;
      if (
        !allowDuplicate &&
        planetState.landingSlots.some((slot) => slot.playerId === playerId)
      ) {
        return false;
      }
    }

    if (options?.energy !== undefined) {
      return options.energy >= this.getLandingCost(planet, playerId);
    }

    return true;
  }

  public getLandingCost(planet: EPlanet, _playerId: string): number {
    const planetState = this.getPlanetState(planet);
    return planetState.orbitSlots.length > 0
      ? LANDING_COST_WITH_ORBITER
      : LANDING_COST_DEFAULT;
  }

  public setProbeCount(planet: EPlanet, playerId: string, count: number): void {
    assertPlayerId(playerId);
    if (!Number.isInteger(count) || count < 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Probe count must be >= 0',
        {
          planet,
          playerId,
          count,
        },
      );
    }

    const probesOnPlanet = this.getProbesMap(planet);
    if (count === 0) {
      probesOnPlanet.delete(playerId);
      return;
    }

    probesOnPlanet.set(playerId, count);
  }

  private getPlanetState(planet: EPlanet): IPlanetState {
    let planetState = this.planets.get(planet);
    if (!planetState) {
      if (planet === EPlanet.EARTH) {
        throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown planet', {
          planet,
        });
      }
      planetState = {
        orbitSlots: [],
        landingSlots: [],
        firstOrbitClaimed: false,
        firstLandDataBonusTaken: Array.from(
          { length: DEFAULT_FIRST_LAND_DATA_SLOTS },
          () => false,
        ),
        moonOccupant: null,
      };
      this.planets.set(planet, planetState);
    }
    return planetState;
  }

  private getProbesMap(planet: EPlanet): Map<string, number> {
    let probesOnPlanet = this.probesByPlanet.get(planet);
    if (!probesOnPlanet) {
      if (planet === EPlanet.EARTH) {
        throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown planet', {
          planet,
        });
      }
      probesOnPlanet = new Map();
      this.probesByPlanet.set(planet, probesOnPlanet);
    }
    return probesOnPlanet;
  }

  private getProbeCount(planet: EPlanet, playerId: string): number {
    const probesOnPlanet = this.getProbesMap(planet);
    return probesOnPlanet.get(playerId) ?? 0;
  }

  private takeFirstLandDataBonus(planetState: IPlanetState): number {
    const openIndex = planetState.firstLandDataBonusTaken.findIndex(
      (taken) => !taken,
    );
    if (openIndex < 0) {
      return 0;
    }

    planetState.firstLandDataBonusTaken[openIndex] = true;
    return 1;
  }
}
