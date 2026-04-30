import {
  EEffectType,
  type Effect,
  type IBaseEffect,
  type ICustomizedEffect,
  type IOrEffect,
} from '@seti/common/types/effect';
import {
  EAlienIcon,
  EMiscIcon,
  EResource,
  EScanAction,
  ESector,
  ESpecialAction,
  ETech,
  ETrace,
} from '@seti/common/types/element';
import type {
  IResourceBundle,
  TPartialResourceBundle,
} from '../player/Resources.js';

export interface IScanBehavior {
  markEarthSectorIndex?: number;
  markCardSector?: boolean;
  markSectors?: ESector[];
}

export interface IBehavior {
  gainResources?: TPartialResourceBundle;
  spendResources?: TPartialResourceBundle;
  gainScore?: number;
  gainMovement?: number;
  gainIncome?: EResource;
  drawCards?: number;
  launchProbe?: boolean;
  orbit?: boolean;
  land?: boolean;
  tuckForIncome?: boolean;
  scan?: IScanBehavior;
  researchTech?: ETech;
  markTrace?: ETrace;
  markAnySignal?: number;
  markDisplayCardSignal?: number;
  rotateSolarSystem?: boolean;
  gainExofossils?: number;
  custom?: string[];
}

const EMPTY_BEHAVIOR: IBehavior = {};

function toResourceBundle(
  bundle: TPartialResourceBundle | undefined,
): TPartialResourceBundle {
  return bundle ?? {};
}

function incrementResource(
  bundle: TPartialResourceBundle | undefined,
  key: keyof IResourceBundle,
  amount: number,
): TPartialResourceBundle {
  const next = { ...toResourceBundle(bundle) };
  next[key] = (next[key] ?? 0) + amount;
  return next;
}

function mergeScanBehavior(
  base: IScanBehavior | undefined,
  incoming: Partial<IScanBehavior>,
): IScanBehavior {
  return {
    markEarthSectorIndex:
      incoming.markEarthSectorIndex ?? base?.markEarthSectorIndex,
    markCardSector: incoming.markCardSector ?? base?.markCardSector,
    markSectors: [
      ...(base?.markSectors ?? []),
      ...(incoming.markSectors ?? []),
    ],
  };
}

function flattenEffects(effects: Effect[]): Effect[] {
  const result: Effect[] = [];
  for (const effect of effects) {
    if (effect.effectType === EEffectType.OR) {
      result.push(...flattenEffects((effect as IOrEffect).effects));
      continue;
    }
    result.push(effect);
  }
  return result;
}

function appendCustom(
  custom: string[] | undefined,
  effect: ICustomizedEffect,
): string[] {
  const token = effect.desc || effect.id;
  return [...(custom ?? []), token];
}

