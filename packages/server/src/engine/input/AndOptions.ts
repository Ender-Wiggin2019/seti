import type {
  IAndInputResponse,
  IInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type IAndOptionsInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class AndOptions extends BasePlayerInput {
  private readonly options: PlayerInput[];

  private currentIndex = 0;

  private waitingOnCurrent = false;

  public constructor(
    player: IPlayer,
    options: ReadonlyArray<PlayerInput>,
    title?: string,
  ) {
    super(player, EPlayerInputType.AND, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'AndOptions requires at least one sub-input',
      );
    }

    this.options = [...options];
  }

  public toModel(): IAndOptionsInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.AND,
      title: this.title,
      options: this.options.map((option) => option.toModel()),
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    if (response.type === EPlayerInputType.AND) {
      return this.processBatchResponse(response as IAndInputResponse);
    }

    return this.processSingleResponse(response);
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  private processBatchResponse(
    response: IAndInputResponse,
  ): PlayerInput | undefined {
    for (const nestedResponse of response.responses) {
      const pending = this.processSingleResponse(nestedResponse);
      if (pending === undefined) {
        return undefined;
      }

      if (this.waitingOnCurrent) {
        return pending;
      }
    }

    return this.currentIndex >= this.options.length ? undefined : this;
  }

  private processSingleResponse(
    response: IInputResponse,
  ): PlayerInput | undefined {
    if (this.currentIndex >= this.options.length) {
      return undefined;
    }

    const currentInput = this.options[this.currentIndex];
    const nextInput = currentInput.process(response);
    if (nextInput !== undefined) {
      this.options[this.currentIndex] = nextInput;
      this.waitingOnCurrent = true;
      return this;
    }

    this.currentIndex += 1;
    this.waitingOnCurrent = false;
    return this.currentIndex >= this.options.length ? undefined : this;
  }
}
