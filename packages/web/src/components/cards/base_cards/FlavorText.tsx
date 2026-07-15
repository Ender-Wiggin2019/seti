/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-01 01:53:43
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-03-17 23:46:11
 * @Description:
 */
import Link from 'next/link';
import { Trans, useTranslation } from 'next-i18next';
import React from 'react';

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
            <Link
              className='text-sky-800 underline underline-offset-2'
              href='https://setiathome.berkeley.edu'
            >
              https://setiathome.berkeley.edu
            </Link>
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
