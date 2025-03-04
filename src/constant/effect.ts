/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 22:59:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-05 01:17:05
 * @Description:
 */
import {
  EEffectType,
  IBaseEffect,
  ICustomizedEffect,
  IEndGameEffect,
  IMissionEffect,
  IMissionItem,
  IOrEffect,
} from '@/types/effect';
import {
  EMiscIcon,
  EResource,
  EScanAction,
  ESpecialAction,
  ETech,
  ETrace,
  TIcon,
} from '@/types/element';

const _base =
  (type: TIcon) =>
  (value = 1, desc = `desc.${type}`): IBaseEffect => ({
    effectType: EEffectType.BASE,
    type,
    value,
    desc,
  });

const ORBIT_COUNT = _base(EMiscIcon.ORBIT_COUNT);
const LAND_COUNT = _base(EMiscIcon.LAND_COUNT);
const ORBIT_OR_LAND_COUNT = _base(EMiscIcon.ORBIT_OR_LAND_COUNT);

const ORBIT = _base(ESpecialAction.ORBIT);
const LAND = _base(ESpecialAction.LAND);
const LAUNCH = _base(ESpecialAction.LAUNCH);
const SCAN = _base(ESpecialAction.SCAN);
const COMPUTER = _base(ESpecialAction.COMPUTER);

const TRACE_ANY = _base(ETrace.ANY);
const TRACE_RED = _base(ETrace.RED);
const TRACE_YELLOW = _base(ETrace.YELLOW);
const TRACE_BLUE = _base(ETrace.BLUE);

const TECH_ANY = _base(ETech.ANY);
const TECH_PROBE = _base(ETech.PROBE);
const TECH_SCAN = _base(ETech.SCAN);
const TECH_COMPUTER = _base(ETech.COMPUTER);

const CREDIT = _base(EResource.CREDIT);
const ENERGY = _base(EResource.ENERGY);
const PUBLICITY = _base(EResource.PUBLICITY);
const DATA = _base(EResource.DATA);
const SIGNAL_ANY = _base(EScanAction.ANY); // NOTE: namespace
const MOVE = _base(EResource.MOVE);
const CARD = _base(EResource.CARD);
const CARD_ANY = _base(EResource.CARD_ANY);
const SCORE = _base(EResource.SCORE);

// signal
const SIGNAL_RED = _base(EScanAction.RED); // NOTE: namespace
const SIGNAL_YELLOW = _base(EScanAction.YELLOW); // NOTE: namespace
const SIGNAL_BLUE = _base(EScanAction.BLUE); // NOTE: namespace
const SIGNAL_BLACK = _base(EScanAction.BLACK); // NOTE: namespace
const SIGNAL_DISCARD_CARD = _base(EScanAction.DISCARD_CARD); // NOTE: namespace
const SIGNAL_DISPLAY_CARD = _base(EScanAction.DISPLAY_CARD); // NOTE: namespace

// misc
const ROTATE = _base(EMiscIcon.ROTATE);
const INCOME = _base(EMiscIcon.INCOME);

export const e = {
  ORBIT,
  LAND,
  LAUNCH,
  SCAN,
  COMPUTER,

  ORBIT_COUNT,
  LAND_COUNT,
  ORBIT_OR_LAND_COUNT,

  TRACE_ANY, // NOTE: this will use as filter for all trace card
  TRACE_RED,
  TRACE_YELLOW,
  TRACE_BLUE,

  TECH_ANY,
  TECH_PROBE,
  TECH_SCAN,
  TECH_COMPUTER,

  CREDIT,
  ENERGY,
  PUBLICITY,
  DATA,
  MOVE,
  CARD,
  CARD_ANY,
  SCORE,

  SIGNAL_ANY, // NOTE: this will use as filter for all signal card
  SIGNAL_RED,
  SIGNAL_YELLOW,
  SIGNAL_BLUE,
  SIGNAL_BLACK,
  SIGNAL_DISCARD_CARD,
  SIGNAL_DISPLAY_CARD,

  ROTATE,
  INCOME,
};

// usually will only has one mission
const QUICK_MISSION = (
  req: IBaseEffect | ICustomizedEffect | (IBaseEffect | ICustomizedEffect)[],
  reward: IBaseEffect | IBaseEffect[]
): IMissionEffect => ({
  effectType: EEffectType.MISSION_QUICK,
  missions: [
    {
      req: Array.isArray(req) ? req : [req],
      reward: Array.isArray(reward) ? reward : [reward],
    },
  ],
});

const FULL_MISSION = (missions: IMissionItem[]): IMissionEffect => ({
  effectType: EEffectType.MISSION_FULL,
  missions,
});

const END_GAME = (
  score: number,
  per: IBaseEffect,
  desc = 'for each'
): IEndGameEffect => ({
  effectType: EEffectType.END_GAME,
  score,
  per,
  desc,
});

export const m = {
  QUICK_MISSION,
  FULL_MISSION,
  END_GAME,
};

export const DESC = (desc: string): ICustomizedEffect => ({
  effectType: EEffectType.CUSTOMIZED,
  desc,
});

export const DESC_WITH_TYPE = (
  type: TIcon,
  desc: string
): ICustomizedEffect => ({
  effectType: EEffectType.CUSTOMIZED,
  type,
  desc,
});

export const OR = (...effects: IBaseEffect[]): IOrEffect => ({
  effectType: EEffectType.OR,
  effects,
});
