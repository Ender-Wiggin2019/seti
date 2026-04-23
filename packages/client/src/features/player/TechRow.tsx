import { ETech } from '@seti/common/types/element';
import { ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { getTechPresentation } from '@seti/common/types/techPresentation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useTextMode } from '@/stores/debugStore';

interface ITechRowProps {
  techs: ETechId[];
}

interface ITechSlotConfig {
  /** Tech that activates this slot. `null` means slot is always enabled (base ability). */
  techId: ETechId | null;
  i18nKey: string;
  fallback: string;
  /** Label shown before the tech is researched (for always-on tech-gated slots). */
  baseI18nKey?: string;
  baseFallback?: string;
  /** Optional image path for base slots that do not map to tech IDs. */
  baseImage?: string;
  /** Optional image path shown before tech is researched. */
  preTechImage?: string;
  /** Whether slot should render as active before the tech is researched. */
  alwaysOn?: boolean;
}

const LAUNCH_SLOTS: ITechSlotConfig[] = [
  // Board-slot order (left -> right): L2, L1, L3, L4.
  {
    techId: ETechId.PROBE_ASTEROID,
    i18nKey: getTechPresentation(ETechId.PROBE_ASTEROID).i18nKey,
    fallback: getTechPresentation(ETechId.PROBE_ASTEROID).fallback,
  },
  {
    techId: ETechId.PROBE_DOUBLE_PROBE,
    i18nKey: getTechPresentation(ETechId.PROBE_DOUBLE_PROBE).i18nKey,
    fallback: getTechPresentation(ETechId.PROBE_DOUBLE_PROBE).fallback,
  },
  {
    techId: ETechId.PROBE_ROVER_DISCOUNT,
    i18nKey: getTechPresentation(ETechId.PROBE_ROVER_DISCOUNT).i18nKey,
    fallback: getTechPresentation(ETechId.PROBE_ROVER_DISCOUNT).fallback,
  },
  {
    techId: ETechId.PROBE_MOON,
    i18nKey: getTechPresentation(ETechId.PROBE_MOON).i18nKey,
    fallback: getTechPresentation(ETechId.PROBE_MOON).fallback,
  },
];

const SCAN_SLOTS: ITechSlotConfig[] = [
  // Board-slot order (left -> right): base-earth, base-card-row, L2, L3, L4.
  // Tech image order follows tech pile levels: Look1 -> Look2 -> Look3 -> Look4.
  {
    techId: ETechId.SCAN_EARTH_LOOK,
    i18nKey: getTechPresentation(ETechId.SCAN_EARTH_LOOK).i18nKey,
    fallback: getTechPresentation(ETechId.SCAN_EARTH_LOOK).fallback,
    baseI18nKey: 'client.tech_row.scan.earth_base',
    baseFallback: 'Earth',
    preTechImage: '/assets/seti/icons/signalToken.png',
    alwaysOn: true,
  },
  {
    techId: null,
    i18nKey: 'client.tech_row.scan.card_row',
    fallback: 'Card Row',
    baseImage: '/assets/seti/icons/signalToken.png',
    alwaysOn: true,
  },
  {
    techId: ETechId.SCAN_POP_SIGNAL,
    i18nKey: getTechPresentation(ETechId.SCAN_POP_SIGNAL).i18nKey,
    fallback: getTechPresentation(ETechId.SCAN_POP_SIGNAL).fallback,
  },
  {
    techId: ETechId.SCAN_HAND_SIGNAL,
    i18nKey: getTechPresentation(ETechId.SCAN_HAND_SIGNAL).i18nKey,
    fallback: getTechPresentation(ETechId.SCAN_HAND_SIGNAL).fallback,
  },
  {
    techId: ETechId.SCAN_ENERGY_LAUNCH,
    i18nKey: getTechPresentation(ETechId.SCAN_ENERGY_LAUNCH).i18nKey,
    fallback: getTechPresentation(ETechId.SCAN_ENERGY_LAUNCH).fallback,
  },
];

function getTechTileImage(techId: ETechId): string {
  const descriptor = getTechDescriptor(techId);
  const { type, level } = descriptor;
  if (type === ETech.PROBE) {
    if (level === 0) return '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp';
    if (level === 2) return '/assets/seti/tech/tiles/techFly3_SE0.2.jpg';
    return `/assets/seti/tech/tiles/techFly${level + 1}.webp`;
  }
  if (type === ETech.SCAN) {
    if (level === 2) return '/assets/seti/tech/tiles/techLook3_SE0.1.webp';
    if (level === 3) return '/assets/seti/tech/tiles/techLook4_SE0.4.jpg';
    return `/assets/seti/tech/tiles/techLook${level + 1}.webp`;
  }
  return `/assets/seti/tech/tiles/techComp${level + 1}.webp`;
}

interface ITechSlotProps {
  slot: ITechSlotConfig;
  acquired: boolean;
  level: number | null;
}

function TechSlot({
  slot,
  acquired,
  level,
}: ITechSlotProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const textMode = useTextMode();
  const acquiredTech = slot.techId !== null && acquired;
  const enabled = slot.alwaysOn === true ? true : acquiredTech;
  const label = acquiredTech
    ? t(slot.i18nKey, { defaultValue: slot.fallback })
    : t(slot.baseI18nKey ?? slot.i18nKey, {
        defaultValue: slot.baseFallback ?? slot.fallback,
      });
  const imagePath = acquiredTech
    ? getTechTileImage(slot.techId as ETechId)
    : (slot.preTechImage ?? slot.baseImage ?? null);

  return (
    <div
      className={cn(
        'group relative flex h-[82px] min-w-0 flex-1 flex-col items-center gap-1 rounded-[3px] border px-1 py-1 transition-colors',
        enabled
          ? [
              'border-[color:var(--metal-edge)] bg-[oklch(0.13_0.022_260/0.85)]',
              'shadow-[inset_0_1px_0_oklch(0.96_0.008_260/0.10)]',
            ]
          : [
              'border-[color:var(--metal-edge-soft)] bg-background-950/70',
              'shadow-hairline-inset',
            ],
      )}
      data-active={enabled}
      title={label}
    >
      {!textMode && imagePath ? (
        <div
          className={cn(
            'flex h-[46px] w-full items-center justify-center overflow-hidden rounded-[2px] border',
            enabled
              ? 'border-[color:var(--metal-edge-soft)] bg-background-950/65'
              : 'border-[color:var(--metal-edge-soft)] bg-background-950/35',
          )}
        >
          <img
            src={imagePath}
            alt=''
            aria-hidden
            className={cn(
              'h-full w-full object-cover transition-[filter,opacity]',
              enabled ? 'opacity-95' : 'opacity-35 grayscale',
            )}
            loading='lazy'
            draggable={false}
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex h-[46px] w-full items-center justify-center rounded-[2px] border px-1',
            enabled
              ? 'border-[color:var(--metal-edge-soft)] bg-background-950/65'
              : 'border-[color:var(--metal-edge-soft)] bg-background-950/35',
          )}
        >
          <span
            className={cn(
              'line-clamp-2 text-center font-mono text-[9px] uppercase tracking-[0.08em]',
              enabled ? 'text-text-200' : 'text-text-500/60',
            )}
          >
            {label}
          </span>
        </div>
      )}
      <span
        className={cn(
          'line-clamp-2 text-center font-mono text-[8px] leading-tight tracking-[0.04em]',
          enabled ? 'text-text-300' : 'text-text-500/60',
        )}
      >
        {label}
      </span>
      {acquired && level !== null ? (
        <span
          aria-hidden
          className='absolute right-0.5 top-0.5 rounded-[2px] border border-accent-500/70 bg-accent-500/20 px-1 font-mono text-[8px] font-semibold leading-none text-accent-300'
        >
          L{level + 1}
        </span>
      ) : null}
    </div>
  );
}

