import { EResource } from '../types/element';
import { EFreeAction } from '../types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlayerState,
  IPublicSolarSystemState,
} from '../types/protocol/gameState';
import { getNextSlot } from './computer';
import { getMoveCost } from './movement';

const BUY_CARD_PUBLICITY_COST = 3;
const EXCHANGE_RESOURCE_INPUT_AMOUNT = 2;

export interface IMovementPathValidation {
  valid: boolean;
  totalCost: number;
  errors: string[];
}

/**
 * Validates a movement path and computes total cost.
 * Path format: [startSpaceId, step1SpaceId, step2SpaceId, ...]
 * - At least 2 elements required
 * - Each consecutive pair must be adjacent
 * - No sun spaces
 * - Returns total movement cost for all steps
 */
export function validateMovementPath(
  solarSystem: IPublicSolarSystemState,
  path: string[],
): IMovementPathValidation {
  const errors: string[] = [];

  if (path.length < 2) {
    return {
      valid: false,
      totalCost: 0,
      errors: ['Path must have at least 2 spaces'],
    };
  }

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const cost = getMoveCost(solarSystem, from, to);

    if (!Number.isFinite(cost)) {
      errors.push(`Step ${i}: ${from} -> ${to} is not a valid move`);
      return { valid: false, totalCost, errors };
    }

    totalCost += cost;
  }

  return { valid: true, totalCost, errors: [] };
}

export function canMoveProbe(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): boolean {
  if (player.probesInSpace <= 0) {
    return false;
  }

  const hasMovement = player.movementPoints > 0;
  const hasEnergy = player.resources[EResource.ENERGY] > 0;
  return hasMovement || hasEnergy;
}

export function canConvertEnergyToMovement(
  player: IPublicPlayerState,
): boolean {
  return player.resources[EResource.ENERGY] > 0;
}

export function canPlaceData(player: IPublicPlayerState): boolean {
  if (player.dataPoolCount <= 0) {
    return false;
  }
  return getNextSlot(player.computer, player.techs) !== null;
}

export function canCompleteMission(_player: IPublicPlayerState): boolean {
  // TODO: implement when mission condition system is available
  return false;
}

export function canUseFreeActionCorner(player: IPublicPlayerState): boolean {
  return player.handSize > 0;
}

export function canBuyCard(player: IPublicPlayerState): boolean {
  return player.resources[EResource.PUBLICITY] >= BUY_CARD_PUBLICITY_COST;
}

export function canExchangeResources(player: IPublicPlayerState): boolean {
  if (player.resources[EResource.CREDIT] >= EXCHANGE_RESOURCE_INPUT_AMOUNT) {
    return true;
  }
  if (player.resources[EResource.ENERGY] >= EXCHANGE_RESOURCE_INPUT_AMOUNT) {
    return true;
  }
  if (player.handSize >= EXCHANGE_RESOURCE_INPUT_AMOUNT) {
    return true;
  }
  return false;
}

export function getAvailableFreeActions(
  player: IPublicPlayerState,
  gameState: IPublicGameState,
): EFreeAction[] {
  const actions: EFreeAction[] = [];

  if (canMoveProbe(player, gameState)) actions.push(EFreeAction.MOVEMENT);
  if (canConvertEnergyToMovement(player))
    actions.push(EFreeAction.CONVERT_ENERGY_TO_MOVEMENT);
  if (canPlaceData(player)) actions.push(EFreeAction.PLACE_DATA);
  if (canCompleteMission(player)) actions.push(EFreeAction.COMPLETE_MISSION);
  if (canUseFreeActionCorner(player)) actions.push(EFreeAction.USE_CARD_CORNER);
  if (canBuyCard(player)) actions.push(EFreeAction.BUY_CARD);
  if (canExchangeResources(player))
    actions.push(EFreeAction.EXCHANGE_RESOURCES);

  return actions;
}
