import type {
  ETechId,
  TTechCategory,
  TTechLevel,
} from '@seti/common/types/tech';
import type { IPlayer } from '../player/IPlayer.js';

/**
 * Context passed to scan-phase tech modifiers.
 * Will be fleshed out in Stage 2.5-2 when scan techs are implemented.
 */
export interface IScanModifierContext {
  /** Sectors where signals have been placed this scan action */
  signalSectors: string[];
}

export type { IComputerSlotReward } from '@seti/common/types/computer';

/**
 * Modifier hooks that a tech can implement to alter game rules for its owner.
 *
 * Each method is optional — only override the ones relevant to the tech.
 * The game engine queries all techs owned by a player and applies modifiers
 * in registration order (probe 0→3, scan 0→3, computer 0→3).
 *
 * IMPORTANT: Modifier methods must be pure — they receive values and return
 * modified values, without side-effects on game state.
 */
export interface ITechModifiers {
  /** Override the probe-in-space limit (default 1). Probe tech 0. */
  modifyProbeSpaceLimit?(currentLimit: number): number;

  /** Override the extra movement cost to leave an asteroid space. Probe tech 1. */
  modifyAsteroidLeaveCost?(currentCost: number): number;

  /** Whether to gain publicity when entering an asteroid space. Probe tech 1. */
  grantsAsteroidPublicity?(): boolean;

  /** Reduce the energy cost for the Land main action. Probe tech 2. */
  modifyLandingCost?(currentCost: number): number;

  /** Whether moon landing is allowed (default false). Probe tech 3. */
  grantsMoonLanding?(): boolean;

  /**
   * Scan-phase modifier hooks. Scan techs 0–3.
   * Called during the signal-placement phase of a Scan action.
   */
  getScanModifiers?(): IScanTechEffect[];

  /**
   * Computer column reward for placing data. Computer techs 0–3.
   * `slotIndex` is 0 (top) or 1 (bottom).
   */
  getComputerSlotReward?(slotIndex: number): IComputerSlotReward | undefined;
}

/**
 * Describes a scan tech effect that can be activated during the Scan action.
 * The player may choose to activate it (some cost publicity/energy).
 */
export interface IScanTechEffect {
  techId: ETechId;
  effectType:
    | 'earth-neighbor'
    | 'mercury-signal'
    | 'hand-signal'
    | 'energy-launch';
  description: string;
  cost?: { publicity?: number; energy?: number };
}

/**
 * Core interface for a tech tile.
 * Each of the 12 techs implements this interface.
 */
export interface ITech extends ITechModifiers {
  readonly id: ETechId;
  readonly type: TTechCategory;
  readonly level: TTechLevel;
  readonly name: string;

  /**
   * One-time bonus granted when the tech is first acquired.
   * Called by the Research Tech action pipeline.
   * Returns undefined if no special action is needed, or a callback
   * to apply the bonus effect.
   */
  onAcquire?(player: IPlayer): void;
}
