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
  return (
    <div className='space-y-2'>
      <p className='text-xs text-text-300'>Choose one end-of-round card:</p>
      <div className='grid gap-2 sm:grid-cols-2'>
        {model.cards.map((card) => (
          <Button
            key={card.id}
            type='button'
            variant='ghost'
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
