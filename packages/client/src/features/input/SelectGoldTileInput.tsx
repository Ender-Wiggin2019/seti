import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTileId(null);
  }, [model.inputId]);

  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_gold_tile', {
          defaultValue: 'Select gold tile',
        })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.options.map((tileId) => {
          const active = selectedTileId === tileId;
          return (
            <button
              key={tileId}
              type='button'
              data-testid={`gold-tile-${tileId}`}
              aria-pressed={active}
              className={cn(
                'group relative flex h-9 items-center gap-2 rounded-[4px] px-2.5',
                'border transition-[background,border-color,box-shadow] duration-150',
                'focus-visible:outline-none focus-visible:shadow-focus-ring',
                active
                  ? [
                      'border-accent-500/70 bg-accent-500/[0.08]',
                      'shadow-[inset_0_1px_0_oklch(0.78_0.07_240/0.25),inset_0_0_0_1px_oklch(0.68_0.11_240/0.25)]',
                    ]
                  : [
                      'border-[color:var(--metal-edge-soft)] bg-background-900/75',
                      'shadow-hairline-inset',
                      'hover:border-[oklch(0.40_0.04_240)]',
                    ],
              )}
              onClick={() => setSelectedTileId(tileId)}
            >
              <img
                src='/assets/seti/icons/vp.png'
                alt=''
                aria-hidden
                className='h-4 w-4 opacity-90'
              />
              <span
                className={cn(
                  'flex-1 truncate font-mono text-[11px] uppercase tracking-[0.1em]',
                  active ? 'text-text-100' : 'text-text-300',
                )}
              >
                {tileId}
              </span>
              {active ? (
                <span
                  aria-hidden
                  className='inline-block h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_oklch(0.68_0.11_240/0.6)]'
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <Button
        disabled={!selectedTileId}
        className='w-full'
        onClick={() =>
          onSubmit({
            type: EPlayerInputType.GOLD_TILE,
            tileId: selectedTileId ?? '',
          })
        }
      >
        {t('client.input.confirm_tile', { defaultValue: 'Confirm Tile' })}
      </Button>
    </div>
  );
}
