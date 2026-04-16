import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
      <p className='text-xs text-text-300'>
        {t('client.input.choose_end_of_round')}
      </p>
      <div className='grid gap-2 sm:grid-cols-2'>
        {model.cards.map((card) => (
          <Button
            key={card.id}
            type='button'
            variant='ghost'
            data-testid={`input-eor-card-${card.id}`}
            className='h-auto flex-col items-start border border-surface-700/60 bg-surface-800/60 px-2 py-1.5 text-left hover:bg-surface-700/70'
            onClick={() =>
              onSubmit({
                type: EPlayerInputType.END_OF_ROUND,
                cardId: card.id,
              })
            }
          >
            <span className='text-xs font-medium text-text-100'>
              {card.name}
            </span>
            <span className='font-mono text-[10px] text-text-500'>
              {card.id}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
