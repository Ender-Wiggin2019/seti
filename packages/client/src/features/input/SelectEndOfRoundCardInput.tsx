import { useTranslation } from 'react-i18next';
import type {
  IInputResponse,
  ISelectEndOfRoundCardInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectEndOfRoundCardInputProps {
  model: ISelectEndOfRoundCardInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectEndOfRoundCardInput({
  model,
  onSubmit,
}: ISelectEndOfRoundCardInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-2'>
      <p className='micro-label'>{t('client.input.choose_end_of_round')}</p>
      <div className='grid gap-1.5 sm:grid-cols-2'>
        {model.cards.map((card) => (
          <button
            key={card.id}
            type='button'
            data-testid={`input-eor-card-${card.id}`}
            className='group flex flex-col gap-0.5 rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/75 px-2.5 py-1.5 text-left shadow-hairline-inset transition-[background,border-color] duration-150 hover:border-accent-500/60 hover:bg-accent-500/[0.06] focus-visible:outline-none focus-visible:shadow-focus-ring'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.END_OF_ROUND,
                cardId: card.id,
              })
            }
          >
            <span className='truncate font-body text-[12px] font-medium text-text-100 group-hover:text-text-100'>
              {card.name}
            </span>
            <span className='truncate font-mono text-[10px] tracking-[0.06em] text-text-500'>
              {card.id}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
