import { IconFactory } from '@seti/cards';
import {
  EResource,
  EScanAction,
  ESector,
  ESpecialAction,
  type IIconItem,
  type TIcon,
} from '@seti/common/types/element';
import { ETechId, getTechDescriptor } from '@seti/common/types/tech';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface ITechRowProps {
  techs: ETechId[];
}

interface ITechSlotConfig {
  /** Tech that activates this slot. `null` means slot is always enabled (base ability). */
  techId: ETechId | null;
  i18nKey: string;
  fallback: string;
  /** Primary icon drawn from the cards-package sprite sheet. */
  icon: TIcon;
}

const LAUNCH_SLOTS: ITechSlotConfig[] = [
  {
    techId: ETechId.PROBE_DOUBLE_PROBE,
    i18nKey: 'client.tech_row.launch.double_probe',
    fallback: 'Launch +1',
    icon: ESpecialAction.LAUNCH,
  },
  {
    techId: ETechId.PROBE_ASTEROID,
    i18nKey: 'client.tech_row.launch.asteroid',
    fallback: 'Asteroid +★',
    icon: EResource.PUBLICITY,
  },
  {
    techId: ETechId.PROBE_ROVER_DISCOUNT,
    i18nKey: 'client.tech_row.launch.land_discount',
    fallback: 'Land −1⚡',
    icon: ESpecialAction.LAND,
  },
  {
    techId: ETechId.PROBE_MOON,
    i18nKey: 'client.tech_row.launch.moon',
    fallback: 'Moon Landing',
    icon: ESpecialAction.LAND,
  },
];

const SCAN_SLOTS: ITechSlotConfig[] = [
  {
    techId: null,
    i18nKey: 'client.tech_row.scan.earth',
    fallback: 'Earth (or adj.)',
    icon: ESector.RED,
  },
  {
    techId: null,
    i18nKey: 'client.tech_row.scan.card_row',
    fallback: 'Card Row',
    icon: EScanAction.DISPLAY_CARD,
  },
  {
    techId: ETechId.SCAN_POP_SIGNAL,
    i18nKey: 'client.tech_row.scan.mercury',
    fallback: 'Mercury (−★)',
    icon: EResource.PUBLICITY,
  },
  {
    techId: ETechId.SCAN_HAND_SIGNAL,
    i18nKey: 'client.tech_row.scan.discard_card',
    fallback: 'Discard Card',
    icon: EScanAction.DISCARD_CARD,
  },
  {
    techId: ETechId.SCAN_ENERGY_LAUNCH,
    i18nKey: 'client.tech_row.scan.energy_launch',
    fallback: 'Move / Launch',
    icon: EResource.MOVE,
  },
];

function makeIconItem(icon: TIcon): IIconItem {
  return {
    type: icon,
    value: 1,
    options: { size: 'xs' },
  };
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
  const isAlwaysOn = slot.techId === null;
  const enabled = acquired || isAlwaysOn;
  const label = t(slot.i18nKey, { defaultValue: slot.fallback });

  return (
    <div
      className={cn(
        'group relative flex h-[60px] min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[3px] border px-1 py-1 transition-colors',
        enabled
          ? [
              'border-[color:var(--metal-edge)] bg-[oklch(0.13_0.022_260/0.85)]',
              'shadow-[inset_0_1px_0_oklch(0.96_0.008_260/0.10)]',
            ]
          : [
              'border-[color:var(--metal-edge-soft)] bg-background-950/60',
              'shadow-hairline-inset',
            ],
      )}
      data-active={enabled}
      title={label}
    >
      <div
        className={cn(
          'flex h-[26px] items-center justify-center',
          enabled ? 'opacity-95' : 'opacity-25 grayscale',
        )}
      >
        <IconFactory iconItem={makeIconItem(slot.icon)} />
      </div>
      <span
        className={cn(
          'mt-0.5 line-clamp-2 text-center font-mono text-[8px] leading-tight tracking-[0.04em]',
          enabled ? 'text-text-200' : 'text-text-500/60',
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
  headerIcon: TIcon;
  headerLabel: string;
  slots: ITechSlotConfig[];
  acquiredTechs: Set<ETechId>;
  techLevels: Map<ETechId, number>;
  testId: string;
}

function TechGroup({
  headerIcon,
  headerLabel,
  slots,
  acquiredTechs,
  techLevels,
  testId,
}: ITechGroupProps): React.JSX.Element {
  return (
    <div
      data-testid={testId}
      className='flex min-w-0 flex-1 items-stretch gap-1 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/50 p-1'
    >
      <div
        className='flex w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-950/70 px-0.5 py-1'
        title={headerLabel}
      >
        <IconFactory
          iconItem={{
            type: headerIcon,
            value: 1,
            options: { size: 'sm' },
          }}
        />
        <span className='font-mono text-[8px] uppercase tracking-[0.08em] text-text-300'>
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
 * TechRow — the player board's second row.
 *
 * Two horizontal groups (Launch / Scan) each headed by an action glyph
 * pulled from the shared cards-package sprite sheet. Tech-bound slots
 * remain visible when the tech hasn't been researched yet, but render
 * dimmed so the player can still see the future capability.
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
          headerIcon={ESpecialAction.LAUNCH}
          headerLabel={t('client.tech_row.types.launch', {
            defaultValue: 'Launch',
          })}
          slots={LAUNCH_SLOTS}
          acquiredTechs={acquired}
          techLevels={levels}
        />
        <TechGroup
          testId='tech-group-scan'
          headerIcon={ESpecialAction.SCAN}
          headerLabel={t('client.tech_row.types.scan', {
            defaultValue: 'Scan',
          })}
          slots={SCAN_SLOTS}
          acquiredTechs={acquired}
          techLevels={levels}
        />
      </div>
    </section>
  );
}
