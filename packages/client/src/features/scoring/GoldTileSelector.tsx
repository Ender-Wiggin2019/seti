import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

interface IGoldTileItem {
  id: string;
  label: string;
  remainingSlots: number;
}

interface IGoldTileSelectorProps {
  tiles: IGoldTileItem[];
  selectedTileId?: string | null;
  onSelectTile?: (tileId: string) => void;
}

export function GoldTileSelector({
  tiles,
  selectedTileId = null,
  onSelectTile,
}: IGoldTileSelectorProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <section className='instrument-panel p-2'>
      <div className='section-head mb-2'>
        <span aria-hidden className='section-head__tick' />
        <p className='micro-label'>
          {t('client.gold_tile.title', { defaultValue: 'Gold Tiles' })}
        </p>
        <div aria-hidden className='section-head__rule' />
      </div>

      <div className='grid grid-cols-2 gap-1.5'>
        {tiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          return (
            <button
              key={tile.id}
              type='button'
              data-testid={`gold-tile-${tile.id}`}
              aria-pressed={isSelected}
              className={cn(
                'rounded-[4px] border px-2 py-1.5 text-left transition-[background,border-color,box-shadow] duration-150',
                'focus-visible:outline-none focus-visible:shadow-focus-ring',
                isSelected
                  ? [
                      'border-accent-500/70 bg-accent-500/[0.08]',
                      'shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.25),inset_0_0_0_1px_oklch(0.68_0.11_240/0.22)]',
                    ]
                  : [
                      'border-[color:var(--metal-edge-soft)] bg-background-900/70',
                      'shadow-hairline-inset',
                      'hover:border-[oklch(0.40_0.04_240)]',
                    ],
              )}
              onClick={() => onSelectTile?.(tile.id)}
            >
              <div className='flex items-start justify-between gap-1'>
                <p
                  className={cn(
                    'truncate font-body text-xs',
                    isSelected ? 'text-text-100' : 'text-text-200',
                  )}
                >
                  {tile.label}
                </p>
                {isSelected ? (
                  <span
                    aria-hidden
                    className='mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.6)]'
                  />
                ) : null}
              </div>
              <p className='mt-1 flex items-center gap-1 font-mono text-[10px] tracking-[0.1em]'>
                <span className='text-text-500'>
                  {t('client.gold_tile.slots', { defaultValue: 'SLOTS' })}
                </span>
                <span className='readout text-[11px] text-text-300 leading-none'>
                  {tile.remainingSlots}
                </span>
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { IGoldTileItem };
