import { randomUUID } from 'node:crypto';
import type { IInputResponse } from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type IPlayerInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IPlayerInput {
  readonly inputId: string;
  readonly type: EPlayerInputType;
  readonly player: IPlayer;
  readonly title?: string;

  toModel(): IPlayerInputModel;
  process(response: IInputResponse): IPlayerInput | undefined;
}

export abstract class BasePlayerInput implements IPlayerInput {
  public readonly inputId: string;

  public readonly type: EPlayerInputType;

  public readonly player: IPlayer;

  public readonly title?: string;

  protected constructor(
    player: IPlayer,
    type: EPlayerInputType,
    title?: string,
    inputId: string = randomUUID(),
  ) {
    this.player = player;
    this.type = type;
    this.title = title;
    this.inputId = inputId;
  }

  public abstract toModel(): IPlayerInputModel;

  public abstract process(response: IInputResponse): IPlayerInput | undefined;

  protected validateResponseType(
    response: IInputResponse,
    expectedType: EPlayerInputType,
  ): void {
    if (response.type !== expectedType) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Expected response type ${expectedType} but got ${response.type}`,
        {
          inputType: this.type,
          expectedType,
          actualType: response.type,
          inputId: this.inputId,
        },
      );
    }
  }
}

export type PlayerInput = IPlayerInput;
