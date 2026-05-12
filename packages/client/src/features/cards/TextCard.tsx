import type { IBaseCard, IFreeAction } from '@seti/common/types/BaseCard';
import {
  EEffectType,
  type Effect,
  type IBaseEffect,
  type ICustomizedEffect,
  type IEndGameEffect,
  type IMissionEffect,
} from '@seti/common/types/effect';
import { useTranslation } from 'react-i18next';
import { DescTextRender } from '@/features/cards/DescTextRender';

interface ITextCardProps {
  card: IBaseCard;
}

type TranslateFn = (value: string) => string;

function formatValueType(value: number | undefined, type: string): string {
  return [value == null ? '' : String(value), type].filter(Boolean).join(' ');
}

function formatPriceType(type: string): string {
  if (type === 'credit') return 'C';
  if (type === 'energy') return 'E';
  return type;
}

function formatBaseEffect(effect: IBaseEffect, translate: TranslateFn): string {
  const base = formatValueType(effect.value, effect.type);
  if (!effect.desc) return base;
  return `${base} (${translate(effect.desc)})`;
}

function formatCustomizedEffect(
  effect: ICustomizedEffect,
  translate: TranslateFn,
): string {
  return translate(effect.desc);
}

function formatMissionPart(
  effect: IBaseEffect | ICustomizedEffect,
  translate: TranslateFn,
): string {
  if (effect.effectType === EEffectType.BASE) {
    return formatValueType(effect.value, effect.type);
  }

  return formatCustomizedEffect(effect, translate);
}

function formatEffect(effect: Effect, translate: TranslateFn): string {
  switch (effect.effectType) {
    case EEffectType.BASE:
      return formatBaseEffect(effect, translate);
    case EEffectType.CUSTOMIZED:
      return formatCustomizedEffect(effect, translate);
    case EEffectType.MISSION_QUICK:
    case EEffectType.MISSION_FULL:
      return formatMissionRows(effect, translate).join(' | ');
    case EEffectType.END_GAME: {
      return `END: ${formatEndGameEffect(effect, translate)}`;
    }
    case EEffectType.OR:
      return effect.effects
        .map((nestedEffect) => formatEffect(nestedEffect, translate))
        .join(' OR ');
    default:
      return '?';
  }
}

function formatEndGameEffect(
  effect: IEndGameEffect,
  translate: TranslateFn,
): string {
  const per = effect.per
    ? ` per ${formatValueType(effect.per.value, effect.per.type)}`
    : '';
  const score = effect.score != null ? ` (+${effect.score}VP${per})` : '';
  return `${translate(effect.desc ?? '')}${score}`;
}

function formatMissionRows(
  effect: IMissionEffect,
  translate: TranslateFn,
): string[] {
  const rows = effect.missions.map((mission) => {
    const req = mission.req
      .map((item) => formatMissionPart(item, translate))
      .join(' + ');
    const reward = mission.reward
      .map((item) => formatMissionPart(item, translate))
      .join(' + ');
    return `${req || '-'} -> ${reward || '-'}`;
  });

  return [effect.desc ? translate(effect.desc) : '', ...rows].filter(Boolean);
}

function formatFreeActions(freeActions: IFreeAction[]): string {
  if (freeActions.length === 0) return '-';
  return freeActions
    .map((action) => formatValueType(action.value, action.type))
    .join(' / ');
}

/**
 * TextCard — a flat, image-free rendering of an IBaseCard used when
 * the debug text mode is enabled. It intentionally mirrors the size
 * envelope of the production CardRender (150px by 209px) so layout
 * around it is unchanged.
 */
