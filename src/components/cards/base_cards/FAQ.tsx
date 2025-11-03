/*
 * @Author: Ender Wiggin
 * @Date: 2025-11-01 17:10:00
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-04 00:00:48
 * @Description: FAQ component for rendering FAQ list items
 */
import { useTranslation } from 'next-i18next';
import React from 'react';

import { cn } from '@/lib/utils';

interface FAQProps {
  items?: string[];
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({ items, className }) => {
  const { t } = useTranslation('seti');

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={cn('pb-4', className)}>
      <h3 className='text-left text-lg font-semibold mb-3'>FAQ</h3>
      <div className='max-h-24 overflow-y-auto pr-2'>
        {items.map((item, index) => (
          <div key={index} className='mb-2 last:mb-0'>
            {t(item)}
          </div>
        ))}
      </div>
    </div>
  );
};
