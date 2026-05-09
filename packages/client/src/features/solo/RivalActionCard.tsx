import { DescRender } from '@seti/cards';
import {
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type { TPublicSlotReward, TRivalActionCardId } from '@/types/re-exports';
import {
  formatRivalActionCandidate,
  formatRivalActionCardTier,
  formatRivalDecisionDirection,
  getRivalActionCardDefinition,
  getRivalActionCardImageSrc,
} from './rivalActionCardPresentation';

interface IRivalActionCardRenderProps {
  cardId: TRivalActionCardId | null;
  compact?: boolean;
  className?: string;
}

export function RivalActionCardRender({
  cardId,
  compact = false,
  className,
}: IRivalActionCardRenderProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const textMode = useTextMode();

  if (!cardId) {
    return (
      <div
        className={cn(
          'rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-950/65 px-2 py-1 text-center micro-label text-text-600',
          className,
        )}
      >
        {t('client.rival_panel.no_current_card', { defaultValue: 'No card' })}
      </div>
    );
  }

  const definition = getRivalActionCardDefinition(cardId);
  const imageSrc = getRivalActionCardImageSrc(cardId);

  return (
    <div
      className={cn('min-w-0', className)}
      data-testid={`rival-action-card-render-${cardId}`}
    >
      {!textMode && imageSrc ? (
        <img
          src={imageSrc}
          alt={t('client.rival_action_card.image_alt', {
            card: cardId,
            defaultValue: 'Rival action card {{card}}',
          })}
          className={cn(
            'mx-auto rounded-[5px] border border-[color:var(--metal-edge-soft)] object-cover shadow-hairline-inset',
            compact ? 'max-h-44 w-full max-w-32' : 'w-full max-w-44',
          )}
          data-testid={`rival-action-card-image-${cardId}`}
          loading='lazy'
        />
      ) : (
        <RivalActionTextCard
          cardId={cardId}
          definition={definition}
          compact={compact}
        />
      )}
    </div>
  );
}

function RivalActionTextCard({
  cardId,
  definition,
  compact,
}: {
  cardId: TRivalActionCardId;
  definition: ReturnType<typeof getRivalActionCardDefinition>;
  compact: boolean;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <article
      className={cn(
        'min-w-0 rounded-[5px] border border-[color:var(--metal-edge-soft)] bg-background-950/80 p-2 shadow-hairline-inset',
        compact ? 'space-y-1.5' : 'space-y-2',
      )}
      data-testid={`rival-action-card-text-${cardId}`}
    >
      <header className='flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <p className='readout text-xs text-text-100'>{cardId}</p>
          <p className='micro-label truncate text-text-500'>
            {definition
              ? formatRivalActionCardTier(definition.deckTier, t)
              : t('client.rival_action_card.unknown', {
                  defaultValue: 'Unknown card',
                })}
          </p>
        </div>
        {definition ? (
          <span className='rounded-full border border-[color:var(--metal-edge-soft)] px-1.5 py-0.5 text-[9px] uppercase text-text-400'>
            {formatRivalDecisionDirection(definition.decisionDirection, t)}
          </span>
        ) : null}
      </header>

      {definition ? (
        <ol className='space-y-1'>
          {definition.candidates.map((candidate, index) => (
            <li
              key={`${cardId}-candidate-${index}`}
              className='rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-900/60 px-1.5 py-1'
            >
              <p className='text-[11px] leading-snug text-text-200'>
                {formatRivalActionCandidate(candidate, t)}
              </p>
              {candidate.effects?.length ? (
                <RivalCandidateEffects effects={candidate.effects} />
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

function RivalCandidateEffects({
  effects,
}: {
  effects: readonly TPublicSlotReward[];
}): React.JSX.Element {
  const presentations = toTraceRewardPresentations(effects);

  return (
    <div className='mt-1 flex flex-wrap gap-1'>
      {presentations.map((presentation, index) => (
        <RivalEffectIcon
          key={`${presentation.token}-${index}`}
          presentation={presentation}
        />
      ))}
    </div>
  );
}

function RivalEffectIcon({
  presentation,
}: {
  presentation: TTraceRewardPresentation;
}): React.JSX.Element {
  if (presentation.kind === 'text') {
    return (
      <span
        className='rounded-[3px] border border-[color:var(--metal-edge-soft)] px-1 font-mono text-[9px] uppercase text-text-300'
        title={presentation.label}
      >
        {presentation.text}
      </span>
    );
  }

  return (
    <span
      className='inline-flex h-5 w-5 items-center justify-center overflow-visible rounded-[3px] border border-[color:var(--metal-edge-soft)]'
      title={presentation.label}
    >
      <DescRender desc={presentation.token} size='desc-mini' smartSize />
    </span>
  );
}
