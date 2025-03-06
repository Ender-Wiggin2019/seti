/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-14 10:52:47
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 02:21:49
 * @Description:
 */
import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import Tag from '@/components/icons/Tag';
import { Slider } from '@/components/ui/slider';

import { EResource } from '@/types/element';
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
    <div className='group mt-1 flex w-64 flex-row items-center justify-center space-x-2 rounded-full bg-gradient-to-b  px-2 py-1 text-sm font-medium shadow-lg shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none focus-visible:ring-2 from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 focus-visible:ring-yellow-500/80'>
      <div className='flex flex-row gap-1 items-center'>
        <div className='scale-75'>
          <Tag type={EResource.CREDIT} />
        </div>
        <div className='text-xl w-8 font-bold text-[#b09530]'>
          {credit[0] === 5 ? 'All' : credit[0]}
        </div>
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
