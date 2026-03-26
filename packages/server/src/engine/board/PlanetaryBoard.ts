import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

const FIRST_ORBIT_VP_BONUS = 3;
const LANDING_COST_DEFAULT = 3;
const LANDING_COST_WITH_ORBITER = 2;

const PLANETS: readonly EPlanet[] = [
  EPlanet.EARTH,
  EPlanet.MERCURY,
  EPlanet.VENUS,
  EPlanet.MARS,
  EPlanet.JUPITER,
  EPlanet.SATURN,
  EPlanet.URANUS,
  EPlanet.NEPTUNE,
];

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
  moonUnlocked: boolean;
  planetSpaceId?: string;
}

export interface IOrbitResult {
  vpGained: number;
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

const PLANET_CENTER_REWARDS: Readonly<Record<EPlanet, ILandingCenterReward>> = {
  [EPlanet.EARTH]: { vpGained: 0, lifeTraceGained: 0 },
  [EPlanet.MERCURY]: { vpGained: 2, lifeTraceGained: 1 },
  [EPlanet.VENUS]: { vpGained: 3, lifeTraceGained: 1 },
  [EPlanet.MARS]: { vpGained: 4, lifeTraceGained: 1 },
  [EPlanet.JUPITER]: { vpGained: 5, lifeTraceGained: 1 },
  [EPlanet.SATURN]: { vpGained: 6, lifeTraceGained: 1 },
  [EPlanet.URANUS]: { vpGained: 7, lifeTraceGained: 1 },
  [EPlanet.NEPTUNE]: { vpGained: 8, lifeTraceGained: 1 },
};

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

    for (const planet of PLANETS) {
      this.planets.set(planet, {
        orbitSlots: [],
        landingSlots: [],
        firstOrbitClaimed: false,
        firstLandDataBonusTaken:
          planet === EPlanet.MARS ? [false, false] : [false],
        moonOccupant: null,
        moonUnlocked: false,
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

    if (!planetState.firstOrbitClaimed) {
      planetState.firstOrbitClaimed = true;
      return { vpGained: FIRST_ORBIT_VP_BONUS };
    }

    return { vpGained: 0 };
  }

  public land(
    planet: EPlanet,
    playerId: string,
    options?: { isMoon?: boolean; allowMoonLanding?: boolean },
  ): ILandingResult {
    assertPlayerId(playerId);
    const isMoon = options?.isMoon ?? false;
    if (
      !this.canLand(planet, playerId, {
        isMoon,
        allowMoonLanding: options?.allowMoonLanding,
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
      centerReward: PLANET_CENTER_REWARDS[planet],
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
    options?: { isMoon?: boolean; energy?: number; allowMoonLanding?: boolean },
  ): boolean {
    assertPlayerId(playerId);
    if (!this.canOrbit(planet, playerId)) {
      return false;
    }

    const isMoon = options?.isMoon ?? false;
    const allowMoonLanding = options?.allowMoonLanding ?? false;
    const planetState = this.getPlanetState(planet);
    if (isMoon) {
      if (!planetState.moonUnlocked && !allowMoonLanding) {
        return false;
      }
      if (planetState.moonOccupant !== null) {
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

  public unlockMoon(planet: EPlanet): void {
    const planetState = this.getPlanetState(planet);
    planetState.moonUnlocked = true;
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
    const planetState = this.planets.get(planet);
    if (!planetState) {
      throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown planet', {
        planet,
      });
    }
    return planetState;
  }

  private getProbesMap(planet: EPlanet): Map<string, number> {
    const probesOnPlanet = this.probesByPlanet.get(planet);
    if (!probesOnPlanet) {
      throw new GameError(EErrorCode.VALIDATION_ERROR, 'Unknown planet', {
        planet,
      });
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
