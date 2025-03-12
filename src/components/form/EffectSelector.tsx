import { EffectFactory } from '@/components/effect/Effect';
import { AccordionV2 } from '@/components/ui/accordion-v2';
import { Textarea } from '@/components/ui/textarea';
import { e } from '@/constant/effect';
import { cn } from '@/lib/utils';
import { EEffectType, Effect, IBaseEffect } from '@/types/effect';
import { TSize } from '@/types/element';

type Props = {
  currentEffects: Effect[];
  onChange?: (effect: IBaseEffect) => void;
};
export const EffectSelector = ({ currentEffects, onChange }: Props) => {
  return (
    <AccordionV2 title='Effects'>
      <div className='grid grid-cols-4 gap-2 lg:grid-cols-5'>
        {Object.entries(e).map(([key, fn]) => {
          const effect = fn();
          const displayedEffect = { ...effect, size: 'xl' as TSize };
          const hasEffect = currentEffects.some(
            (e) => e.effectType === EEffectType.BASE && e.type === effect.type
          );
          return (
            <div
              key={key}
              onClick={() => onChange?.(effect)}
              className={cn(
                'flex w-40 items-center rounded-md bg-gradient-to-b px-4 py-2 text-sm font-medium shadow-zinc-800/5 ring-1 backdrop-blur-md focus:outline-none from-zinc-900/30 to-zinc-800/80 text-zinc-200 ring-white/10 hover:ring-white/20 p-2 shadow-md h-18 w-18 justify-center',
                { 'ring-white/10 from-zinc-900/30 to-primary/80': hasEffect }
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
