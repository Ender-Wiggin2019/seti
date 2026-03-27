import {
  ANALYZE_ENERGY_COST,
  LAUNCH_PROBE_CREDIT_COST,
  ORBIT_CREDIT_COST,
  ORBIT_ENERGY_COST,
  SCAN_CREDIT_COST,
  SCAN_ENERGY_COST,
} from '../constant/actionCosts';
import { EResource } from '../types/element';
import { EMainAction } from '../types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetState,
  IPublicPlayerState,
} from '../types/protocol/gameState';
import { ETechId, RESEARCH_PUBLICITY_COST } from '../types/tech';
import { canOrbitPlanet, getLandingCost } from './planet';
import { getAvailableTechs } from './tech';

export function canLaunchProbe(player: IPublicPlayerState): boolean {
  return (
    player.resources[EResource.CREDIT] >= LAUNCH_PROBE_CREDIT_COST &&
    player.probesInSpace < player.probeSpaceLimit
  );
}

function getPlanetsInGame(gameState: IPublicGameState): IPublicPlanetState[] {
  return Object.values(gameState.planetaryBoard.planets).filter(
    (planet): planet is IPublicPlanetState => planet !== undefined,
  );
}

function getLandingCostForPlayer(
  player: IPublicPlayerState,
  planet: IPublicPlanetState,
): number {
  const baseLandingCost = getLandingCost(planet, player.playerId);
  if (player.techs.includes(ETechId.PROBE_ROVER_DISCOUNT)) {
    return Math.max(1, baseLandingCost - 1);
  }
  return baseLandingCost;
}

export function canOrbit(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (
    player.resources[EResource.CREDIT] >= ORBIT_CREDIT_COST &&
    player.resources[EResource.ENERGY] >= ORBIT_ENERGY_COST
  ) {
    return getPlanetsInGame(gameState).some((planet) =>
      canOrbitPlanet(planet, player, gameState),
    );
  }
  return false;
}

export function canLand(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  return getPlanetsInGame(gameState).some((planet) => {
    if (!canOrbitPlanet(planet, player, gameState)) {
      return false;
    }
    return (
      player.resources[EResource.ENERGY] >=
      getLandingCostForPlayer(player, planet)
    );
  });
}

export function canScan(player: IPublicPlayerState): boolean {
  return (
    player.resources[EResource.CREDIT] >= SCAN_CREDIT_COST &&
    player.resources[EResource.ENERGY] >= SCAN_ENERGY_COST
  );
}

export function canAnalyzeData(player: IPublicPlayerState): boolean {
  if (player.resources[EResource.ENERGY] < ANALYZE_ENERGY_COST) {
    return false;
  }
  return player.computer.columns.every((col) => col.topFilled);
}

export function canPlayCard(player: IPublicPlayerState): boolean {
  return player.handSize > 0;
}

export function canResearchTechAction(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (player.resources[EResource.PUBLICITY] < RESEARCH_PUBLICITY_COST) {
    return false;
  }
  return getAvailableTechs(player, gameState.techBoard).length > 0;
}

export function getAvailableMainActions(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): EMainAction[] {
  const actions: EMainAction[] = [];

  if (canLaunchProbe(player)) actions.push(EMainAction.LAUNCH_PROBE);
  if (canOrbit(player, gameState)) actions.push(EMainAction.ORBIT);
  if (canLand(player, gameState)) actions.push(EMainAction.LAND);
  if (canScan(player)) actions.push(EMainAction.SCAN);
  if (canAnalyzeData(player)) actions.push(EMainAction.ANALYZE_DATA);
  if (canPlayCard(player)) actions.push(EMainAction.PLAY_CARD);
  if (canResearchTechAction(player, gameState))
    actions.push(EMainAction.RESEARCH_TECH);
  actions.push(EMainAction.PASS);

  return actions;
}
