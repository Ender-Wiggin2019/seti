/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 13:33:56
 * @Description:
 */
import React from 'react';
import { useTranslation } from 'next-i18next';
import { EResource, EResourceMap, ESector, ESectorMap } from '@/types/BaseCard';

interface TagProps {
  tagType: 'resource' | 'sector';
  type: EResource | ESector;
}

const TagComponent: React.FC<TagProps> = ({ tagType, type }) => {
  const { t } = useTranslation('common');
  if (tagType === 'resource') {
    return <div className='w-20'>{t(EResourceMap[type])}</div>;
  } else if (tagType === 'sector') {
    return <div className='w-20'>{t(ESectorMap[type as ESector])}</div>;
  }

  return null;
};

export default TagComponent;
