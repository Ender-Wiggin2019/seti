import { useTranslation } from 'react-i18next';
import { CardRender } from '@/features/cards/CardRender';
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
      <div className='grid max-h-[270px] gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3'>
        {model.cards.map((card) => (
          <button
            key={card.id}
            type='button'
            data-testid={`input-eor-card-${card.id}`}
            className='overflow-hidden rounded-[4px] border border-[color:var(--metal-edge-soft)] bg-background-900/75 p-2 text-left shadow-hairline-inset transition-[background,border-color] duration-150 hover:border-accent-500/60 hover:bg-accent-500/[0.06] focus-visible:outline-none focus-visible:shadow-focus-ring'
            onClick={() =>
              onSubmit({
                inputId: model.inputId,
                type: EPlayerInputType.END_OF_ROUND,
                cardId: card.id,
              })
            }
          >
            <div className='pointer-events-none'>
              <CardRender card={card} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
