import {
  LANDING_COST_DEFAULT,
  LANDING_COST_WITH_ORBITER,
} from '../constant/actionCosts';
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
  return energy >= getLandingCost(planet, player.playerId);
}

/** 检查月球是否可着陆 (玩家有月球科技 + 无占位) */
export function canLandOnMoon(
  planet: IPublicPlanetState,
  player: Pick<IPublicPlayerState, 'techs'>,
): boolean {
  return (
    player.techs.includes(ETechId.PROBE_MOON) && planet.moonOccupant === null
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
