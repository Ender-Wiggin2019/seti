/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 02:15:56
 * @Description:
 */
import React from 'react';

import { EResource, EResourceMap, ESector, ESectorMap } from '@/types/BaseCard';

interface TagProps {
  tagType: 'resource' | 'sector';
  type: EResource | ESector;
}

const TagComponent: React.FC<TagProps> = ({ tagType, type }) => {
  if (tagType === 'resource') {
    return <div className='w-20'>{EResourceMap[type]}</div>;
  } else if (tagType === 'sector') {
    return <div className='w-20'>{ESectorMap[type as ESector]}</div>;
  }

  return null;
};

export default TagComponent;
