/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 16:47:27
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 00:01:14
 * @Description:
 */
import { IBaseEffect } from '@/types/effect';
import { ESpecialAction, IIconItem } from '@/types/element';

export const getIcon = (effect: IBaseEffect): IIconItem => {
  const { type, value, desc } = effect;

  // default style
  let showValue = false;
  const diamondShape = false;
  const textColor = '';
  const border = false;
  const borderColor = '';

  switch (type) {
    case ESpecialAction.ORBIT:
      break;
    case ESpecialAction.LAND:
      break;
    case ESpecialAction.SCAN:
      break;
    case ESpecialAction.COMPUTER:
      break;
    default:
      showValue = true;
      break;
  }
  const res = {
    type,
    value: value || 1,
    options: {
      showValue,
      text: desc,
      diamondShape,
      textColor,
      border,
      borderColor,
    },
  };
  console.log('🎸 [test] - getIcon - res:', res);
  return res;
};
