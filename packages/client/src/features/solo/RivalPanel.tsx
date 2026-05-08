import { DescRender } from '@seti/cards';
import {
  RIVAL_COMPUTER_SLOT_REWARDS,
  RIVAL_OBJECTIVE_DEFINITIONS,
} from '@seti/common/constant/solo';
import {
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPublicRivalState, TPublicSlotReward } from '@/types/re-exports';

interface IRivalPanelProps {
  rival: IPublicRivalState;
}

const OBJECTIVE_BY_ID = new Map(
  RIVAL_OBJECTIVE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function RivalPanel({ rival }: IRivalPanelProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <section
      className='instrument-panel space-y-3 p-3'
      data-testid='rival-panel'
    >
      <div className='section-head'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.rival_panel.title', { defaultValue: 'Rival Institution' })}
        </p>
        <div aria-hidden className='section-head__rule' />
        <span className='readout text-[10px] text-text-300'>
          D{rival.difficulty}
        </span>
      </div>

      <div className='grid grid-cols-3 gap-1.5'>
        <RivalReadout
          label={t('client.rival_panel.progress', { defaultValue: 'Progress' })}
          testId='rival-progress'
        >
          <img
            src='/assets/seti/icons/progress.png'
            alt=''
            aria-hidden
            className='h-4 w-4'
            data-testid='rival-progress-icon'
          />
          {rival.progress}
        </RivalReadout>
        <RivalReadout
          label={t('client.rival_panel.draw', { defaultValue: 'Draw' })}
          testId='rival-deck-draw'
        >
          {rival.actionDeck.drawPileSize}
        </RivalReadout>
        <RivalReadout
          label={t('client.rival_panel.discard', { defaultValue: 'Discard' })}
          testId='rival-deck-discard'
        >
          {rival.actionDeck.discardPileSize}
        </RivalReadout>
      </div>

      <div className='flex items-center justify-between gap-2 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 px-2 py-1.5'>
        <span className='micro-label text-text-500'>
          {t('client.rival_panel.current_card', { defaultValue: 'Action' })}
        </span>
        <span
          className='readout text-xs text-text-100'
          data-testid='rival-current-card'
        >
          {rival.actionDeck.currentCardId ?? '-'}
        </span>
      </div>

      <RivalObjectives rival={rival} />

      <div className='space-y-1.5'>
        <div className='flex items-center justify-between'>
          <span className='micro-label text-text-500'>
            {t('client.rival_panel.computer', { defaultValue: 'Computer' })}
          </span>
          <span className='readout text-[10px] text-text-300'>
            {t('client.rival_panel.data_pool', {
              count: rival.computer.dataPool,
              defaultValue: 'Pool {{count}}',
            })}
          </span>
        </div>
        <div className='grid grid-cols-6 gap-1' data-testid='rival-computer'>
          {rival.computer.filledSlots.map((filled, index) => (
            <RivalComputerSlot
              key={`rival-computer-${index}`}
              filled={filled}
              reward={RIVAL_COMPUTER_SLOT_REWARDS[index] ?? null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RivalObjectives({
  rival,
}: {
  rival: IPublicRivalState;
}): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-1.5' data-testid='rival-objectives'>
      <div className='flex items-center justify-between'>
        <span className='micro-label text-text-500'>
          {t('client.rival_panel.objectives', { defaultValue: 'Objectives' })}
        </span>
        <span className='readout text-[10px] text-text-300'>
          {t('client.rival_panel.objectives_completed', {
            count: rival.completedObjectiveIds.length,
            defaultValue: 'Done {{count}}',
          })}
        </span>
      </div>

      {rival.revealedObjectiveIds.length > 0 ? (
        <div className='grid grid-cols-3 gap-1'>
          {rival.revealedObjectiveIds.map((objectiveId) => (
            <RivalObjectiveTile
              key={objectiveId}
              objectiveId={objectiveId}
              markedTaskIndexes={rival.objectiveTaskMarkers[objectiveId] ?? []}
            />
          ))}
        </div>
      ) : (
        <div className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-950/65 px-2 py-1 text-center micro-label text-text-500'>
          {t('client.rival_panel.no_objectives', { defaultValue: 'None' })}
        </div>
      )}

      <div
        className='flex min-h-6 items-center gap-1 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-950/65 px-2 py-1'
        data-testid='rival-completed-objectives'
      >
        {rival.completedObjectiveIds.length > 0 ? (
          rival.completedObjectiveIds.map((objectiveId) => (
            <span
              key={`completed-${objectiveId}`}
              className='readout text-[10px] text-accent-200'
            >
              {objectiveId}
            </span>
          ))
        ) : (
          <span className='micro-label text-text-600'>
            {t('client.rival_panel.no_completed_objectives', {
              defaultValue: 'No completed objectives',
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function RivalObjectiveTile({
  objectiveId,
  markedTaskIndexes,
}: {
  objectiveId: IPublicRivalState['revealedObjectiveIds'][number];
  markedTaskIndexes: number[];
}): React.JSX.Element {
  const definition = OBJECTIVE_BY_ID.get(objectiveId);
  const taskCount = Math.max(definition?.tasks.length ?? 1, 1);
  const markedCount = Math.min(markedTaskIndexes.length, taskCount);

  return (
    <div
      className='min-w-0 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 p-1.5'
      data-testid={`rival-objective-${objectiveId}`}
    >
      <div className='mb-1 flex items-center justify-between gap-1'>
        <span className='truncate readout text-[10px] text-text-100'>
          {objectiveId}
        </span>
        <span className='readout text-[10px] text-text-300'>
          {markedCount}/{taskCount}
        </span>
      </div>
      <div className='flex gap-1' aria-hidden>
        {Array.from({ length: taskCount }, (_, index) => (
          <span
            key={`${objectiveId}-task-${index}`}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              markedTaskIndexes.includes(index)
                ? 'bg-accent-400'
                : 'bg-background-700',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function RivalReadout({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 p-2'>
      <p className='micro-label mb-1 text-text-500'>{label}</p>
      <div
        className='flex items-center gap-1.5 readout text-sm text-text-100'
        data-testid={testId}
      >
        {children}
      </div>
    </div>
  );
}

function RivalComputerSlot({
  filled,
  reward,
}: {
  filled: boolean;
  reward: TPublicSlotReward | null;
}): React.JSX.Element {
  const presentations = reward ? toTraceRewardPresentations([reward]) : [];

  return (
    <div
      className={cn(
        'flex h-8 items-center justify-center rounded-[4px] border shadow-hairline-inset',
        filled
          ? 'border-accent-500/70 bg-accent-500/10'
          : 'border-[color:var(--metal-edge-soft)] bg-background-950/65',
      )}
    >
      {filled ? (
        <img
          src='/assets/seti/tokens/data.png'
          alt=''
          aria-hidden
          className='h-5 w-5'
          data-testid='rival-computer-data'
        />
      ) : (
        presentations.map((presentation, index) => (
          <RivalRewardIcon
            key={`${presentation.token}-${index}`}
            presentation={presentation}
          />
        ))
      )}
    </div>
  );
}

function RivalRewardIcon({
  presentation,
}: {
  presentation: TTraceRewardPresentation;
}): React.JSX.Element {
  const testKey = presentation.token.replace(/[{}]/g, '');

  if (presentation.kind === 'text') {
    return (
      <span
        className='max-w-7 truncate font-mono text-[8px] uppercase text-text-300'
        data-testid={`rival-reward-${testKey}`}
        title={presentation.label}
      >
        {presentation.text}
      </span>
    );
  }

  return (
    <span
      className='inline-flex h-5 w-5 items-center justify-center overflow-visible'
      data-testid={`rival-reward-${testKey}`}
      title={presentation.label}
    >
      <DescRender desc={presentation.token} size='desc-mini' smartSize />
    </span>
  );
}