interface ITechGroupProps {
  headerLabel: string;
  headerImage: string;
  slots: ITechSlotConfig[];
  acquiredTechs: Set<ETechId>;
  techLevels: Map<ETechId, number>;
  testId: string;
}

function TechGroup({
  headerLabel,
  headerImage,
  slots,
  acquiredTechs,
  techLevels,
  testId,
}: ITechGroupProps): React.JSX.Element {
  const textMode = useTextMode();
  return (
    <div
      data-testid={testId}
      className='flex min-w-0 flex-1 items-stretch gap-1 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/50 p-1'
    >
      <div
        className='flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-950/70 px-0.5 py-1'
        title={headerLabel}
      >
        {!textMode ? (
          <img
            src={headerImage}
            alt=''
            aria-hidden
            className='h-4 w-4 object-contain opacity-90'
            loading='lazy'
            draggable={false}
          />
        ) : null}
        <span className='text-center font-mono text-[8px] uppercase tracking-[0.08em] text-text-300'>
          {headerLabel}
        </span>
      </div>
      <div className='flex min-w-0 flex-1 items-stretch gap-1'>
        {slots.map((slot, i) => (
          <TechSlot
            key={`${testId}-${slot.techId ?? 'base'}-${i}`}
            slot={slot}
            acquired={slot.techId !== null && acquiredTechs.has(slot.techId)}
            level={
              slot.techId !== null
                ? (techLevels.get(slot.techId) ?? null)
                : null
            }
          />
        ))}
      </div>
    </div>
  );
}

/**
 * TechRow — launch + scan rows on personal board.
 *
 * In image mode, every slot uses a tech-related tile image and switches
 * between dimmed (not researched) and bright (researched).
 */
export function TechRow({ techs }: ITechRowProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const acquired = new Set(techs);
  const levels = new Map<ETechId, number>();
  for (const id of techs) {
    levels.set(id, getTechDescriptor(id).level);
  }

  return (
    <section data-testid='tech-row' className='instrument-panel p-1.5'>
      <div className='section-head mb-1'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.tech_display.title', { defaultValue: 'Tech Slots' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>
      <div className='flex items-stretch gap-1.5'>
        <TechGroup
          testId='tech-group-launch'
          headerLabel={t('client.tech_row.types.launch', {
            defaultValue: 'Launch',
          })}
          headerImage='/assets/seti/icons/launch.png'
          slots={LAUNCH_SLOTS}
          acquiredTechs={acquired}
          techLevels={levels}
        />
        <TechGroup
          testId='tech-group-scan'
          headerLabel={t('client.tech_row.types.scan', {
            defaultValue: 'Scan',
          })}
          headerImage='/assets/seti/icons/look.png'
          slots={SCAN_SLOTS}
          acquiredTechs={acquired}
          techLevels={levels}
        />
      </div>
    </section>
  );
}
