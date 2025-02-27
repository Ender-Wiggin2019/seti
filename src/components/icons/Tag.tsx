/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-03 06:34:29
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 02:11:07
 * @Description:
 */
import React from 'react';
import { useTranslation } from 'next-i18next';
import { EResource, EResourceMap, ESector, ESectorMap } from '@/types/BaseCard';

interface TagProps {
  tagType?: 'resource' | 'sector';
  type: EResource | ESector;
}

const TagComponent: React.FC<TagProps> = ({ tagType, type }) => {
  const { t } = useTranslation('common');
  const cls = `seti-icon icon-${type}`;
  return <div className={cls}></div>;

  return null;
};

export default TagComponent;
