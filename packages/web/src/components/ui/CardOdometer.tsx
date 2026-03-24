/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-08 11:36:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 02:04:27
 * @Description:
 */
import dynamic from 'next/dynamic';
import React from 'react';

const Odometer = dynamic(() => import('react-odometerjs'), {
  ssr: false,
  loading: () => <div>0</div>,
});

type CardOdometerProps = {
  className?: string;
  name: string;
  value: number;
  // Add custom props here
};

export const CardOdometer: React.FC<CardOdometerProps> = ({
  className,
  name,
  value,
}) => {
  return (
    <div className='group flex w-40 items-center justify-between space-x-2 rounded-full bg-gradient-to-b from-zinc-900/70 to-zinc-800/60 shadow-zinc-700/10 ring-zinc-700/80 px-4 py-2 text-sm font-medium text-zinc-200 shadow-lg ring-1 backdrop-blur-md focus:outline-none focus-visible:ring-2 dark:from-zinc-900/30 dark:to-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 dark:focus-visible:ring-yellow-500/80'>
      <div className={className}>{name}</div>
      <Odometer value={value} format='d'>
        duration={500}
      </Odometer>
    </div>
  );
};
