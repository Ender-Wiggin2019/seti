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
  return (
    <section className='rounded border border-surface-700/55 bg-surface-950/45 p-2'>
      <p className='mb-2 font-mono text-[10px] uppercase tracking-wide text-text-500'>
        Gold Tiles
      </p>
      <div className='grid grid-cols-2 gap-1.5'>
        {tiles.map((tile) => {
          const isSelected = selectedTileId === tile.id;
          return (
            <button
              key={tile.id}
              type='button'
              data-testid={`gold-tile-${tile.id}`}
              className={[
                'rounded border px-1.5 py-1 text-left transition-colors',
                isSelected
                  ? 'border-accent-500 bg-accent-500/15'
                  : 'border-surface-700/60 bg-surface-900/60 hover:bg-surface-800/70',
              ].join(' ')}
              onClick={() => onSelectTile?.(tile.id)}
            >
              <p className='truncate text-xs text-text-200'>{tile.label}</p>
              <p className='font-mono text-[10px] text-text-500'>
                slots: {tile.remainingSlots}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export type { IGoldTileItem };
