/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:30:47
 * @Description:
 */

import { TIcon } from '@seti/common/types/element';
import { TShape } from '@seti/common/types/Icon';
import React from 'react';

interface TagProps {
  type: TIcon;
  shape?: TShape;
}

const TagComponent: React.FC<TagProps> = ({ type, shape = 'round' }) => {
  let iconCls;
  switch (shape) {
    case 'diamond':
      iconCls = 'seti-icon diamond';
      break;
    case 'round':
      iconCls = 'seti-icon';
      break;
    case 'normal':
      iconCls = 'seti-icon normal';
      break;
    default:
      iconCls = 'seti-icon';
      break;
  }

  const cls = `${iconCls} icon-${type}`;
  return <div className={cls}></div>;
};

export default TagComponent;
