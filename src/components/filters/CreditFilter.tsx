/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-14 10:52:47
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-26 13:52:46
 * @Description:
 */
import React, { useEffect, useState } from 'react';
import { FiHexagon } from 'react-icons/fi';

import { cn } from '@/lib/utils';

import { Slider } from '@/components/ui/slider';
type CreditFilterProps = React.ComponentProps<typeof Slider> & {
  onFilterChange: (credit: number[]) => void;
  reset: boolean;
};

export function CreditFilter({
  className,
  onFilterChange,
  reset,
  ...props
}: CreditFilterProps) {
  const [credit, setCredit] = useState([5]);

  const handleCreditChange = (value: number[]) => {
    setCredit(value);
  };

  useEffect(() => {
    onFilterChange(credit);
  }, [credit]);

  useEffect(() => {
    if (reset) {
      setCredit([5]);
    }
  }, [reset]);

  return (
    <div className='group mt-1 flex w-48 flex-row items-center justify-center space-x-2 rounded-full bg-gradient-to-b from-zinc-50/20 to-white/80 px-4 py-2 text-sm font-medium text-amber-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md focus:outline-none focus-visible:ring-2 dark:from-zinc-900/30 dark:to-zinc-800/80 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 dark:focus-visible:ring-yellow-500/80'>
      <div className='flex w-10 flex-row gap-2'>
        <FiHexagon className='h-auto w-auto' />
        <div>{credit[0] === 5 ? 'All' : credit[0]}</div>
      </div>
      <Slider
        value={credit}
        min={0}
        max={5}
        step={1}
        onValueChange={handleCreditChange}
        className={cn('w-[60%]', className)}
        color='amber'
        {...props}
      />
    </div>
  );
}
