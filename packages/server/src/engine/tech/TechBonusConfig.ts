import {
  ALL_TECH_IDS,
  ETechBonusType,
  type ETechId,
  type ITechBonusToken,
} from '@seti/common/types/tech';

const B = ETechBonusType;

function createStandardTechBonusPool(): ITechBonusToken[] {
  return [
    { type: B.VP_3 },
    { type: B.ENERGY },
    { type: B.PUBLICITY },
    { type: B.CARD },
  ];
}

/**
 * Per-stack bonus pool. Each tech stack has TILES_PER_STACK (4) tiles;
 * each tile carries one printed bonus token resolved on acquire.
 *
 * These pools are shuffled during TechBoard init so the order is random,
 * matching the physical game's face-down tile stacks.
 *
 * Source: physical tile faces, aligned with Czech Gaming Online reference
 * (`getTechBonus` bonus type indices 1–9).
 */
export const TECH_BONUS_POOLS: Record<ETechId, ITechBonusToken[]> = {
  ...Object.fromEntries(
    ALL_TECH_IDS.map((techId) => [techId, createStandardTechBonusPool()]),
  ),
} as Record<ETechId, ITechBonusToken[]>;
