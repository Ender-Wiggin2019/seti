import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import type {
  IInputResponse,
  ISelectGoldTileInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectGoldTileInputProps {
  model: ISelectGoldTileInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectGoldTileInput({
  model,
  onSubmit,
}: ISelectGoldTileInputProps): React.JSX.Element {
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  return (
    <div className='space-y-2'>
      <div className='grid gap-2 sm:grid-cols-2'>
        {model.options.map((tileId) => (
          <button
            key={tileId}
            type='button'
            data-testid={`gold-tile-${tileId}`}
            className={cn(
              'rounded border px-2 py-1.5 text-left text-xs transition-colors',
              selectedTileId === tileId
                ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                : 'border-surface-700/60 bg-surface-800/60 text-text-100 hover:border-accent-400/60',
            )}
            onClick={() => setSelectedTileId(tileId)}
          >
            {tileId}
          </button>
        ))}
      </div>
      <Button
        type='button'
        disabled={!selectedTileId}
        onClick={() =>
          onSubmit({
            type: EPlayerInputType.GOLD_TILE,
            tileId: selectedTileId ?? '',
          })
        }
      >
        Confirm Tile
      </Button>
    </div>
  );
}
