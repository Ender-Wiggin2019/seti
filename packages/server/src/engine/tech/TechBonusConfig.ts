import {
  ETechBonusType,
  type ETechId,
  type ITechBonusToken,
} from '@seti/common/types/tech';

const B = ETechBonusType;

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
  'probe-0': [
    { type: B.ENERGY },
    { type: B.DATA },
    { type: B.CREDIT },
    { type: B.VP_2 },
  ],
  'probe-1': [
    { type: B.ENERGY },
    { type: B.PUBLICITY },
    { type: B.DATA },
    { type: B.CREDIT },
  ],
  'probe-2': [
    { type: B.DATA },
    { type: B.CARD },
    { type: B.ENERGY },
    { type: B.PUBLICITY },
  ],
  'probe-3': [
    { type: B.VP_3 },
    { type: B.DATA },
    { type: B.ENERGY },
    { type: B.PUBLICITY },
  ],
  'scan-0': [
    { type: B.DATA },
    { type: B.PUBLICITY },
    { type: B.CREDIT },
    { type: B.ENERGY },
  ],
  'scan-1': [
    { type: B.DATA },
    { type: B.CREDIT },
    { type: B.VP_2 },
    { type: B.PUBLICITY },
  ],
  'scan-2': [
    { type: B.CARD },
    { type: B.DATA },
    { type: B.ENERGY },
    { type: B.CREDIT },
  ],
  'scan-3': [
    { type: B.DATA },
    { type: B.PUBLICITY },
    { type: B.VP_2 },
    { type: B.CREDIT },
  ],
  'comp-0': [
    { type: B.CREDIT },
    { type: B.ENERGY },
    { type: B.DATA },
    { type: B.PUBLICITY },
  ],
  'comp-1': [
    { type: B.ENERGY },
    { type: B.DATA },
    { type: B.CARD },
    { type: B.CREDIT },
  ],
  'comp-2': [
    { type: B.CARD },
    { type: B.DATA },
    { type: B.PUBLICITY },
    { type: B.ENERGY },
  ],
  'comp-3': [
    { type: B.PUBLICITY },
    { type: B.DATA },
    { type: B.CREDIT },
    { type: B.VP_3 },
  ],
};
