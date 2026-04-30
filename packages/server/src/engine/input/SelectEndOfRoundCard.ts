import type {
  IEndOfRoundInputResponse,
  IInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectEndOfRoundCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectEndOfRoundCard extends BasePlayerInput {
  private readonly cards: Array<{ id: string; [key: string]: unknown }>;

  private readonly onSelect: (cardId: string) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    cards: Array<{ id: string; [key: string]: unknown }>,
    onSelect: (cardId: string) => PlayerInput | undefined,
    title?: string,
  ) {
    super(player, EPlayerInputType.END_OF_ROUND, title);
    this.cards = cards;
    this.onSelect = onSelect;
  }

  public toModel(): ISelectEndOfRoundCardInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.END_OF_ROUND,
      title: this.title,
      cards: this.cards as unknown as ISelectEndOfRoundCardInputModel['cards'],
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.END_OF_ROUND);
    const eorResponse = response as IEndOfRoundInputResponse;
    const valid = this.cards.some((c) => c.id === eorResponse.cardId);

    if (!valid) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Invalid end-of-round card: ${eorResponse.cardId}`,
        { inputId: this.inputId, cardId: eorResponse.cardId },
      );
    }

    return this.onSelect(eorResponse.cardId);
  }
}
