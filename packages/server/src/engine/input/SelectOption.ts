import type {
  IInputResponse,
  IOptionInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export interface ISelectOptionEntry {
  id?: string;
  label: string;
  onSelect: () => PlayerInput | undefined;
}

interface IResolvedSelectOptionEntry {
  id: string;
  label: string;
  onSelect: () => PlayerInput | undefined;
}

export class SelectOption extends BasePlayerInput {
  private readonly options: IResolvedSelectOptionEntry[];

  public constructor(
    player: IPlayer,
    options: ReadonlyArray<ISelectOptionEntry>,
    title?: string,
  ) {
    super(player, EPlayerInputType.OPTION, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'SelectOption requires at least one option',
      );
    }

    this.options = options.map((option, index) => ({
      id: option.id ?? `option-${index}`,
      label: option.label,
      onSelect: option.onSelect,
    }));
  }

  public toModel(): ISelectOptionInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.OPTION,
      title: this.title,
      options: this.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.OPTION);
    const optionResponse = response as IOptionInputResponse;
    const selectedOption = this.options.find(
      (option) => option.id === optionResponse.optionId,
    );

    if (!selectedOption) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Unknown option id: ${optionResponse.optionId}`,
        {
          inputId: this.inputId,
          optionId: optionResponse.optionId,
        },
      );
    }

    return selectedOption.onSelect();
  }
}
