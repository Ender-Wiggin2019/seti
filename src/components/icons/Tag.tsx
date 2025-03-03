/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-04 00:02:57
 * @Description:
 */
import React from 'react';

import { TIcon } from '@/types/element';
interface TagProps {
  type: TIcon;
  shape?: 'diamond' | 'round' | 'normal';
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

  const cls = `${iconCls} icon-${type}`;
  return <div className={cls}></div>;
};

export default TagComponent;
