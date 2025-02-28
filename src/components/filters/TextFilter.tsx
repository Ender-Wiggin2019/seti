/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-08 11:36:49
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-28 13:05:37
 * @Description:
 */
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import React, { useState } from 'react';

import { cn } from '@/lib/utils';
type TextFilterProps = {
  onTextChange: (newText: string) => void;
  reset: boolean;
};

export const TextFilter: React.FC<TextFilterProps> = ({
  onTextChange,
  reset,
}) => {
  const { t } = useTranslation('common');
  const [text, setText] = useState<string>('');

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleMouseMove = React.useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - bounds.left);
      mouseY.set(clientY - bounds.top);
    },
    [mouseX, mouseY]
  );
  const background = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, var(--spotlight-color) 0%, transparent 85%)`;

  const handleChange = (text: string) => {
    setText(text);
    onTextChange(text);
  };

  React.useEffect(() => {
    if (reset) {
      setText('');
    }
  }, [reset]);

  return (
    <div
      className={cn(
        'group relative flex w-full rounded-xl bg-gradient-to-b p-4 shadow-xl ring-2  transition-opacity from-zinc-900/70 to-zinc-800/60 shadow-zinc-700/10 ring-zinc-700/80 [--spotlight-color:rgb(217_249_157_/_0.04)] md:p-4 lg:w-1/2'
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className='pointer-events-none absolute -inset-px z-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100'
        style={{ background }}
        aria-hidden='true'
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-xl mix-blend-overlay'
        )}
      >
        <svg
          aria-hidden='true'
          className='absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg fill-[hsla(0,0%,100%,.03)] stroke-white/10'
        >
          <defs>
            <pattern
              id=':R1d6hd6:'
              width='72'
              height='56'
              patternUnits='userSpaceOnUse'
              x='50%'
              y='16'
            >
              <path d='M.5 56V.5H72' fill='none'></path>
            </pattern>
          </defs>
          <rect
            width='100%'
            height='100%'
            strokeWidth='0'
            fill='url(#:R1d6hd6:)'
          ></rect>
          <svg x='50%' y='16' className='overflow-visible'>
            <rect strokeWidth='0' width='73' height='57' x='0' y='56'></rect>
            <rect strokeWidth='0' width='73' height='57' x='72' y='168'></rect>
          </svg>
        </svg>
      </div>

      <div className='z-10 ml-2 flex-1 shrink-0 md:ml-4'>
        <input
          className='block w-full shrink-0 resize-none border-0 bg-transparent p-0 text-sm leading-6 placeholder-zinc-400 outline-none transition-[height] will-change-[height] focus:outline-none focus:ring-0 text-zinc-200'
          value={text}
          placeholder={t('Filter text') + '...'}
          onChange={(event) => handleChange(event.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
};
