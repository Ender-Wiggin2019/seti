import {
  LANDING_COST_DEFAULT,
  LANDING_COST_WITH_ORBITER,
} from '../constant/actionCosts';
import {
  PLANETARY_BOARD_CONFIG,
  type TPlanetaryBoardConfigId,
} from '../constant/boardLayout';
import { EPlanet } from '../types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetState,
  IPublicPlayerState,
} from '../types/protocol/gameState';
import { ETechId } from '../types/tech';
import { findPlanetSpaceId } from './solarSystem';

const ENERGY_RESOURCE_KEY = 'energy';

/** 计算着陆费用 (有轨道者时 2, 否则 3) */
export function getLandingCost(
  planet: IPublicPlanetState,
  _playerId: string,
): number {
  return planet.orbitSlots.length > 0
    ? LANDING_COST_WITH_ORBITER
    : LANDING_COST_DEFAULT;
}

function getEffectiveLandingCost(
  planet: IPublicPlanetState,
  player: IPublicPlayerState,
): number {
  const baseCost = getLandingCost(planet, player.playerId);
  return player.techs.includes(ETechId.PROBE_ROVER_DISCOUNT)
    ? Math.max(1, baseCost - 1)
    : baseCost;
}

/** 检查某玩家是否可以在该行星入轨 (有探针在该行星空间) */
export function canOrbitPlanet(
  planetId: EPlanet,
  planet: IPublicPlanetState,
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  const planetSpaceId = findPlanetSpaceId(gameState.solarSystem, planetId);
  if (!planetSpaceId) {
    return false;
  }

  return gameState.solarSystem.probes.some(
    (probe) =>
      probe.playerId === player.playerId && probe.spaceId === planetSpaceId,
  );
}

/** 检查某玩家是否可以在该行星着陆 */
export function canLandOnPlanet(
  planetId: EPlanet,
  planet: IPublicPlanetState,
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (!canOrbitPlanet(planetId, planet, player, gameState)) {
    return false;
  }

  const energy =
    (player.resources as unknown as Record<string, number>)[
      ENERGY_RESOURCE_KEY
    ] ?? 0;
  return energy >= getEffectiveLandingCost(planet, player);
}

/** 检查月球是否可着陆 (玩家有月球科技 + 有空月球槽位) */
export function canLandOnMoon(
  planetId: EPlanet,
  planet: IPublicPlanetState,
  player: Pick<IPublicPlayerState, 'techs'>,
  moonId?: string,
): boolean {
  const config = PLANETARY_BOARD_CONFIG[planetId as TPlanetaryBoardConfigId];
  const moonSlots = config?.moonSlots ?? 0;
  const moonSlotAvailable =
    moonId === undefined
      ? planet.moonOccupants.length < moonSlots
      : (config?.moonIds.includes(moonId) ?? false) &&
        !planet.moonOccupants.some((occupant) => occupant.moonId === moonId);
  return (
    player.techs.includes(ETechId.PROBE_MOON) &&
    moonSlots > 0 &&
    moonSlotAvailable
  );
}

/** 获取首次轨道奖励是否仍可用 */
export function isFirstOrbitAvailable(planet: IPublicPlanetState): boolean {
  return !planet.firstOrbitClaimed;
}

/** 获取首次着陆数据奖励剩余 */
export function getFirstLandBonusRemaining(planet: IPublicPlanetState): number {
  return planet.firstLandDataBonusTaken.filter((taken) => !taken).length;
}
