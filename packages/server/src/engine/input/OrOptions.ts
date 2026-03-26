import type {
  IInputResponse,
  IOrInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type IOrOptionsInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class OrOptions extends BasePlayerInput {
  private readonly options: PlayerInput[];

  public constructor(
    player: IPlayer,
    options: ReadonlyArray<PlayerInput>,
    title?: string,
  ) {
    super(player, EPlayerInputType.OR, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'OrOptions requires at least one sub-input',
      );
    }

    this.options = [...options];
  }

  public toModel(): IOrOptionsInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.OR,
      title: this.title,
      options: this.options.map((option) => option.toModel()),
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.OR);
    const orResponse = response as IOrInputResponse;
    const selectedInput = this.options[orResponse.index];

    if (!selectedInput) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `OrOptions index out of range: ${orResponse.index}`,
        {
          inputId: this.inputId,
          index: orResponse.index,
          optionCount: this.options.length,
        },
      );
    }

    return selectedInput.process(orResponse.response);
  }
}
