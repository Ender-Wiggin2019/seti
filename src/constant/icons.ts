/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 16:47:27
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 15:52:57
 * @Description:
 */
import { IBaseEffect } from '@/types/effect';
import {
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
  const { type, value, desc, size: oriSize } = effect;

  // default style
  let showValue = false;
  const showValueInCenter = false;
  const text = '';
  let shape: TShape = 'normal';
  let size: TSize = 'md';
  const textColor = '';
  const border = false;
  const borderColor = '';

  switch (type) {
    case ESpecialAction.ORBIT:
    case ESpecialAction.LAND:
    case ESpecialAction.LAUNCH:
    case ESpecialAction.SCAN:
    case ESpecialAction.COMPUTER:
    case EMiscIcon.ROTATE:
    case ETech.ANY:
    case ETech.PROBE:
    case ETech.SCAN:
    case ETech.COMPUTER:
    case ETrace.ANY:
    case ETrace.BLUE:
    case ETrace.RED:
    case ETrace.YELLOW:
    case EScanAction.ANY:
    case EScanAction.BLACK:
    case EScanAction.BLUE:
    case EScanAction.RED:
    case EScanAction.YELLOW:
    case EScanAction.DISCARD_CARD:
    case EScanAction.DISPLAY_CARD:
      size = 'sm';
      break;
    case EResource.MOVE:
    case EResource.SCORE:
      size = 'sm';
      shape = 'round';
      showValue = true;
      break;
    case EResource.CREDIT:
    case EResource.ENERGY:
    case EResource.DATA:
    case EResource.PUBLICITY:
    case EResource.CARD:
    case EResource.CARD_ANY:
      shape = 'diamond';
      size = 'sm';
      showValue = true;
      break;
    default:
      // showValue = true;
      break;
  }
  const res = {
    type,
    value: value || 1,
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
  console.log('🎸 [test] - getIconItem - res:', res);
  return res satisfies IIconItem;
};
