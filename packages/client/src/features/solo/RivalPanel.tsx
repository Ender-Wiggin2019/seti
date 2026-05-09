import { DescRender } from '@seti/cards';
import { RIVAL_COMPUTER_SLOT_REWARDS } from '@seti/common/constant/solo';
import { ETech } from '@seti/common/types/element';
import {
  type ETechId,
  getTechDescriptor,
  type TTechCategory,
} from '@seti/common/types/tech';
import {
  type TTraceRewardPresentation,
  toTraceRewardPresentations,
} from '@seti/common/utils/alienTracePresentation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';
import type { IPublicRivalState, TPublicSlotReward } from '@/types/re-exports';
import { RivalActionCardRender } from './RivalActionCard';
import { RivalObjectiveCard } from './RivalObjectiveCard';

interface IRivalPanelProps {
  rival: IPublicRivalState;
  rivalTechs?: readonly ETechId[];
}

const PROGRESS_SLOT_COUNT = 12;
const PROGRESS_SLOT_COLORS = [
  'oklch(0.74 0.14 35)',
  'oklch(0.78 0.13 72)',
  'oklch(0.75 0.11 118)',
  'oklch(0.73 0.12 165)',
  'oklch(0.74 0.12 205)',
  'oklch(0.72 0.13 245)',
  'oklch(0.75 0.12 288)',
  'oklch(0.76 0.13 326)',
  'oklch(0.80 0.11 18)',
  'oklch(0.77 0.10 92)',
  'oklch(0.76 0.10 190)',
  'oklch(0.78 0.09 275)',
];

const TECH_CATEGORY_META: Record<
  TTechCategory,
  {
    testKey: string;
    labelKey: string;
    defaultLabel: string;
    accentClass: string;
  }
> = {
  [ETech.PROBE]: {
    testKey: 'probe',
    labelKey: 'client.rival_panel.tech_probe',
    defaultLabel: 'Probe',
    accentClass: 'border-[oklch(0.72_0.13_45)] text-[oklch(0.82_0.11_58)]',
  },
  [ETech.SCAN]: {
    testKey: 'scan',
    labelKey: 'client.rival_panel.tech_scan',
    defaultLabel: 'Scan',
    accentClass: 'border-[oklch(0.68_0.14_28)] text-[oklch(0.82_0.10_32)]',
  },
  [ETech.COMPUTER]: {
    testKey: 'computer',
    labelKey: 'client.rival_panel.tech_computer',
    defaultLabel: 'Computer',
    accentClass: 'border-[oklch(0.68_0.11_235)] text-[oklch(0.80_0.10_235)]',
  },
};

