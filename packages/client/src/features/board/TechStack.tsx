import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import type { IPublicTechStack } from '@/types/re-exports';
import { ETech } from '@/types/re-exports';

const TECH_TYPE_I18N_KEY: Record<ETech, string> = {
  [ETech.ANY]: 'any',
  [ETech.PROBE]: 'probe',
  [ETech.SCAN]: 'scan',
  [ETech.COMPUTER]: 'computer',
};

function getTechTileImage(tech: ETech, level: number): string {
  if (tech === ETech.PROBE) {
    if (level === 0) return '/assets/seti/tech/tiles/techFly1_SE.0.0.3.webp';
    if (level === 2) return '/assets/seti/tech/tiles/techFly3_SE0.2.jpg';
    return `/assets/seti/tech/tiles/techFly${level + 1}.webp`;
  }
  if (tech === ETech.SCAN) {
    if (level === 2) return '/assets/seti/tech/tiles/techLook3_SE0.1.webp';
    if (level === 3) return '/assets/seti/tech/tiles/techLook4_SE0.4.jpg';
    return `/assets/seti/tech/tiles/techLook${level + 1}.webp`;
  }
  return `/assets/seti/tech/tiles/techComp${level + 1}.webp`;
}

const TECH_BONUS_META: Partial<
  Record<ETechBonusType, { src?: string; label: string; shortLabel: string }>
> = {
  [ETechBonusType.ENERGY]: {
    src: '/assets/seti/tech/bonuses/tech1.png',
    label: 'Energy bonus',
    shortLabel: '+E',
  },
  [ETechBonusType.DATA]: {
    src: '/assets/seti/tech/bonuses/data.png',
    label: 'Data bonus',
    shortLabel: '+D',
  },
  [ETechBonusType.PUBLICITY]: {
    src: '/assets/seti/tech/bonuses/tech3.png',
    label: 'Publicity bonus',
    shortLabel: '+P',
  },
  [ETechBonusType.CARD]: {
    src: '/assets/seti/tech/bonuses/tech4.png',
    label: 'Card bonus',
    shortLabel: '+C',
  },
  [ETechBonusType.VP_3]: {
    src: '/assets/seti/tech/bonuses/tech6.png',
    label: '3 VP bonus',
    shortLabel: '+3',
  },
  [ETechBonusType.LAUNCH_IGNORE_LIMIT]: {
    src: '/assets/seti/tech/bonuses/launch.png',
    label: 'Launch action bonus',
    shortLabel: 'L',
  },
  [ETechBonusType.DATA_2]: {
    src: '/assets/seti/tech/bonuses/data.png',
    label: '2 data bonus',
    shortLabel: '+2D',
  },
  [ETechBonusType.CREDIT]: {
    label: 'Credit bonus',
    shortLabel: '+$',
  },
  [ETechBonusType.VP_2]: {
    label: '2 VP bonus',
    shortLabel: '+2',
  },
};

function getTechBonusMeta(bonus: ITechBonusToken): {
  src?: string;
  label: string;
  shortLabel: string;
} {
  return (
    TECH_BONUS_META[bonus.type] ?? {
      label: `${bonus.type} bonus`,
      shortLabel: bonus.type,
    }
  );
}

interface ITechStackProps {
  stack: IPublicTechStack;
  ownerPlayerIds: string[];
  playerColors: Record<string, string>;
  isSelectable: boolean;
  onSelect?: () => void;
}

export function TechStack({
  stack,
  ownerPlayerIds,
  playerColors,
  isSelectable,
  onSelect,
}: ITechStackProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const techName = t(
    `client.tech_stack.types.${TECH_TYPE_I18N_KEY[stack.tech]}`,
  );
  const isInteractive = isSelectable && onSelect !== undefined;
  return (
    <article
      data-testid={`tech-stack-${stack.tech}-${stack.level}`}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onSelect : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-md border border-surface-700/50 bg-surface-900/60 p-2 transition-colors',
        isSelectable && 'border-accent-500 ring-1 ring-accent-500/70',
        isInteractive &&
          'cursor-pointer hover:bg-surface-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
      )}
    >
      <div className='flex items-center justify-between'>
        <h3 className='font-mono text-xs font-semibold uppercase tracking-wider text-text-200'>
          {techName} L{stack.level + 1}
        </h3>
        <span className='font-mono text-[10px] text-text-500'>
          x{stack.remainingTiles}
        </span>
      </div>

      <div className='mt-2 grid grid-cols-[minmax(3.25rem,4.5rem),1fr] gap-2'>
        <img
          src={getTechTileImage(stack.tech, stack.level)}
          alt={t('client.tech_stack.tile_alt', {
            tech: techName,
            level: stack.level + 1,
          })}
          className='aspect-[197/276] w-full rounded border border-surface-700/60 bg-background-950/40 object-contain'
        />
        <div className='flex min-w-0 flex-col gap-1'>
          <span
            className={cn(
              'w-fit rounded border px-1.5 py-0.5 font-mono text-[10px]',
              stack.firstTakeBonusAvailable
                ? 'border-accent-500/70 text-accent-300'
                : 'border-surface-600 text-text-500',
            )}
          >
            {t('client.tech_stack.first_take_bonus', {
              status: stack.firstTakeBonusAvailable
                ? t('client.tech_stack.available')
                : t('client.tech_stack.taken'),
            })}
          </span>
          <div className='flex min-h-7 flex-wrap items-center gap-1'>
            {(stack.topTileBonuses ?? []).map((bonus, index) => {
              const meta = getTechBonusMeta(bonus);
              return (
                <span
                  key={`${stack.tech}-${stack.level}-bonus-${bonus.type}-${index}`}
                  className='inline-flex h-6 min-w-6 items-center justify-center rounded border border-surface-700/70 bg-background-950/60 px-1 font-mono text-[9px] text-text-200'
                  title={meta.label}
                  aria-label={meta.label}
                >
                  {meta.src ? (
                    <img
                      src={meta.src}
                      alt={meta.label}
                      className='h-5 w-5 object-contain'
                    />
                  ) : (
                    meta.shortLabel
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className='mt-2 flex min-h-4 flex-wrap gap-1'>
        {ownerPlayerIds.length === 0 ? (
          <span className='font-mono text-[10px] text-text-500'>
            {t('client.tech_stack.no_owner')}
          </span>
        ) : (
          ownerPlayerIds.map((playerId) => (
            <span
              key={`${stack.tech}-${stack.level}-${playerId}`}
              className='inline-flex h-3.5 w-3.5 rounded-full border border-surface-200/40'
              style={{ backgroundColor: playerColors[playerId] ?? '#cbd5e1' }}
              title={playerId}
            />
          ))
        )}
      </div>
    </article>
  );
}
