import {
  EEffectType,
  type Effect,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import type { IPreludeCard } from '@seti/common/types/prelude';
import { useTranslation } from 'react-i18next';
import { DescTextRender } from '@/features/cards/DescTextRender';

interface IPreludeTextCardProps {
  card: IPreludeCard;
}

type TranslateFn = (value: string) => string;

function formatBaseEffect(effect: IBaseEffect): string {
  return [effect.value == null ? '' : String(effect.value), effect.type]
    .filter(Boolean)
    .join(' ');
}

function formatCustomizedEffect(
  effect: ICustomizedEffect,
  translate: TranslateFn,
): string {
  return translate(effect.desc);
}

function formatEffect(effect: Effect, translate: TranslateFn): string {
  switch (effect.effectType) {
    case EEffectType.BASE:
      return formatBaseEffect(effect);
    case EEffectType.CUSTOMIZED:
      return formatCustomizedEffect(effect, translate);
    case EEffectType.OR:
      return effect.effects
        .map((nestedEffect) => formatEffect(nestedEffect, translate))
        .join(' OR ');
    default:
      return '?';
  }
}

function PreludeTextEffectList({
  cardId,
  label,
  effects,
  testId,
  translate,
}: {
  cardId: string;
  label: string;
  effects: Effect[];
  testId: string;
  translate: TranslateFn;
}): React.JSX.Element {
  return (
    <section data-testid={testId} className='space-y-0.5'>
      <div className='text-[8px] font-semibold uppercase tracking-wide text-text-400'>
        {label}
      </div>
      {effects.length > 0 ? (
        effects.map((effect, index) => (
          <div key={`${cardId}-${label}-${index}`} className='break-words'>
            <DescTextRender desc={formatEffect(effect, translate)} />
          </div>
        ))
      ) : (
        <div className='text-text-500'>-</div>
      )}
    </section>
  );
}

export function PreludeTextCard({
  card,
}: IPreludeTextCardProps): React.JSX.Element {
  const { t } = useTranslation('seti');
  const translate = (value: string): string =>
    t(value, { defaultValue: value });
  const upperText = [
    card.upperText ? translate(card.upperText) : '',
    card.middleText,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      data-testid={`text-prelude-card-${card.id}`}
      className='flex h-[209px] w-[150px] shrink-0 flex-col overflow-hidden rounded-sm border border-surface-600/70 bg-surface-950/95 font-mono text-[9px] leading-snug text-text-100 shadow-sm'
      style={{ width: '150px', height: '209px' }}
    >
      <div
        data-testid={`text-prelude-card-title-${card.id}`}
        className='flex shrink-0 items-center justify-between gap-1.5 border-b border-surface-700/70 px-2 py-1'
      >
        <span className='truncate text-[11px] font-semibold uppercase tracking-wide text-text-50'>
          {card.id}
        </span>
        <span className='text-[8px] uppercase tracking-wide text-text-400'>
          Prelude
        </span>
      </div>

      <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-1.5'>
        <PreludeTextEffectList
          cardId={card.id}
          label='Upper'
          effects={card.upperEffects}
          testId={`text-prelude-card-upper-${card.id}`}
          translate={translate}
        />
        {upperText ? (
          <section data-testid={`text-prelude-card-middle-${card.id}`}>
            <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-400'>
              Setup
            </div>
            <p className='break-words text-[9px] text-text-100'>
              <DescTextRender desc={upperText} />
            </p>
          </section>
        ) : null}
        <PreludeTextEffectList
          cardId={card.id}
          label='Lower'
          effects={card.lowerEffects}
          testId={`text-prelude-card-lower-${card.id}`}
          translate={translate}
        />
        {card.lowerText ? (
          <section data-testid={`text-prelude-card-note-${card.id}`}>
            <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-400'>
              Note
            </div>
            <p className='break-words text-[9px] text-text-300'>
              <DescTextRender desc={translate(card.lowerText)} />
            </p>
          </section>
        ) : null}
      </div>

      {card.income ? (
        <div
          data-testid={`text-prelude-card-income-${card.id}`}
          className='shrink-0 border-t border-surface-700/70 px-2 py-1 text-[8px] text-text-300'
        >
          <span className='text-text-400'>Income: </span>
          <span className='text-text-100'>{card.income}</span>
        </div>
      ) : null}
    </div>
  );
}
