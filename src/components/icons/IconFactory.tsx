/*
 * @Author: Ender-Wiggin
 * @Date: 2025-02-25 09:56:21
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-07-01 00:45:05
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
  const size = options?.size || 'md';
  if (!type) {
    return <div>{options?.text || ''}</div>;
  }

  const getValueComponent = () => {
    if (!options?.showValue) {
      return null;
    }
    return (
      <div
        // className={`absolute icon-value icon-text-${
        //   options?.size || 'md'
        // }-1 icon-value-${type}`}
        className={`absolute icon-value icon-value-size-${size} icon-value-${type}`}
      >
        {value || 0}
      </div>
    );
  };

  const showMultipleItem = !options?.showValue;

  return (
    <div
      className={`icon-container icon-container-${size}-${
        showMultipleItem ? value : 1
      }`}
    >
      {getValueComponent()}
      {Array.from({ length: showMultipleItem ? value : 1 }).map((_, index) => (
        <div key={index} className='icon-border'>
          <TagComponent type={type} shape={options?.shape} />
        </div>
      ))}
    </div>
  );
};
