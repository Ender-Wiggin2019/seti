import { useTranslation } from 'react-i18next';
import { HandView } from '@/features/player/HandView';
import type { IInputResponse, ISelectCardInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { translateInputText } from './inputI18n';

export interface ISelectCardInputProps {
  model: ISelectCardInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectCardInput({
  model,
  onSubmit,
}: ISelectCardInputProps): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <div className='flex flex-col gap-2'>
      {model.title ? (
        <p className='micro-label'>{translateInputText(t, model.title)}</p>
      ) : null}
      <HandView
        cards={model.cards}
        handSize={model.cards.length}
        pendingInput={model}
        variant='dock'
        onSubmitSelection={(cardIds) =>
          onSubmit({
            inputId: model.inputId,
            type: EPlayerInputType.CARD,
            cardIds,
          })
        }
      />
    </div>
  );
}