export function RivalPanel({
  rival,
  rivalTechs = [],
}: IRivalPanelProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const [rulesOpen, setRulesOpen] = useState(false);

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
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 rounded-full text-xs'
          aria-label={t('client.rival_panel.rules', {
            defaultValue: 'Rival rules',
          })}
          data-testid='rival-rules-button'
          onClick={() => setRulesOpen(true)}
        >
          <span aria-hidden>?</span>
        </Button>
        <span className='readout text-[10px] text-text-300'>
          D{rival.difficulty}
        </span>
      </div>

      <div
        className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 p-2'
        data-testid='rival-progress'
      >
        <div className='mb-2 flex items-center justify-between gap-2'>
          <p className='micro-label text-text-500'>
            {t('client.rival_panel.progress', { defaultValue: 'Progress' })}
          </p>
          <span
            className='readout text-xs text-text-100'
            data-testid='rival-progress-total'
          >
            {rival.progress}
          </span>
        </div>
        <RivalProgressCycle progressSlot={rival.progressSlot} />
      </div>

      <div className='grid grid-cols-2 gap-1.5'>
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

      <RivalTechPile techIds={rivalTechs} />

      <div className='space-y-1.5 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 p-2'>
        <div className='flex items-center justify-between gap-2'>
          <span className='micro-label text-text-500'>
            {t('client.rival_panel.current_card', { defaultValue: 'Action' })}
          </span>
          <span className='readout text-[10px] text-text-300'>
            {rival.actionDeck.currentCardId ?? '-'}
          </span>
        </div>
        <div data-testid='rival-current-card'>
          <span className='sr-only'>
            {rival.actionDeck.currentCardId ?? '-'}
          </span>
          <RivalActionCardRender cardId={rival.actionDeck.currentCardId} />
        </div>
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
      <RivalRulesDialog open={rulesOpen} onOpenChange={setRulesOpen} />
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
            <RivalObjectiveCard
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

function RivalProgressCycle({
  progressSlot,
}: {
  progressSlot: number;
}): React.JSX.Element {
  const textMode = useTextMode();
  const activeSlot = normalizeProgressSlot(progressSlot);

  return (
    <div
      className='relative mx-auto h-32 w-32 rounded-full border border-[color:var(--metal-edge-soft)] bg-background-950/55 shadow-hairline-inset'
      data-mode={textMode ? 'text' : 'image'}
      data-layout='radial-cycle'
      data-testid='rival-progress-cycle'
    >
      <span
        aria-hidden
        className='pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--metal-edge-soft)] bg-background-900/70'
      />
      {Array.from({ length: PROGRESS_SLOT_COUNT }, (_, index) => {
        const current = index === activeSlot;
        const color = PROGRESS_SLOT_COLORS[index] ?? PROGRESS_SLOT_COLORS[0];
        const angle = (index * 360) / PROGRESS_SLOT_COUNT - 90;
        return (
          <span
            key={`rival-progress-slot-${index}`}
            className={cn(
              'absolute left-1/2 top-1/2 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] font-semibold tabular-nums transition-transform',
              textMode
                ? 'bg-transparent text-text-200'
                : 'text-background-950 shadow-hairline-inset',
              current && 'z-10 ring-2 ring-accent-300/70',
            )}
            style={{
              backgroundColor: textMode ? 'transparent' : color,
              borderColor: color,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-3.25rem) rotate(${-angle}deg)${
                current ? ' scale(1.12)' : ''
              }`,
            }}
            data-current={current ? 'true' : 'false'}
            data-fill-mode={textMode ? 'border' : 'background'}
            data-testid={`rival-progress-slot-${index}`}
            title={`Progress ${index + 1}`}
          >
            {index + 1}
          </span>
        );
      })}
    </div>
  );
}

function RivalTechPile({
  techIds,
}: {
  techIds: readonly ETechId[];
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const counts = countTechByCategory(techIds);

  return (
    <div
      className='rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/55 p-2'
      data-testid='rival-tech-pile'
    >
      <p className='micro-label mb-1.5 text-text-500'>
        {t('client.rival_panel.tech_pile', { defaultValue: 'Tech pile' })}
      </p>
      <div className='grid grid-cols-3 gap-1'>
        {Object.entries(TECH_CATEGORY_META).map(([category, meta]) => (
          <div
            key={category}
            className={cn(
              'min-w-0 rounded-[4px] border bg-background-950/65 px-1.5 py-1 text-center',
              meta.accentClass,
            )}
          >
            <p className='truncate text-[9px] uppercase'>
              {t(meta.labelKey, { defaultValue: meta.defaultLabel })}
            </p>
            <p
              className='readout text-sm text-text-100'
              data-testid={`rival-tech-count-${meta.testKey}`}
            >
              {counts[category as TTechCategory]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RivalRulesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation('common');
  const title = t('client.rival_panel.rules_title', {
    defaultValue: 'Rival rules',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label={title} data-testid='rival-rules-dialog'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ul className='space-y-2 text-sm leading-relaxed text-text-300'>
          <li>
            {t('client.rival_panel.rules_progress', {
              defaultValue:
                'Rival progress advances around a 12-slot cycle; crossing the deck slot adds advanced action cards.',
            })}
          </li>
          <li>
            {t('client.rival_panel.rules_tech', {
              defaultValue:
                'The tech pile counts Rival-owned Probe, Scan, and Computer tech.',
            })}
          </li>
          <li>
            {t('client.rival_panel.rules_objectives', {
              defaultValue:
                'Rival objectives are public goals; marked tasks move to the completed pile when all tasks are done.',
            })}
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function normalizeProgressSlot(progressSlot: number): number {
  return (
    ((progressSlot % PROGRESS_SLOT_COUNT) + PROGRESS_SLOT_COUNT) %
    PROGRESS_SLOT_COUNT
  );
}

function countTechByCategory(
  techIds: readonly ETechId[],
): Record<TTechCategory, number> {
  const counts: Record<TTechCategory, number> = {
    [ETech.PROBE]: 0,
    [ETech.SCAN]: 0,
    [ETech.COMPUTER]: 0,
  };

  for (const techId of techIds) {
    counts[getTechDescriptor(techId).type] += 1;
  }

  return counts;
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
