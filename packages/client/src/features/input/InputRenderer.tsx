import type {
  IInputResponse,
  IPlayerInputModel,
  ISelectCardInputModel,
  ISelectEndOfRoundCardInputModel,
  ISelectGoldTileInputModel,
  ISelectOptionInputModel,
  ISelectPlanetInputModel,
  ISelectResourceInputModel,
  ISelectSectorInputModel,
  ISelectTechInputModel,
  ISelectTraceInputModel,
} from '@/types/re-exports';
import { EPlayerInputType } from '@/types/re-exports';
import { AndOptionsInput } from './AndOptionsInput';
import { OrOptionsInput } from './OrOptionsInput';
import { SelectCardInput } from './SelectCardInput';
import { SelectEndOfRoundCardInput } from './SelectEndOfRoundCardInput';
import { SelectGoldTileInput } from './SelectGoldTileInput';
import { SelectOptionInput } from './SelectOptionInput';
import { SelectPlanetInput } from './SelectPlanetInput';
import { SelectResourceInput } from './SelectResourceInput';
import { SelectSectorInput } from './SelectSectorInput';
import { SelectTechInput } from './SelectTechInput';
import { SelectTraceInput } from './SelectTraceInput';

export interface IInputRendererProps {
  model: IPlayerInputModel;
  onSubmit: (response: IInputResponse) => void;
}

export function InputRenderer({
  model,
  onSubmit,
}: IInputRendererProps): React.JSX.Element {
  switch (model.type) {
    case EPlayerInputType.OPTION:
      return (
        <SelectOptionInput
          model={model as ISelectOptionInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.CARD:
      return (
        <SelectCardInput
          model={model as ISelectCardInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.SECTOR:
      return (
        <SelectSectorInput
          model={model as ISelectSectorInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.PLANET:
      return (
        <SelectPlanetInput
          model={model as ISelectPlanetInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.TECH:
      return (
        <SelectTechInput
          model={model as ISelectTechInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.GOLD_TILE:
      return (
        <SelectGoldTileInput
          model={model as ISelectGoldTileInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.RESOURCE:
      return (
        <SelectResourceInput
          model={model as ISelectResourceInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.TRACE:
      return (
        <SelectTraceInput
          model={model as ISelectTraceInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.END_OF_ROUND:
      return (
        <SelectEndOfRoundCardInput
          model={model as ISelectEndOfRoundCardInputModel}
          onSubmit={onSubmit}
        />
      );
    case EPlayerInputType.OR:
      return <OrOptionsInput model={model} onSubmit={onSubmit} />;
    case EPlayerInputType.AND:
      return <AndOptionsInput model={model} onSubmit={onSubmit} />;
    default:
      return (
        <div className='rounded border border-surface-700/60 bg-surface-800/60 px-3 py-2 text-xs text-text-300'>
          Unsupported input type.
        </div>
      );
  }
}
