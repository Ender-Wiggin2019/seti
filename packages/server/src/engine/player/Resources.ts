import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export interface IResourceBundle {
  credits: number;
  energy: number;
  publicity: number;
  data: number;
  signalTokens: number;
}

export type TPartialResourceBundle = Partial<IResourceBundle>;

export type TResourceChangeObserver = (
  resource: keyof IResourceBundle,
  delta: number,
) => void;

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
  signalTokens: 0,
};

/** Credits / energy track cap (implementation limit). */
const CREDIT_ENERGY_MAX = 999;

/** Publicity track max — rule board is 0–10 (see rule-simple / prd-rule). */
const PUBLICITY_MAX = 10;

function maxForScalarResource(
  resource: 'credits' | 'energy' | 'publicity',
): number {
  return resource === 'publicity' ? PUBLICITY_MAX : CREDIT_ENERGY_MAX;
}

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

function assertMaxResourceAmount(
  resource: 'credits' | 'energy' | 'publicity',
  amount: number,
): void {
  const max = maxForScalarResource(resource);
  if (amount > max) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${resource} cannot exceed ${max}`,
      { resource, amount, max },
    );
  }
}

export class Resources {
  private creditsAmount: number;

  private energyAmount: number;

  private publicityAmount: number;

  private signalTokensAmount: number;

  private readonly dataController?: IDataResourceController;

  private onChange?: TResourceChangeObserver;

  public constructor(
    initialBundle: TPartialResourceBundle = EMPTY_RESOURCE_BUNDLE,
    options: {
      dataController?: IDataResourceController;
      onChange?: TResourceChangeObserver;
    } = {},
  ) {
    this.creditsAmount = normalizeResourceAmount(
      'credits',
      initialBundle.credits,
    );
    assertMaxResourceAmount('credits', this.creditsAmount);
    this.energyAmount = normalizeResourceAmount('energy', initialBundle.energy);
    assertMaxResourceAmount('energy', this.energyAmount);
    this.publicityAmount = normalizeResourceAmount(
      'publicity',
      initialBundle.publicity,
    );
    assertMaxResourceAmount('publicity', this.publicityAmount);
    this.signalTokensAmount = normalizeResourceAmount(
      'signalTokens',
      initialBundle.signalTokens,
    );
    this.dataController = options.dataController;
    this.onChange = options.onChange;
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

  public get signalTokens(): number {
    return this.signalTokensAmount;
  }

  public setChangeObserver(onChange?: TResourceChangeObserver): void {
    this.onChange = onChange;
  }

  public setPublicity(value: number): void {
    const normalizedValue = normalizeResourceAmount('publicity', value);
    assertMaxResourceAmount('publicity', normalizedValue);
    const before = this.publicityAmount;
    this.publicityAmount = normalizedValue;
    this.emitChange('publicity', before, this.publicityAmount);
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

    const creditsBefore = this.creditsAmount;
    this.creditsAmount -= normalizeResourceAmount('credits', bundle.credits);
    this.emitChange('credits', creditsBefore, this.creditsAmount);

    const energyBefore = this.energyAmount;
    this.energyAmount -= normalizeResourceAmount('energy', bundle.energy);
    this.emitChange('energy', energyBefore, this.energyAmount);

    const publicityBefore = this.publicityAmount;
    this.publicityAmount -= normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    this.emitChange('publicity', publicityBefore, this.publicityAmount);

    const signalTokensBefore = this.signalTokensAmount;
    this.signalTokensAmount -= normalizeResourceAmount(
      'signalTokens',
      bundle.signalTokens,
    );
    this.emitChange(
      'signalTokens',
      signalTokensBefore,
      this.signalTokensAmount,
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
      const dataBefore = this.data;
      this.dataController.spend(spendDataAmount);
      this.emitChange('data', dataBefore, this.data);
    }
  }

  public gain(bundle: TPartialResourceBundle): void {
    const creditsBefore = this.creditsAmount;
    this.creditsAmount = Math.min(
      CREDIT_ENERGY_MAX,
      this.creditsAmount + normalizeResourceAmount('credits', bundle.credits),
    );
    this.emitChange('credits', creditsBefore, this.creditsAmount);

    const energyBefore = this.energyAmount;
    this.energyAmount = Math.min(
      CREDIT_ENERGY_MAX,
      this.energyAmount + normalizeResourceAmount('energy', bundle.energy),
    );
    this.emitChange('energy', energyBefore, this.energyAmount);

    const gainPublicityAmount = normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    const publicityBefore = this.publicityAmount;
    this.publicityAmount = Math.min(
      PUBLICITY_MAX,
      this.publicityAmount + gainPublicityAmount,
    );
    this.emitChange('publicity', publicityBefore, this.publicityAmount);

    const signalTokensBefore = this.signalTokensAmount;
    this.signalTokensAmount += normalizeResourceAmount(
      'signalTokens',
      bundle.signalTokens,
    );
    this.emitChange(
      'signalTokens',
      signalTokensBefore,
      this.signalTokensAmount,
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
      const dataBefore = this.data;
      this.dataController.gain(gainDataAmount);
      this.emitChange('data', dataBefore, this.data);
    }
  }

  public has(bundle: TPartialResourceBundle): boolean {
    const requiredCredits = normalizeResourceAmount('credits', bundle.credits);
    const requiredEnergy = normalizeResourceAmount('energy', bundle.energy);
    const requiredPublicity = normalizeResourceAmount(
      'publicity',
      bundle.publicity,
    );
    const requiredSignalTokens = normalizeResourceAmount(
      'signalTokens',
      bundle.signalTokens,
    );
    const requiredData = normalizeResourceAmount('data', bundle.data);
    const hasData =
      requiredData === 0 || this.dataController?.has(requiredData) === true;
    return (
      this.creditsAmount >= requiredCredits &&
      this.energyAmount >= requiredEnergy &&
      this.publicityAmount >= requiredPublicity &&
      this.signalTokensAmount >= requiredSignalTokens &&
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
      signalTokens: this.signalTokensAmount,
    };
  }

  private emitChange(
    resource: keyof IResourceBundle,
    before: number,
    after: number,
  ): void {
    const delta = after - before;
    if (delta !== 0) {
      this.onChange?.(resource, delta);
    }
  }
}
