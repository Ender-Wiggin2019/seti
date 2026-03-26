import type {
  ETechId,
  TTechCategory,
  TTechLevel,
} from '@seti/common/types/tech';
import { getTechDescriptor } from '@seti/common/types/tech';
import type { IPlayer } from '../player/IPlayer.js';
import type { IComputerSlotReward, IScanTechEffect, ITech } from './ITech.js';

/**
 * Abstract base class for all 12 tech tiles.
 *
 * Subclasses override the relevant modifier methods to implement their effect.
 * The base class provides no-op defaults so that unimplemented techs
 * don't break the modifier pipeline.
 *
 * Usage pattern:
 *   class ProbeDoubleProbeTech extends Tech {
 *     constructor() { super(ETechId.PROBE_DOUBLE_PROBE, 'Double Probe'); }
 *     override modifyProbeSpaceLimit(current: number): number { return current + 1; }
 *   }
 */
export abstract class Tech implements ITech {
  public readonly id: ETechId;

  public readonly type: TTechCategory;

  public readonly level: TTechLevel;

  public readonly name: string;

  protected constructor(id: ETechId, name: string) {
    this.id = id;
    this.name = name;
    const descriptor = getTechDescriptor(id);
    this.type = descriptor.type;
    this.level = descriptor.level;
  }

  // --- Default no-op implementations for all modifier hooks ---

  public modifyProbeSpaceLimit(currentLimit: number): number {
    return currentLimit;
  }

  public modifyAsteroidLeaveCost(currentCost: number): number {
    return currentCost;
  }

  public grantsAsteroidPublicity(): boolean {
    return false;
  }

  public modifyLandingCost(currentCost: number): number {
    return currentCost;
  }

  public grantsMoonLanding(): boolean {
    return false;
  }

  public getScanModifiers(): IScanTechEffect[] {
    return [];
  }

  public getComputerSlotReward(
    _slotIndex: number,
  ): IComputerSlotReward | undefined {
    return undefined;
  }

  public onAcquire(_player: IPlayer): void {
    // No-op by default; subclasses override for one-time bonus.
  }
}
