import {
  type IPlanetMissionConfig,
  PLANET_MISSION_CONFIG,
  PLANETARY_PLANETS,
  type TPlanetReward,
} from '@seti/common/constant/boardLayout';
import { EResource, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

const LANDING_COST_DEFAULT = 3;
const LANDING_COST_WITH_ORBITER = 2;
const DEFAULT_DYNAMIC_PLANET_CONFIG: IPlanetMissionConfig = {
  label: 'Other Planet',
  anchor: { x: 50, y: 50 },
  orbitSlots: [],
  landingSlots: [],
  landingSlotKinds: [],
  orbit: {
    rewards: [
      { type: 'resource', resource: EResource.SCORE, amount: 6 },
      { type: 'tuck', amount: 1 },
    ],
    firstRewards: [{ type: 'resource', resource: EResource.SCORE, amount: 3 }],
  },
  land: {
    rewards: [
      { type: 'resource', resource: EResource.SCORE, amount: 5 },
      { type: 'trace', trace: ETrace.YELLOW, amount: 1 },
    ],
    firstData: [2],
  },
  firstLandDataBonusSlots: 1,
  moonSlots: 0,
  moonNames: [],
};

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
  rewards: TPlanetReward[];
  /** @deprecated Use rewards instead. */
  incomeResource?: EResource;
}

export interface ITraceReward {
  trace: ETrace;
  amount: number;
}

export interface ILandingCenterReward {
  vpGained: number;
  traceRewards: ITraceReward[];
  /** @deprecated Use traceRewards instead. */
  lifeTraceGained: number;
}

export interface ILandingResult {
  landingCost: number;
  centerReward: ILandingCenterReward;
  firstLandDataGained: number;
  isMoon: boolean;
  rewards: TPlanetReward[];
}

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

function getPlanetMissionConfig(planet: EPlanet): IPlanetMissionConfig {
  return (
    PLANET_MISSION_CONFIG[planet as (typeof PLANETARY_PLANETS)[number]] ??
    DEFAULT_DYNAMIC_PLANET_CONFIG
  );
}

function cloneRewards(rewards: readonly TPlanetReward[]): TPlanetReward[] {
  return rewards.map((reward) => ({ ...reward }));
}

function getScoreRewardAmount(rewards: readonly TPlanetReward[]): number {
  return rewards.reduce((total, reward) => {
    if (reward.type !== 'resource' || reward.resource !== EResource.SCORE) {
      return total;
    }
    return total + reward.amount;
  }, 0);
}

function getCenterReward(
  rewards: readonly TPlanetReward[],
): ILandingCenterReward {
  const traceRewards: ITraceReward[] = [];
  for (const reward of rewards) {
    if (reward.type === 'trace') {
      traceRewards.push({ trace: reward.trace, amount: reward.amount });
    }
  }

  return {
    vpGained: getScoreRewardAmount(rewards),
    traceRewards,
    lifeTraceGained: traceRewards.reduce(
      (total, reward) => total + reward.amount,
      0,
    ),
  };
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
          { length: config.land.firstData.length },
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

    const config = getPlanetMissionConfig(planet);
    const rewards = cloneRewards(config.orbit.rewards);

    if (!planetState.firstOrbitClaimed) {
      planetState.firstOrbitClaimed = true;
      const firstRewards = cloneRewards(config.orbit.firstRewards);
      rewards.push(...firstRewards);
      return { vpGained: getScoreRewardAmount(firstRewards), rewards };
    }

    return { vpGained: 0, rewards };
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

    const config = getPlanetMissionConfig(planet);
    const firstLandDataGained = this.takeFirstLandDataBonus(
      planetState,
      config,
    );
    const rewards = cloneRewards(config.land.rewards);
    if (firstLandDataGained > 0) {
      rewards.push({
        type: 'resource',
        resource: EResource.DATA,
        amount: firstLandDataGained,
      });
    }
    const centerReward = getCenterReward(config.land.rewards);

    return {
      landingCost: this.getLandingCost(planet, playerId),
      centerReward,
      firstLandDataGained,
      isMoon,
      rewards,
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
          {
            length:
              getPlanetMissionConfig(planet).land.firstData.length ||
              DEFAULT_FIRST_LAND_DATA_SLOTS,
          },
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

  private takeFirstLandDataBonus(
    planetState: IPlanetState,
    config: IPlanetMissionConfig,
  ): number {
    const openIndex = planetState.firstLandDataBonusTaken.findIndex(
      (taken) => !taken,
    );
    if (openIndex < 0) {
      return 0;
    }

    planetState.firstLandDataBonusTaken[openIndex] = true;
    return config.land.firstData[openIndex] ?? 0;
  }
}
