/**
 * Reward granted when placing data on a computer slot.
 * All fields are optional — only specified fields are applied.
 */
export interface IComputerSlotReward {
  vp?: number;
  credits?: number;
  energy?: number;
  publicity?: number;
  drawCard?: number;
  tuckIncome?: number;
}

/**
 * Configuration for a single computer column.
 * Determines the built-in top-slot reward and whether a tech tile
 * can be placed on this column.
 */
export interface IComputerColumnConfig {
  topReward: IComputerSlotReward | null;
  techSlotAvailable: boolean;
}

/**
 * Default 6-column layout for SETI.
 *
 * Columns b (index 1) and d (index 3) have built-in rewards and
 * cannot host a tech tile. The other four columns (a, c, e, f) are
 * open for blue-tech placement.
 */
export const DEFAULT_COLUMN_CONFIGS: readonly IComputerColumnConfig[] = [
  /* a */ { topReward: null, techSlotAvailable: true },
  /* b */ { topReward: { publicity: 1 }, techSlotAvailable: false },
  /* c */ { topReward: null, techSlotAvailable: true },
  /* d */ { topReward: { tuckIncome: 1 }, techSlotAvailable: false },
  /* e */ { topReward: null, techSlotAvailable: true },
  /* f */ { topReward: null, techSlotAvailable: true },
] as const;
