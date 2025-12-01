/*
 * @Author: Ender-Wiggin
 * @Date: 2025-03-14 23:39:03
 * @LastEditors: Ender Wiggin
 * @LastEditTime: 2025-11-04 01:58:13
 * @Description:
 */

import { EffectFactory } from '@/components/effect/Effect';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { BASE_EFFECTS } from '@/constant/effect';
import { cn } from '@/lib/utils';

import { EEffectType, Effect, IBaseEffect } from '@/types/effect';
import { TIcon, TSize } from '@/types/element';

type Props = {
  currentEffects: Effect[];
  onChange?: (effect: IBaseEffect) => void;
  title?: string;
  icons?: TIcon[];
};
export const EffectSelector = ({
  currentEffects,
  title,
  icons,
  onChange,
}: Props) => {
  return (
    <AccordionV2 title={title || 'Icons'}>
      <div className='grid grid-cols-4 gap-2 lg:grid-cols-5'>
        {Object.entries(BASE_EFFECTS).map(([key, fn]) => {
          const effect = fn();
          if (icons && !icons.includes(effect.type)) {
            return null;
          }
          const displayedEffect = { ...effect, size: 'xl' as TSize };
          const hasEffect = currentEffects.some(
            (e) => e.effectType === EEffectType.BASE && e.type === effect.type,
          );
          return (
            <div
              key={key}
              onClick={() => onChange?.(effect)}
              className={cn(
                'flex w-40 items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center',
                { 'ring-white/10 from-zinc-900/30 to-primary/80': hasEffect },
              )}
            >
              <EffectFactory effect={displayedEffect} />
            </div>
          );
        })}
      </div>
    </AccordionV2>
  );
};
