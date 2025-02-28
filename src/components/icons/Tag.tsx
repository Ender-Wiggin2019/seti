/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 15:43:02
 * @Description:
 */
import React from 'react';

import { TIcon } from '@/types/element';
interface TagProps {
  type: TIcon;
  shape?: 'diamond';
}

const TagComponent: React.FC<TagProps> = ({ type, shape }) => {
  const iconCls = shape === 'diamond' ? 'seti-icon-diamond' : `seti-icon`;
  const cls = `${iconCls} icon-${type}`;
  return <div className={cls}></div>;
};

export default TagComponent;
