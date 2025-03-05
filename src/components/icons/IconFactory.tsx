/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-06 00:30:49
 * @Description:
 */
import React from 'react';

import TagComponent from '@/components/icons/Tag';

import { IIconItem } from '@/types/element';

interface IconProps {
  iconItem: IIconItem;
}
export const IconFactory: React.FC<IconProps> = ({ iconItem }) => {
  const { type, value, options } = iconItem;

  if (!type) {
    return <div>{options?.text || ''}</div>;
  }

  const getValueComponent = () => {
    if (!options?.showValue) {
      return null;
    }
    return <div className={`icon-value icon-value-${type}`}>{value}</div>;
  };

  const showMultipleItem = !options?.showValue && value > 1;

  return (
    <div className={`icon-container icon-${options?.size || 'md'}`}>
      {getValueComponent()}
      {Array.from({ length: showMultipleItem ? value : 1 }).map((_, index) => (
        <div key={index} className='icon-border'>
          <TagComponent type={type} shape={options?.shape} />
        </div>
      ))}
    </div>
  );
};
