import { HandView } from '@/features/player/HandView';
import type { IInputResponse, ISelectCardInputModel } from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';

export interface ISelectCardInputProps {
  model: ISelectCardInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function SelectCardInput({
  model,
  onSubmit,
}: ISelectCardInputProps): React.JSX.Element {
  return (
    <HandView
      cards={model.cards}
      handSize={model.cards.length}
      pendingInput={model}
      onSubmitSelection={(cardIds) =>
        onSubmit({
          type: EPlayerInputType.CARD,
          cardIds,
        })
      }
    />
  );
}
