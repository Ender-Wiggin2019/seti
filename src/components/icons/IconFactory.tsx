import React from 'react';

import TagComponent from '@/components/icons/Tag';

import { IIconItem } from '@/types/element';

interface IconProps {
  iconItem: IIconItem;
}
export const IconFactory: React.FC<IconProps> = ({ iconItem }) => {
  const { type, value, options } = iconItem;

  if (type === 'none') {
    return <div>{options?.text || ''}</div>;
  }

  const getValueComponent = () => {
    if (!options?.showValue) {
      return null;
    }
    return <div className={`icon-value icon-value-${type}`}>{value}</div>;
  };

  return (
    <div className='icon-container '>
      {getValueComponent()}
      <div className={`icon-border`}>
        <TagComponent
          type={type}
          shape={options?.diamondShape ? 'diamond' : undefined}
        />
      </div>
    </div>
  );
};
