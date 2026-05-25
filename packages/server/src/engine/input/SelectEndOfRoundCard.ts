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
import { projectCardItems } from '../cards/projectCardItem.js';
import type { IPlayer, TCardItem } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export class SelectEndOfRoundCard extends BasePlayerInput {
  private readonly cards: TCardItem[];

  private readonly onSelect: (cardId: string) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    cards: TCardItem[],
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
      cards: projectCardItems(this.cards),
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.END_OF_ROUND);
    const eorResponse = response as IEndOfRoundInputResponse;
    const valid = this.cards.some((card) => {
      if (typeof card === 'string') return card === eorResponse.cardId;
      const candidate = card as { id?: unknown; cardId?: unknown };
      if (typeof candidate.id === 'string') {
        return candidate.id === eorResponse.cardId;
      }
      return (
        typeof candidate.cardId === 'string' &&
        candidate.cardId === eorResponse.cardId
      );
    });

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
