/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 16:47:27
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-01 13:32:48
 * @Description:
 */
import { IBaseEffect } from '@/types/effect';
import {
  EAlienIcon,
  EMiscIcon,
  EResource,
  EScanAction,
  ESpecialAction,
  ETech,
  ETrace,
  IIconItem,
  TSize,
} from '@/types/element';
import { TShape } from '@/types/Icon';

export const getIconItem = (effect: IBaseEffect): IIconItem => {
  const { type: _type, value, desc, size: oriSize } = effect;

  // default style
  let showValue = false;
  const showValueInCenter = false;
  const text = '';
  let shape: TShape = 'normal';
  let size: TSize = 'md';
  let type = _type;
  const textColor = '';
  const border = false;
  const borderColor = '';

  switch (type) {
    case ESpecialAction.ORBIT:
    case ESpecialAction.LAND:
    case ESpecialAction.LAUNCH:
    case ESpecialAction.SCAN:
    case ESpecialAction.COMPUTER:
    case ESpecialAction.ORBIT_OR_LAND:
    case EMiscIcon.ROTATE:
    case ETech.ANY:
    case ETech.PROBE:
    case ETech.SCAN:
    case ETech.COMPUTER:
    case ETrace.ANY:
    case ETrace.BLUE:
    case ETrace.RED:
    case ETrace.YELLOW:
    case EScanAction.DISCARD_CARD:
    case EScanAction.DISPLAY_CARD:
    case EMiscIcon.SIGNAL_TOKEN:
    case EAlienIcon.ORGANELLE_RED:
    case EAlienIcon.ORGANELLE_BLUE:
    case EAlienIcon.ORGANELLE_YELLOW:
      size = 'sm';
      break;
    case EScanAction.ANY:
    case EScanAction.BLACK:
    case EScanAction.BLUE:
    case EScanAction.RED:
    case EScanAction.YELLOW:
    case EMiscIcon.ORBIT_COUNT:
    case EMiscIcon.LAND_COUNT:
    case EMiscIcon.ORBIT_OR_LAND_COUNT:
    case EAlienIcon.SAMPLE:
    case EAlienIcon.FULFILL_SAMPLE:
      shape = 'round';
      size = 'xs';
      break;
    case EResource.MOVE:
      size = 'sm';
      shape = 'normal';
      showValue = true;
      type = 'move-special'; // special render
      break;
    case EResource.SCORE:
      size = 'sm';
      shape = 'round';
      showValue = true;
      break;
    case EResource.CARD:
      size = 'sm';
      shape = 'normal';
      showValue = true;
      type = 'draw-card-special'; // special render
      break;
    case EResource.CARD_ANY:
      size = 'sm';
      shape = 'normal';
      showValue = true;
      type = 'any-card-special'; // special render
      break;
    case EMiscIcon.DRAW_ALIEN_CARD:
      size = 'sm';
      shape = 'normal';
      showValue = true;
      break;
    case EResource.CREDIT:
    case EResource.ENERGY:
    case EResource.DATA:
    case EResource.PUBLICITY:
    case EAlienIcon.EXOFOSSIL:
    case EAlienIcon.USE_EXOFOSSIL:
      shape = 'diamond';
      size = 'sm';
      showValue = true;
      break;
    case EAlienIcon.DANGER:
      showValue = true;
      break;
    default:
      // showValue = true;
      shape = 'round';
      break;
  }
  const res = {
    type,
    value: value !== undefined ? value : 1,
    options: {
      size: oriSize || size,
      showValue,
      text: desc,
      shape,
      textColor,
      border,
      borderColor,
    },
  };
  return res satisfies IIconItem;
};