export function TextCard({ card }: ITextCardProps): React.JSX.Element {
  const { t } = useTranslation('seti');
  const freeActions = card.freeAction ?? [];
  const effects = card.effects ?? [];
  const translate = (value: string): string =>
    t(value, { defaultValue: value });
  const nonMissionEffects = effects.filter(
    (effect) =>
      effect.effectType !== EEffectType.MISSION_QUICK &&
      effect.effectType !== EEffectType.MISSION_FULL &&
      effect.effectType !== EEffectType.END_GAME,
  );
  const missionEffects = effects.filter(
    (effect): effect is IMissionEffect =>
      effect.effectType === EEffectType.MISSION_QUICK ||
      effect.effectType === EEffectType.MISSION_FULL,
  );
  const endGameEffects = effects.filter(
    (effect): effect is IEndGameEffect =>
      effect.effectType === EEffectType.END_GAME,
  );
  const freeActionText = formatFreeActions(freeActions);
  const sectorText = card.sector ?? '-';
  const priceValueText = card.price == null ? '-' : String(card.price);
  const priceTypeText = formatPriceType(card.priceType ?? 'credit');

  return (
    <div
      data-testid={`text-card-${card.id}`}
      className='flex h-[209px] w-[150px] shrink-0 flex-col overflow-hidden rounded-sm border border-surface-600/70 bg-surface-950/95 font-mono text-[9px] leading-snug text-text-100 shadow-sm'
      style={{ width: '150px', height: '209px' }}
    >
      <div
        data-testid={`text-card-title-${card.id}`}
        className='flex shrink-0 items-start gap-1.5 border-b border-surface-700/70 px-2 py-1'
      >
        <div
          data-testid={`text-card-price-${card.id}`}
          className='flex shrink-0 items-baseline gap-0.5 leading-none text-text-50'
        >
          <span
            data-testid={`text-card-price-value-${card.id}`}
            className='text-[15px] font-bold tabular-nums leading-none'
          >
            {priceValueText}
          </span>{' '}
          <span
            data-testid={`text-card-price-type-${card.id}`}
            className='text-[8px] font-semibold uppercase leading-none text-text-300'
          >
            {priceTypeText}
          </span>
        </div>
        <div className='min-w-0 flex-1 pt-0.5'>
          <div
            className='truncate text-[11px] font-semibold uppercase tracking-wide text-text-50'
            title={translate(card.name)}
          >
            {translate(card.name)}
          </div>
        </div>
      </div>

      <div
        data-testid={`text-card-meta-${card.id}`}
        className='shrink-0 space-y-0.5 border-b border-surface-700/60 px-2 py-1 text-[8px] leading-snug text-text-300'
        title={`Free Action: ${freeActionText}\nSector: ${sectorText}`}
      >
        <div
          data-testid={`text-card-free-action-${card.id}`}
          className='truncate'
        >
          <span className='text-text-400'>Free Action: </span>
          <span className='text-text-100'>{freeActionText}</span>
        </div>
        <div data-testid={`text-card-sector-${card.id}`} className='truncate'>
          <span className='text-text-400'>Sector: </span>
          <span className='text-text-100'>{sectorText}</span>
        </div>
      </div>

      <div
        data-testid={`text-card-body-${card.id}`}
        className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1.5'
      >
        <section data-testid={`text-card-effects-${card.id}`}>
          <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-400'>
            Effect:
          </div>
          <div className='space-y-0.5 text-[9px] text-text-100'>
            {nonMissionEffects.length > 0 ? (
              nonMissionEffects.map((effect, index) => (
                <div key={`effect-${index}`} className='break-words'>
                  <DescTextRender desc={formatEffect(effect, translate)} />
                </div>
              ))
            ) : (
              <div className='text-text-500'>-</div>
            )}
          </div>
        </section>

        {missionEffects.length > 0 ? (
          <section
            data-testid={`text-card-missions-${card.id}`}
            className='mt-2 rounded-sm border border-surface-600/70 bg-surface-900/45 px-1.5 py-1'
          >
            <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-200'>
              Mission:
            </div>
            <div className='space-y-0.5 text-[9px] text-text-100'>
              {missionEffects.flatMap((effect, effectIndex) =>
                formatMissionRows(effect, translate).map((row, rowIndex) => (
                  <div
                    key={`mission-${effectIndex}-${rowIndex}`}
                    className='break-words'
                  >
                    <DescTextRender desc={row} />
                  </div>
                )),
              )}
            </div>
          </section>
        ) : null}

        {endGameEffects.length > 0 ? (
          <section
            data-testid={`text-card-end-game-${card.id}`}
            className='mt-2 rounded-sm border border-surface-600/70 bg-surface-900/45 px-1.5 py-1'
          >
            <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-200'>
              End Game:
            </div>
            <div className='space-y-0.5 text-[9px] text-text-100'>
              {endGameEffects.map((effect, index) => (
                <div key={`end-game-${index}`} className='break-words'>
                  <DescTextRender
                    desc={formatEndGameEffect(effect, translate)}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {card.description && (
          <section className='mt-2 border-t border-surface-700/50 pt-1'>
            <div className='mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-text-400'>
              Note:
            </div>
            <p className='break-words text-[9px] italic leading-snug text-text-300'>
              <DescTextRender desc={translate(card.description)} />
            </p>
          </section>
        )}
      </div>

      <div
        data-testid={`text-card-income-${card.id}`}
        className='shrink-0 border-t border-surface-700/70 px-2 py-1 text-[8px] text-text-300'
      >
        <span className='text-text-400'>Income: </span>
        <span className='text-text-100'>{card.income}</span>
      </div>
    </div>
  );
}
