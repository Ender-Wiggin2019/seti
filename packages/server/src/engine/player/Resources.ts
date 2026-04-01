import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export interface IResourceBundle {
  credits: number;
  energy: number;
  publicity: number;
  data: number;
}

export type TPartialResourceBundle = Partial<IResourceBundle>;

export interface IDataResourceController {
  has(amount: number): boolean;
  gain(amount: number): number;
  addToStash(amount: number): number;
  spend(amount: number): void;
  getState(): {
    total: number;
    totalMax: number;
  };
}

const EMPTY_RESOURCE_BUNDLE: IResourceBundle = {
  credits: 0,
  energy: 0,
  publicity: 0,
  data: 0,
};

const PUBLICITY_MAX = 10;

function normalizeResourceAmount(
  resource: keyof IResourceBundle,
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

export class Resources {
  private creditsAmount: number;

  private energyAmount: number;

  private publicityAmount: number;

  private readonly dataController?: IDataResourceController;

  public constructor(
    initialBundle: TPartialResourceBundle = EMPTY_RESOURCE_BUNDLE,
    options: { dataController?: IDataResourceController } = {},
  ) {
    this.creditsAmount = normalizeResourceAmount(
      'credits',
      initialBundle.credits,
    );
    this.energyAmount = normalizeResourceAmount('energy', initialBundle.energy);
    this.publicityAmount = normalizeResourceAmount(
      'publicity',
      initialBundle.publicity,
    );
    if (this.publicityAmount > PUBLICITY_MAX) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `publicity cannot exceed ${PUBLICITY_MAX}`,
        { publicity: this.publicityAmount, max: PUBLICITY_MAX },
      );
    }
    this.dataController = options.dataController;
    const initialData = normalizeResourceAmount('data', initialBundle.data);
    if (initialData > 0) {
      if (!this.dataController) {
        throw new GameError(
          EErrorCode.VALIDATION_ERROR,
          'dataController is required when initializing data',
          { initialData },
        );
      }
      this.dataController.addToStash(initialData);
    }
  }

  public get credits(): number {
    return this.creditsAmount;
  }

  public get energy(): number {
    return this.energyAmount;
  }

  public get publicity(): number {
    return this.publicityAmount;
  }

  public get data(): number {
    return this.dataController?.getState().total ?? 0;
  }

  public setPublicity(value: number): void {
    const normalizedValue = normalizeResourceAmount('publicity', value);
    if (normalizedValue > PUBLICITY_MAX) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        `publicity cannot exceed ${PUBLICITY_MAX}`,
        { publicity: normalizedValue, max: PUBLICITY_MAX },
      );
    }
    this.publicityAmount = normalizedValue;
  }

  public spend(bundle: TPartialResourceBundle): void {
    if (!this.has(bundle)) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Insufficient resources to spend requested bundle',
        {
          current: this.toObject(),
          requested: bundle,
        },
      );
    }

    this.creditsAmount -= normalizeResourceAmount('credits', bundle.credits);
    this.energyAmount -= normalizeResourceAmount('energy', bundle.energy);
    this.publicityAmount -= normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    const spendDataAmount = normalizeResourceAmount('data', bundle.data);
    if (spendDataAmount > 0) {
      if (!this.dataController) {
        throw new GameError(
          EErrorCode.VALIDATION_ERROR,
          'dataController is required when spending data',
          { spendDataAmount },
        );
      }
      this.dataController.spend(spendDataAmount);
    }
  }

  public gain(bundle: TPartialResourceBundle): void {
    this.creditsAmount += normalizeResourceAmount('credits', bundle.credits);
    this.energyAmount += normalizeResourceAmount('energy', bundle.energy);
    const gainPublicityAmount = normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    this.publicityAmount = Math.min(
      PUBLICITY_MAX,
      this.publicityAmount + gainPublicityAmount,
    );
    const gainDataAmount = normalizeResourceAmount('data', bundle.data);
    if (gainDataAmount > 0) {
      if (!this.dataController) {
        throw new GameError(
          EErrorCode.VALIDATION_ERROR,
          'dataController is required when gaining data',
          { gainDataAmount },
        );
      }
      this.dataController.gain(gainDataAmount);
    }
  }

  public has(bundle: TPartialResourceBundle): boolean {
    const requiredCredits = normalizeResourceAmount('credits', bundle.credits);
    const requiredEnergy = normalizeResourceAmount('energy', bundle.energy);
    const requiredPublicity = normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    const requiredData = normalizeResourceAmount('data', bundle.data);
    const hasData =
      requiredData === 0 || this.dataController?.has(requiredData) === true;
    return (
      this.creditsAmount >= requiredCredits &&
      this.energyAmount >= requiredEnergy &&
      this.publicityAmount >= requiredPublicity &&
      hasData
    );
  }

  public canAfford(bundle: TPartialResourceBundle): boolean {
    return this.has(bundle);
  }

  public toObject(): IResourceBundle {
    return {
      credits: this.creditsAmount,
      energy: this.energyAmount,
      publicity: this.publicityAmount,
      data: this.data,
    };
  }
}
