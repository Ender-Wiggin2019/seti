import { EffectFactory } from '@/components/effect/Effect';
import { Textarea } from '@/components/ui/textarea';
import { e } from '@/constant/effect';
import { cn } from '@/lib/utils';
import { EEffectType, Effect, IBaseEffect } from '@/types/effect';

type Props = {
  currentEffects: Effect[];
  onChange?: (effect: IBaseEffect) => void;
};
export const EffectSelector = ({ currentEffects, onChange }: Props) => {
  return (
    <div className='grid grid-cols-4 gap-4'>
      {Object.entries(e).map(([key, fn]) => {
        const effect = fn();
        const hasEffect = currentEffects.some(
          (e) => e.effectType === EEffectType.BASE && e.type === effect.type
        );
        console.log(
          '🎸 [test] - {Object.entries - hasEffect:',
          effect.type,
          hasEffect
        );
        return (
          <div
            key={key}
            onClick={() => onChange?.(effect)}
            className={cn('bg-white', { 'border border-black': hasEffect })}
          >
            <EffectFactory effect={effect} />
          </div>
        );
      })}
    </div>
  );
};
