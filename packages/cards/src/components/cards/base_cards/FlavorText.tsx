/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 01:53:43
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-17 23:46:11
 * @Description:
 */

import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

interface BaseCardProps {
  id?: string;
  flavorText: string;
  display?: 'normal' | 'card';
  className?: string;
}

export const FlavorText: React.FC<BaseCardProps> = ({
  id,
  flavorText,
  display,
  className,
}) => {
  const { t } = useTranslation(['flavorText']);
  const cls = display === 'normal' ? '' : 'card-flavor-text-container';
  const textCls =
    display === 'normal' ? 'normal-flavor-text' : 'card-flavor-text';
  // Easter egg: SETI@Home
  if (id === '108') {
    return (
      <div className={cn(cls, className)}>
        <div className={textCls}>
          <Trans i18nKey={flavorText} ns='flavorText'>
            Anyone can help search for alien life. All you need to do is connect
            to
            <a
              className='text-sky-800 underline underline-offset-2'
              href='https://setiathome.berkeley.edu'
              target='_blank'
              rel='noreferrer'
            >
              https://setiathome.berkeley.edu
            </a>
            .
          </Trans>
        </div>
      </div>
    );
  }

  return (
    <div className={cls}>
      <div className={textCls}>{t(flavorText)}</div>
    </div>
  );
};
