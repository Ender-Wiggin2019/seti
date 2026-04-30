import type {
  IComputerColumnConfig,
  IComputerSlotReward,
} from '@seti/common/types/computer';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';

export const TECH_TOP_REWARD: Readonly<IComputerSlotReward> = Object.freeze({
  vp: 2,
});

export interface ITechPlacement {
  techId: ETechId;
  bottomReward: IComputerSlotReward;
}

export interface IComputerColumnState {
  topFilled: boolean;
  topReward: IComputerSlotReward | null;
  techId: ETechId | null;
  hasBottomSlot: boolean;
  bottomFilled: boolean;
  bottomReward: IComputerSlotReward | null;
  techSlotAvailable: boolean;
}

export class ComputerColumn {
  private readonly config: IComputerColumnConfig;

  private topFilledValue = false;

  private bottomFilledValue = false;

  private techPlacementValue: ITechPlacement | null = null;

  public constructor(config: IComputerColumnConfig) {
    this.config = config;
  }

  public get topFilled(): boolean {
    return this.topFilledValue;
  }

  public get bottomFilled(): boolean {
    return this.bottomFilledValue;
  }

  public get hasBottomSlot(): boolean {
    return this.techPlacementValue !== null;
  }

  public get canPlaceTech(): boolean {
    return this.config.techSlotAvailable && this.techPlacementValue === null;
  }

  public get techId(): ETechId | null {
    return this.techPlacementValue?.techId ?? null;
  }

  public get techSlotAvailable(): boolean {
    return this.config.techSlotAvailable;
  }

  public get topReward(): IComputerSlotReward | null {
    if (this.techPlacementValue) return TECH_TOP_REWARD;
    return this.config.topReward;
  }

  public get bottomReward(): IComputerSlotReward | null {
    return this.techPlacementValue?.bottomReward ?? null;
  }

  public placeTech(placement: ITechPlacement): void {
    if (!this.config.techSlotAvailable) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'This column does not accept tech placement',
        { techSlotAvailable: false },
      );
    }
    if (this.techPlacementValue) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Column already has a tech placed',
        { existingTechId: this.techPlacementValue.techId },
      );
    }
    this.techPlacementValue = placement;
  }

  public placeTopData(): IComputerSlotReward | null {
    if (this.topFilledValue) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top slot is already occupied',
      );
    }
    this.topFilledValue = true;
    return this.topReward;
  }

  public placeBottomData(): IComputerSlotReward | null {
    if (!this.hasBottomSlot) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No bottom slot exists (no tech placed on this column)',
      );
    }
    if (!this.topFilledValue) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Top slot must be filled before placing in bottom slot',
      );
    }
    if (this.bottomFilledValue) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Bottom slot is already occupied',
      );
    }
    this.bottomFilledValue = true;
    return this.bottomReward;
  }

  public clear(): void {
    this.topFilledValue = false;
    this.bottomFilledValue = false;
  }

  public getState(): IComputerColumnState {
    return {
      topFilled: this.topFilledValue,
      topReward: this.topReward,
      techId: this.techId,
      hasBottomSlot: this.hasBottomSlot,
      bottomFilled: this.bottomFilledValue,
      bottomReward: this.bottomReward,
      techSlotAvailable: this.config.techSlotAvailable,
    };
  }
}
