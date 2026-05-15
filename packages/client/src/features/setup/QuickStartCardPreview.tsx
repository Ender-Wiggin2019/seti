import { EffectFactory } from '@seti/cards';
import type { IPreludeCard } from '@seti/common/types/prelude';
import { useTranslation } from 'react-i18next';

interface IQuickStartCardPreviewProps {
  card: IPreludeCard;
  compact?: boolean;
}

function effectSummary(card: IPreludeCard, emptyLabel: string): string {
  const effects = [...card.upperEffects, ...card.lowerEffects]
    .map((effect) => ('type' in effect ? effect.type : undefined))
    .filter(Boolean)
    .join(', ');
  return effects.length > 0 ? effects : emptyLabel;
}

export function QuickStartCardPreview({
  card,
  compact = false,
}: IQuickStartCardPreviewProps): React.JSX.Element {
  const { t: tSeti } = useTranslation('seti');
  const { t: tCommon } = useTranslation('common');
  const upperText = [
    card.upperText ? tSeti(card.upperText) : '',
    card.middleText,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={[
        'grid min-w-0 rounded border border-surface-200/45 bg-surface-950/55 text-left',
        compact ? 'w-24 gap-1 p-1' : 'min-h-24 gap-1.5 p-2',
      ].join(' ')}
      data-testid={`quick-start-card-preview-${card.id}`}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='font-mono text-[10px] uppercase tracking-[0.14em] text-accent-400'>
          {card.id}
        </span>
        <span className='font-mono text-[9px] uppercase tracking-[0.12em] text-text-500'>
          {tCommon('client.quick_start_card.short_label')}
        </span>
      </div>
      {card.upperEffects.length > 0 ? (
        <div className='flex min-h-6 flex-wrap items-center gap-1' aria-hidden>
          {card.upperEffects.map((effect, index) => (
            <EffectFactory key={`${card.id}-upper-${index}`} effect={effect} />
          ))}
        </div>
      ) : null}
      {!compact && upperText ? (
        <p className='line-clamp-2 text-[10px] leading-snug text-text-400'>
          {upperText}
        </p>
      ) : null}
      <div className='flex min-h-6 flex-wrap items-center gap-1' aria-hidden>
        {card.lowerEffects.map((effect, index) => (
          <EffectFactory key={`${card.id}-lower-${index}`} effect={effect} />
        ))}
      </div>
      <span className='sr-only'>
        {tCommon('client.quick_start_card.screen_reader_label', {
          id: card.id,
          summary: effectSummary(
            card,
            tCommon('client.quick_start_card.no_setup_mark'),
          ),
        })}
      </span>
    </div>
  );
}
