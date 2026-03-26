import type {
  IPublicPlayerState,
  IPublicTechBoard,
  IPublicTechStack,
} from '../types/protocol/gameState';
import {
  type ETechId,
  getTechDescriptor,
  getTechId,
  RESEARCH_PUBLICITY_COST,
  TECH_CATEGORIES,
  TECH_LEVELS,
  type TTechCategory,
  type TTechLevel,
} from '../types/tech';

/** Find a specific stack by category + level */
export function findTechStack(
  techBoard: IPublicTechBoard,
  category: TTechCategory,
  level: TTechLevel,
): IPublicTechStack | undefined {
  return techBoard.stacks.find(
    (stack) => stack.tech === category && stack.level === level,
  );
}

/** Whether a particular stack still has tiles to take */
export function isTechStackEmpty(
  techBoard: IPublicTechBoard,
  category: TTechCategory,
  level: TTechLevel,
): boolean {
  const stack = findTechStack(techBoard, category, level);
  return stack === undefined || stack.remainingTiles <= 0;
}

/** Whether the first-take 2 VP bonus is still available on a stack */
export function hasFirstTakeBonus(
  techBoard: IPublicTechBoard,
  category: TTechCategory,
  level: TTechLevel,
): boolean {
  const stack = findTechStack(techBoard, category, level);
  return stack?.firstTakeBonusAvailable === true;
}

/** Whether a player already owns a specific tech */
export function playerHasTech(
  player: IPublicPlayerState,
  techId: ETechId,
): boolean {
  return player.techs.includes(techId);
}

/** Whether a player already owns any tech of the given category + level */
export function playerHasTechBySpec(
  player: IPublicPlayerState,
  category: TTechCategory,
  level: TTechLevel,
): boolean {
  const techId = getTechId(category, level);
  return playerHasTech(player, techId);
}

/** Whether a player can research a specific tech (stack non-empty + not already owned) */
export function canResearchTech(
  player: IPublicPlayerState,
  techBoard: IPublicTechBoard,
  category: TTechCategory,
  level: TTechLevel,
): boolean {
  if (isTechStackEmpty(techBoard, category, level)) {
    return false;
  }
  return !playerHasTechBySpec(player, category, level);
}

/** Whether a player can afford the main action to research (6 publicity) */
export function canAffordResearch(player: IPublicPlayerState): boolean {
  return player.resources.publicity >= RESEARCH_PUBLICITY_COST;
}

/**
 * List all tech IDs the player can currently research.
 * Does NOT check publicity cost — that's a main-action gate, not per-stack.
 */
export function getAvailableTechs(
  player: IPublicPlayerState,
  techBoard: IPublicTechBoard,
): ETechId[] {
  const available: ETechId[] = [];
  for (const category of TECH_CATEGORIES) {
    for (const level of TECH_LEVELS) {
      if (canResearchTech(player, techBoard, category, level)) {
        available.push(getTechId(category, level));
      }
    }
  }
  return available;
}

/** Count how many techs of a given category a player owns */
export function countTechsInCategory(
  player: IPublicPlayerState,
  category: TTechCategory,
): number {
  return player.techs.filter((techId) => {
    const descriptor = getTechDescriptor(techId);
    return descriptor.type === category;
  }).length;
}
