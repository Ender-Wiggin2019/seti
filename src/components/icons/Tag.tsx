/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-07 01:50:13
 * @Description:
 */
import React from 'react';

import { EResource, TIcon } from '@/types/element';
import { TShape } from '@/types/Icon';
interface TagProps {
  type: TIcon;
  shape?: TShape;
}

const TagComponent: React.FC<TagProps> = ({ type, shape = 'round' }) => {
  let iconCls;
  switch (shape) {
    case 'diamond':
      iconCls = 'seti-icon-diamond';
      break;
    case 'round':
      iconCls = 'seti-icon';
      break;
    case 'normal':
      iconCls = 'seti-icon';
      break;
    default:
      iconCls = 'seti-icon';
      break;
  }

  // NOTE: special display logic for move
  const typeCls =
    type === EResource.MOVE && shape === 'normal' ? 'move-special' : type;
  const cls = `${iconCls} icon-${typeCls}`;
  return <div className={cls}></div>;
};

export default TagComponent;
