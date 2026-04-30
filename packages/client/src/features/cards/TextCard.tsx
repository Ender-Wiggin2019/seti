import type { IBaseCard } from '@seti/common/types/BaseCard';
import { EEffectType, type Effect } from '@seti/common/types/effect';
import { useTranslation } from 'react-i18next';

interface ITextCardProps {
  card: IBaseCard;
}

function formatEffect(
  effect: Effect,
  translate: (value: string) => string,
): string {
  switch (effect.effectType) {
    case EEffectType.BASE: {
      const parts: string[] = [];
      if (effect.value != null) {
        parts.push(`${effect.value}x`);
      }
      parts.push(effect.type);
      if (effect.desc) {
        parts.push(`(${translate(effect.desc)})`);
      }
      return parts.join(' ');
    }
    case EEffectType.CUSTOMIZED:
      return translate(effect.desc ?? '');
    case EEffectType.MISSION_QUICK:
    case EEffectType.MISSION_FULL: {
      const missionLines = effect.missions.map((m) => {
        const req = m.req
          .map((r) =>
            r.effectType === EEffectType.BASE
              ? `${r.value ?? ''}${r.type}`
              : translate(r.desc),
          )
          .join(' + ');
        const reward = m.reward
          .map((r) =>
            r.effectType === EEffectType.BASE
              ? `${r.value ?? ''}${r.type}`
              : translate(r.desc),
          )
          .join(' + ');
        return `${req} → ${reward}`;
      });
      const header =
        effect.effectType === EEffectType.MISSION_FULL ? 'MISSION' : 'QUICK';
      return [header, translate(effect.desc ?? ''), ...missionLines]
        .filter(Boolean)
        .join(' | ');
    }
    case EEffectType.END_GAME: {
      const per = effect.per
        ? ` per ${effect.per.value ?? ''}${effect.per.type}`
        : '';
      const score = effect.score != null ? ` (+${effect.score}VP${per})` : '';
      return `END: ${translate(effect.desc ?? '')}${score}`;
    }
    case EEffectType.OR:
      return effect.effects
        .map((nestedEffect) => formatEffect(nestedEffect, translate))
        .join(' OR ');
    default:
      return '?';
  }
}

/**
 * TextCard — a flat, image-free rendering of an IBaseCard used when
 * the debug text mode is enabled. It intentionally mirrors the size
 * envelope of the production CardRender (150px wide) so layout around
 * it is unchanged.
 */
export function TextCard({ card }: ITextCardProps): React.JSX.Element {
  const { t } = useTranslation('seti');
  const freeActions = card.freeAction ?? [];
  const effects = card.effects ?? [];
  const translate = (value: string): string =>
    t(value, { defaultValue: value });

  return (
    <div
      data-testid={`text-card-${card.id}`}
      className='flex w-[150px] flex-col gap-1 rounded-md border border-surface-600/70 bg-surface-950/90 p-2 font-mono text-[10px] leading-tight text-text-100 shadow-sm'
      style={{ minHeight: '209px' }}
    >
      <div className='flex items-center justify-between gap-1 border-b border-surface-700/60 pb-1'>
        <span className='truncate text-[11px] font-semibold uppercase tracking-wider'>
          {translate(card.name)}
        </span>
        <span className='shrink-0 text-[9px] text-text-400'>#{card.id}</span>
      </div>

      <div className='grid grid-cols-2 gap-x-1 gap-y-0.5 text-[9px] uppercase tracking-wide text-text-300'>
        {card.sector && (
          <div className='col-span-2'>
            <span className='text-text-400'>sector: </span>
            <span className='text-text-100'>{card.sector}</span>
          </div>
        )}
        <div>
          <span className='text-text-400'>price: </span>
          <span className='text-text-100'>
            {card.price}
            {card.priceType ? ` ${card.priceType}` : ''}
          </span>
        </div>
        <div>
          <span className='text-text-400'>income: </span>
          <span className='text-text-100'>{card.income}</span>
        </div>
      </div>

      {freeActions.length > 0 && (
        <div className='rounded border border-surface-700/50 bg-surface-900/60 px-1.5 py-1'>
          <div className='text-[9px] uppercase tracking-wide text-text-400'>
            free action
          </div>
          <ul className='mt-0.5 list-disc pl-3 text-[10px] text-text-100'>
            {freeActions.map((action, index) => (
              <li key={`fa-${index}`}>
                {action.value}x {action.type}
              </li>
            ))}
          </ul>
        </div>
      )}

      {effects.length > 0 && (
        <div className='rounded border border-surface-700/50 bg-surface-900/60 px-1.5 py-1'>
          <div className='text-[9px] uppercase tracking-wide text-text-400'>
            effects
          </div>
          <ul className='mt-0.5 list-disc pl-3 text-[10px] text-text-100'>
            {effects.map((effect, index) => (
              <li key={`e-${index}`} className='break-words'>
                {formatEffect(effect, translate)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.description && (
        <p className='text-[9px] italic leading-snug text-text-300'>
          {translate(card.description)}
        </p>
      )}
    </div>
  );
}
