import { useTranslation } from 'react-i18next';
import { ETech } from '@seti/common/types/element';
import {
  TECH_IDS_BY_CATEGORY_TEXT_ORDER,
  getTechPresentation,
} from '@seti/common/types/techPresentation';
import { Button } from '@/components/ui/button';
import type { IInputResponse, ISelectTechInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectTechInputProps {
  model: ISelectTechInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectTechInput({
  model,
  onSubmit,
}: ISelectTechInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const orderedOptions = [...model.options].sort((a, b) => {
    const rank: Record<ETech, number> = {
      [ETech.ANY]: 99,
      [ETech.PROBE]: 0,
      [ETech.SCAN]: 1,
      [ETech.COMPUTER]: 2,
    };
    return (rank[a] ?? 99) - (rank[b] ?? 99);
  });

  function categoryText(tech: ETech): string {
    if (tech === ETech.PROBE || tech === ETech.SCAN || tech === ETech.COMPUTER) {
      const labels = TECH_IDS_BY_CATEGORY_TEXT_ORDER[tech].map((id) => {
        const meta = getTechPresentation(id);
        return t(meta.i18nKey, { defaultValue: meta.fallback });
      });

      if (tech === ETech.SCAN) {
        labels.splice(
          1,
          0,
          t('client.tech_row.scan.card_row', { defaultValue: 'Card Row' }),
        );
      }

      return labels.join(' / ');
    }
    return tech;
  }

  return (
    <div className='space-y-2'>
      <p className='micro-label'>
        {t('client.input.select_tech', { defaultValue: 'Select tech' })}
      </p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {orderedOptions.map((tech) => (
          <Button
            key={tech}
            variant='ghost'
            size='sm'
            className='h-auto min-h-9 justify-start gap-2 px-2.5 py-2 text-left font-mono text-[11px] tracking-[0.04em]'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.TECH,
                tech,
              })
            }
          >
            <span
              aria-hidden
              className='inline-flex h-4 w-4 items-center justify-center rounded-[3px] border border-[color:var(--metal-edge-soft)] bg-background-900 font-mono text-[9px] text-accent-400'
            >
              ⟟
            </span>
            <span className='flex-1 text-text-100'>{categoryText(tech)}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
