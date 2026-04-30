import { ETech } from '@seti/common/types/element';
import type {
  IInputResponse,
  ITechInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectTechInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectTech extends BasePlayerInput {
  private readonly options: ETech[];

  private readonly onSelect: (tech: ETech) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    options: ETech[],
    onSelect: (tech: ETech) => PlayerInput | undefined,
    title?: string,
  ) {
    super(player, EPlayerInputType.TECH, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'SelectTech requires at least one option',
      );
    }
    this.options = options;
    this.onSelect = onSelect;
  }

  public toModel(): ISelectTechInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.TECH,
      title: this.title,
      options: this.options,
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.TECH);
    const techResponse = response as ITechInputResponse;

    if (!this.options.includes(techResponse.tech)) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Invalid tech: ${techResponse.tech}`,
        { inputId: this.inputId, tech: techResponse.tech },
      );
    }

    return this.onSelect(techResponse.tech);
  }
}
