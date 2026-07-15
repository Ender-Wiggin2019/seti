/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-15 06:15:19
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-29 00:03:21
 * @Description:
 */
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardListProps {
  children: ReactNode;
  className?: string;
}

const CardList: React.FC<CardListProps> = ({ children, className }) => (
  <div
    className={cn(
      '-pt-1 grid w-full grid-cols-2 justify-items-center gap-4 px-1 lg:grid-cols-3 lg:px-2 xl:grid-cols-4',
      className,
    )}
  >
    {children}
  </div>
);

export default CardList;
