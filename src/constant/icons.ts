/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-03 16:47:27
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 00:01:14
 * @Description:
 */
import { IBaseEffect } from '@/types/effect';
import { EResource, ESpecialAction, IIconItem, TSize } from '@/types/element';
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
    case ESpecialAction.SCAN:
    case ESpecialAction.COMPUTER:
      size = 'lg';
      break;
    case EResource.MOVE:
      shape = 'round';
      showValue = true;
      break;
    case EResource.CREDIT:
    case EResource.ENERGY:
    case EResource.PUBLICITY:
    case EResource.DATA:
      shape = 'diamond';
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