function applyBaseEffect(behavior: IBehavior, effect: IBaseEffect): IBehavior {
  const amount = effect.value ?? 1;
  switch (effect.type) {
    case EResource.CREDIT:
      return {
        ...behavior,
        gainResources: incrementResource(
          behavior.gainResources,
          'credits',
          amount,
        ),
      };
    case EResource.ENERGY:
      return {
        ...behavior,
        gainResources: incrementResource(
          behavior.gainResources,
          'energy',
          amount,
        ),
      };
    case EResource.PUBLICITY:
      return {
        ...behavior,
        gainResources: incrementResource(
          behavior.gainResources,
          'publicity',
          amount,
        ),
      };
    case EResource.SIGNAL_TOKEN:
      return {
        ...behavior,
        gainResources: incrementResource(
          behavior.gainResources,
          'signalTokens',
          amount,
        ),
      };
    case EResource.DATA:
      return {
        ...behavior,
        gainResources: incrementResource(
          behavior.gainResources,
          'data',
          amount,
        ),
      };
    case EResource.SCORE:
      return {
        ...behavior,
        gainScore: (behavior.gainScore ?? 0) + amount,
      };
    case EResource.MOVE:
      return {
        ...behavior,
        gainMovement: (behavior.gainMovement ?? 0) + amount,
      };
    case EResource.CARD:
    case EResource.CARD_ANY:
      return {
        ...behavior,
        drawCards: (behavior.drawCards ?? 0) + amount,
      };
    case ESpecialAction.LAUNCH:
      return { ...behavior, launchProbe: true };
    case ESpecialAction.ORBIT:
      return { ...behavior, orbit: true };
    case ESpecialAction.LAND:
      return { ...behavior, land: true };
    case ESpecialAction.SCAN:
      return {
        ...behavior,
        scan: mergeScanBehavior(behavior.scan, {
          markEarthSectorIndex: 0,
          markCardSector: true,
        }),
      };
    case ETech.PROBE:
    case ETech.SCAN:
    case ETech.COMPUTER:
    case ETech.ANY:
      return { ...behavior, researchTech: effect.type };
    case ETrace.RED:
    case ETrace.YELLOW:
    case ETrace.BLUE:
    case ETrace.ANY:
      return { ...behavior, markTrace: effect.type };
    case EScanAction.RED:
      return {
        ...behavior,
        scan: mergeScanBehavior(behavior.scan, {
          markSectors: [ESector.RED],
        }),
      };
    case EScanAction.YELLOW:
      return {
        ...behavior,
        scan: mergeScanBehavior(behavior.scan, {
          markSectors: [ESector.YELLOW],
        }),
      };
    case EScanAction.BLUE:
      return {
        ...behavior,
        scan: mergeScanBehavior(behavior.scan, {
          markSectors: [ESector.BLUE],
        }),
      };
    case EScanAction.BLACK:
      return {
        ...behavior,
        scan: mergeScanBehavior(behavior.scan, {
          markSectors: [ESector.BLACK],
        }),
      };
    case EScanAction.ANY:
      return {
        ...behavior,
        markAnySignal: (behavior.markAnySignal ?? 0) + amount,
      };
    case EScanAction.DISPLAY_CARD:
      return {
        ...behavior,
        markDisplayCardSignal: (behavior.markDisplayCardSignal ?? 0) + amount,
      };
    case EMiscIcon.ROTATE:
      return { ...behavior, rotateSolarSystem: true };
    case EMiscIcon.INCOME:
      return { ...behavior, tuckForIncome: true };
    case EMiscIcon.CREDIT_INCOME:
      return { ...behavior, gainIncome: EResource.CREDIT };
    case EMiscIcon.ENERGY_INCOME:
      return { ...behavior, gainIncome: EResource.ENERGY };
    case EMiscIcon.CARD_INCOME:
      return { ...behavior, gainIncome: EResource.CARD };
    case EAlienIcon.EXOFOSSIL:
      return {
        ...behavior,
        gainExofossils: (behavior.gainExofossils ?? 0) + amount,
      };
    default:
      return behavior;
  }
}

export function behaviorFromEffects(effects: Effect[]): IBehavior {
  const flatEffects = flattenEffects(effects);
  let behavior: IBehavior = { ...EMPTY_BEHAVIOR };
  for (let i = 0; i < flatEffects.length; i += 1) {
    const effect = flatEffects[i];

    if (effect.effectType === EEffectType.BASE) {
      // ET.23 models "mark signal in Oumuamua sector" as SIGNAL_ANY + DESC.
      // Skip the generic mark-any translation; the DESC handler resolves
      // the constrained placement (including sector/tile choice).
      if (effect.type === EScanAction.ANY) {
        const next = flatEffects[i + 1];
        if (
          next?.effectType === EEffectType.CUSTOMIZED &&
          (next as ICustomizedEffect).desc === 'desc.et-23'
        ) {
          continue;
        }
      }

      behavior = applyBaseEffect(behavior, effect);
      continue;
    }

    if (effect.effectType === EEffectType.CUSTOMIZED) {
      behavior = {
        ...behavior,
        custom: appendCustom(behavior.custom, effect),
      };
      continue;
    }
  }
  return behavior;
}
