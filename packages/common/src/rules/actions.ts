import { EResource } from '../types/element';
import { EMainAction } from '../types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlayerState,
} from '../types/protocol/gameState';
import { RESEARCH_PUBLICITY_COST } from '../types/tech';
import { getAvailableTechs } from './tech';

const LAUNCH_PROBE_CREDIT_COST = 2;
const ORBIT_CREDIT_COST = 1;
const ORBIT_ENERGY_COST = 1;
const SCAN_CREDIT_COST = 1;
const SCAN_ENERGY_COST = 2;
const ANALYZE_ENERGY_COST = 1;

export function canLaunchProbe(player: IPublicPlayerState): boolean {
  return player.resources[EResource.CREDIT] >= LAUNCH_PROBE_CREDIT_COST;
}

export function canOrbit(
  player: IPublicPlayerState,
  _gameState: IPublicGameState,
): boolean {
  return (
    player.resources[EResource.CREDIT] >= ORBIT_CREDIT_COST &&
    player.resources[EResource.ENERGY] >= ORBIT_ENERGY_COST
  );
}

export function canLand(
  player: IPublicPlayerState,
  _gameState: IPublicGameState,
): boolean {
  return player.resources[EResource.ENERGY] >= 2;
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
  return player.computer.topSlots.every((slot) => slot !== null);
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
