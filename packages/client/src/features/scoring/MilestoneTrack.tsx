import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface IMilestoneItem {
  id: string;
  threshold: number;
  type: 'gold' | 'neutral';
  claimedBy?: string;
}

interface IMilestoneTrackProps {
  milestones: IMilestoneItem[];
}

const TYPE_META: Record<
  IMilestoneItem['type'],
  { labelKey: string; fallback: string; icon: string }
> = {
  gold: {
    labelKey: 'client.milestone.type_gold',
    fallback: 'GOLD',
    icon: '/assets/seti/icons/vp.png',
  },
  neutral: {
    labelKey: 'client.milestone.type_neutral',
    fallback: 'NEUTRAL',
    icon: '/assets/seti/icons/dangerThreshold1.png',
  },
};

export function MilestoneTrack({
  milestones,
}: IMilestoneTrackProps): React.JSX.Element {
  const { t } = useTranslation('common');
  if (milestones.length === 0) {
    return (
      <p className='font-mono text-[10px] tracking-[0.08em] text-text-500'>
        {t('client.milestone.empty')}
      </p>
    );
  }

  const sorted = milestones
    .slice()
    .sort((left, right) => left.threshold - right.threshold);

  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-2'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>{t('client.milestone.title')}</p>
        <div aria-hidden className='section-head__rule' />
        <span className='font-mono text-[10px] tabular-nums text-text-500'>
          {sorted.filter((m) => m.claimedBy).length}/{sorted.length}
        </span>
      </div>

      <div className='flex flex-wrap gap-1.5'>
        {sorted.map((milestone) => {
          const meta = TYPE_META[milestone.type];
          const claimed = Boolean(milestone.claimedBy);
          return (
            <div
              key={milestone.id}
              className={cn(
                'min-w-[72px] rounded-[4px] border px-2 py-1',
                claimed
                  ? [
                      'border-accent-500/60 bg-accent-500/[0.07]',
                      'shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.22),inset_0_0_0_1px_oklch(0.68_0.11_240/0.18)]',
                    ]
                  : [
                      'border-[color:var(--metal-edge-soft)] bg-background-900/70',
                      'shadow-hairline-inset',
                    ],
              )}
            >
              <div className='flex items-center gap-1'>
                <img
                  src={meta.icon}
                  alt=''
                  aria-hidden
                  className='h-3.5 w-3.5 shrink-0 opacity-95'
                />
                <span className='readout text-xs font-semibold text-text-100 leading-none'>
                  {milestone.threshold}
                </span>
                <span className='ml-auto font-mono text-[8px] uppercase tracking-[0.14em] text-text-500'>
                  {t(meta.labelKey, { defaultValue: meta.fallback })}
                </span>
              </div>
              <p
                className={cn(
                  'mt-0.5 truncate font-mono text-[10px] tracking-[0.06em]',
                  claimed ? 'text-text-200' : 'text-text-500',
                )}
              >
                {milestone.claimedBy ?? t('client.milestone.open')}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export type { IMilestoneItem };
