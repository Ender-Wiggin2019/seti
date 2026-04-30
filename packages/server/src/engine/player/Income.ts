import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
export type TIncomeResource = EResource;
export type TIncomeBundle = Record<EResource, number>;
export type TPartialIncomeBundle = Partial<Record<EResource, number>>;

const EMPTY_RESOURCE_BUNDLE: TIncomeBundle = {
  [EResource.CREDIT]: 0,
  [EResource.ENERGY]: 0,
  [EResource.DATA]: 0,
  [EResource.PUBLICITY]: 0,
  [EResource.SIGNAL_TOKEN]: 0,
  [EResource.SCORE]: 0,
  [EResource.CARD]: 0,
  [EResource.CARD_ANY]: 0,
  [EResource.MOVE]: 0,
};

function normalizeResourceAmount(
  resource: TIncomeResource,
  amount: number | undefined,
): number {
  const normalizedAmount = amount ?? 0;
  if (!Number.isInteger(normalizedAmount) || normalizedAmount < 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${resource} amount must be a non-negative integer`,
      { resource, amount: normalizedAmount },
    );
  }
  return normalizedAmount;
}

function toResourceBundle(
  bundle: TPartialIncomeBundle | undefined,
): TIncomeBundle {
  return {
    [EResource.CREDIT]: normalizeResourceAmount(
      EResource.CREDIT,
      bundle?.[EResource.CREDIT],
    ),
    [EResource.ENERGY]: normalizeResourceAmount(
      EResource.ENERGY,
      bundle?.[EResource.ENERGY],
    ),
    [EResource.DATA]: normalizeResourceAmount(
      EResource.DATA,
      bundle?.[EResource.DATA],
    ),
    [EResource.PUBLICITY]: normalizeResourceAmount(
      EResource.PUBLICITY,
      bundle?.[EResource.PUBLICITY],
    ),
    [EResource.SIGNAL_TOKEN]: normalizeResourceAmount(
      EResource.SIGNAL_TOKEN,
      bundle?.[EResource.SIGNAL_TOKEN],
    ),
    [EResource.SCORE]: normalizeResourceAmount(
      EResource.SCORE,
      bundle?.[EResource.SCORE],
    ),
    [EResource.CARD]: normalizeResourceAmount(
      EResource.CARD,
      bundle?.[EResource.CARD],
    ),
    [EResource.CARD_ANY]: normalizeResourceAmount(
      EResource.CARD_ANY,
      bundle?.[EResource.CARD_ANY],
    ),
    [EResource.MOVE]: normalizeResourceAmount(
      EResource.MOVE,
      bundle?.[EResource.MOVE],
    ),
  };
}

export class Income {
  private baseIncomeBundle: TIncomeBundle;

  private tuckedCardIncomeBundle: TIncomeBundle;

  public constructor(
    baseIncome: TPartialIncomeBundle = EMPTY_RESOURCE_BUNDLE,
    tuckedCardIncome: TPartialIncomeBundle = EMPTY_RESOURCE_BUNDLE,
  ) {
    this.baseIncomeBundle = toResourceBundle(baseIncome);
    this.tuckedCardIncomeBundle = toResourceBundle(tuckedCardIncome);
  }

  public get baseIncome(): TIncomeBundle {
    return { ...this.baseIncomeBundle };
  }

  public get tuckedCardIncome(): TIncomeBundle {
    return { ...this.tuckedCardIncomeBundle };
  }

  public computeRoundPayout(): TIncomeBundle {
    return {
      [EResource.CREDIT]:
        this.baseIncomeBundle[EResource.CREDIT] +
        this.tuckedCardIncomeBundle[EResource.CREDIT],
      [EResource.ENERGY]:
        this.baseIncomeBundle[EResource.ENERGY] +
        this.tuckedCardIncomeBundle[EResource.ENERGY],
      [EResource.DATA]:
        this.baseIncomeBundle[EResource.DATA] +
        this.tuckedCardIncomeBundle[EResource.DATA],
      [EResource.PUBLICITY]:
        this.baseIncomeBundle[EResource.PUBLICITY] +
        this.tuckedCardIncomeBundle[EResource.PUBLICITY],
      [EResource.SIGNAL_TOKEN]:
        this.baseIncomeBundle[EResource.SIGNAL_TOKEN] +
        this.tuckedCardIncomeBundle[EResource.SIGNAL_TOKEN],
      [EResource.SCORE]:
        this.baseIncomeBundle[EResource.SCORE] +
        this.tuckedCardIncomeBundle[EResource.SCORE],
      [EResource.CARD]:
        this.baseIncomeBundle[EResource.CARD] +
        this.tuckedCardIncomeBundle[EResource.CARD],
      [EResource.CARD_ANY]:
        this.baseIncomeBundle[EResource.CARD_ANY] +
        this.tuckedCardIncomeBundle[EResource.CARD_ANY],
      [EResource.MOVE]:
        this.baseIncomeBundle[EResource.MOVE] +
        this.tuckedCardIncomeBundle[EResource.MOVE],
    };
  }

  public addTuckedIncome(resource: TIncomeResource): void {
    if (!(resource in this.tuckedCardIncomeBundle)) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Unknown income resource',
        {
          resource,
        },
      );
    }
    this.tuckedCardIncomeBundle[resource] += 1;
  }

  public addBaseIncome(resource: TIncomeResource, amount: number): void {
    if (!(resource in this.baseIncomeBundle)) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Unknown income resource',
        {
          resource,
        },
      );
    }
    this.baseIncomeBundle[resource] += amount;
  }
}
