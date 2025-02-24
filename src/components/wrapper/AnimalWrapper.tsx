/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 06:15:19
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-25 01:02:04
 * @Description:
 */
import React from 'react';

import { cardNames } from '@/data/CardNames'; // Assuming the json file is named animalData.json

interface BaseCardWrapperProps {
  id: string;
  children: React.ReactNode;
}

const BaseCardWrapper: React.FC<BaseCardWrapperProps> = ({ id, children }) => {
  return (
    <div
      className='ark-card zoo-card animal-card tooltipable'
      draggable={false}
    >
      <div className='ark-card-wrapper shadow-none'>{children}</div>
    </div>
  );
};

export default BaseCardWrapper;
