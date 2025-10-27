/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 22:59:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-06 23:02:07
 * @Description:
 */
import { v4 as uuidv4 } from 'uuid';

import {
  EEffectType,
  IBaseEffect,
  ICustomizedEffect,
  IEndGameEffect,
  IMissionEffect,
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
  TSize,
} from '@/types/element';
const _base =
  (type: TIcon) =>
  (value = 1, desc = '', size?: TSize): IBaseEffect => ({
    effectType: EEffectType.BASE,
    type,
    value,
    desc,
    size,
    helperText: `desc.${type}`,
  });

const ORBIT_COUNT = _base(EMiscIcon.ORBIT_COUNT);
const LAND_COUNT = _base(EMiscIcon.LAND_COUNT);
const ORBIT_OR_LAND_COUNT = _base(EMiscIcon.ORBIT_OR_LAND_COUNT);

const ORBIT = _base(ESpecialAction.ORBIT);
const LAND = _base(ESpecialAction.LAND);
const LAUNCH = _base(ESpecialAction.LAUNCH);
const SCAN = _base(ESpecialAction.SCAN);
const COMPUTER = _base(ESpecialAction.COMPUTER);
const ORBIT_OR_LAND = _base(ESpecialAction.ORBIT_OR_LAND);

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
const FULFILL_SECTOR_ANY = _base(EMiscIcon.FULFILL_SECTOR_ANY);
const FULFILL_SECTOR_RED = _base(EMiscIcon.FULFILL_SECTOR_RED);
const FULFILL_SECTOR_YELLOW = _base(EMiscIcon.FULFILL_SECTOR_YELLOW);
const FULFILL_SECTOR_BLUE = _base(EMiscIcon.FULFILL_SECTOR_BLUE);
const FULFILL_SECTOR_BLACK = _base(EMiscIcon.FULFILL_SECTOR_BLACK);
const FULFILL_ICON = _base(EMiscIcon.FULFILL_ICON);
const ADVANCED_15 = _base(EMiscIcon.ADVANCED_15);
const FULFILL_ADVANCED = _base(EMiscIcon.FULFILL_ADVANCED);
const DANGER = _base(EMiscIcon.DANGER);
const DRAW_ALIEN_CARD = _base(EMiscIcon.DRAW_ALIEN_CARD);
const EXOFOSSIL = _base(EMiscIcon.EXOFOSSIL);
const USE_EXOFOSSIL = _base(EMiscIcon.USE_EXOFOSSIL);
const SAMPLE = _base(EMiscIcon.SAMPLE);
const FULFILL_SAMPLE = _base(EMiscIcon.FULFILL_SAMPLE);
const CREDIT_INCOME = _base(EMiscIcon.CREDIT_INCOME);
const ENERGY_INCOME = _base(EMiscIcon.ENERGY_INCOME);
const CARD_INCOME = _base(EMiscIcon.CARD_INCOME);
const SIGNAL_TOKEN = _base(EMiscIcon.SIGNAL_TOKEN);
export const e = {
  ORBIT,
  LAND,
  LAUNCH,
  SCAN,
  COMPUTER,
  ORBIT_OR_LAND,

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
  FULFILL_SECTOR_ANY,
  FULFILL_SECTOR_RED,
  FULFILL_SECTOR_YELLOW,
  FULFILL_SECTOR_BLUE,
  FULFILL_SECTOR_BLACK,
  FULFILL_ICON,
  ADVANCED_15,
  FULFILL_ADVANCED,
  DANGER,
  DRAW_ALIEN_CARD,
  EXOFOSSIL,
  USE_EXOFOSSIL,
  SAMPLE,
  FULFILL_SAMPLE,
  CREDIT_INCOME,
  ENERGY_INCOME,
  CARD_INCOME,
  SIGNAL_TOKEN,
};
export interface IFlattenMissionItem {
  req: IBaseEffect | ICustomizedEffect | (IBaseEffect | ICustomizedEffect)[];
  reward: IBaseEffect | ICustomizedEffect | (IBaseEffect | ICustomizedEffect)[];
}

// usually will only has one mission
const QUICK_MISSION = (
  req: IFlattenMissionItem['req'],
  reward: IFlattenMissionItem['reward'],
  rewardSize?: 'normal' | 'large'
): IMissionEffect => ({
  effectType: EEffectType.MISSION_QUICK,
  missions: [
    {
      req: Array.isArray(req) ? req : [req],
      reward: Array.isArray(reward) ? reward : [reward],
    },
  ],
  rewardSize,
});

const flatMission2MissionItem = (missions: IFlattenMissionItem[]) => {
  return missions.map((mission) => {
    return {
      req: mission.req
        ? Array.isArray(mission.req)
          ? mission.req
          : [mission.req]
        : [],
      reward: Array.isArray(mission.reward) ? mission.reward : [mission.reward],
    };
  });
};

const FULL_MISSION = (
  missions: IFlattenMissionItem[],
  desc = ''
): IMissionEffect => ({
  effectType: EEffectType.MISSION_FULL,
  missions: flatMission2MissionItem(missions),
  desc,
});

const END_GAME = (
  desc: string,
  score?: number,
  per?: IBaseEffect,
  size?: TSize
): IEndGameEffect => ({
  effectType: EEffectType.END_GAME,
  score,
  per,
  desc,
  size,
});

export const m = {
  QUICK_MISSION,
  FULL_MISSION,
  END_GAME,
};

export const DESC = (
  desc: string,
  width: 'full' | 'half' = 'full'
): ICustomizedEffect => ({
  effectType: EEffectType.CUSTOMIZED,
  desc,
  width,
  id: uuidv4(),
});

export const DESC_WITH_TYPE = (
  type: TIcon,
  desc: string,
  size?: TSize,
  width: 'full' | 'half' = 'full'
): ICustomizedEffect => ({
  effectType: EEffectType.CUSTOMIZED,
  type,
  desc,
  size,
  width,
  helperText: `desc.${type}`,
  id: uuidv4(),
});

export const OR = (...effects: IBaseEffect[]): IOrEffect => ({
  effectType: EEffectType.OR,
  effects,
});
