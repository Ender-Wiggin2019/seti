import type {
  IInputResponse,
  ITraceInputResponse,
} from '@seti/common/types/protocol/actions';
import { ETrace } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectTraceInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectTrace extends BasePlayerInput {
  private readonly options: ETrace[];

  private readonly onSelect: (trace: ETrace) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    options: ETrace[],
    onSelect: (trace: ETrace) => PlayerInput | undefined,
    title?: string,
  ) {
    super(player, EPlayerInputType.TRACE, title);
    if (options.length === 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'SelectTrace requires at least one option',
      );
    }
    this.options = options;
    this.onSelect = onSelect;
  }

  public toModel(): ISelectTraceInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.TRACE,
      title: this.title,
      options: this.options,
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.TRACE);
    const traceResponse = response as ITraceInputResponse;

    if (!this.options.includes(traceResponse.trace)) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Invalid trace: ${traceResponse.trace}`,
        { inputId: this.inputId, trace: traceResponse.trace },
      );
    }

    return this.onSelect(traceResponse.trace);
  }
}
