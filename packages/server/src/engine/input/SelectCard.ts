import type {
  ICardInputResponse,
  IInputResponse,
} from '@seti/common/types/protocol/actions';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  EPlayerInputType,
  type ISelectCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { GameError } from '@/shared/errors/GameError.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BasePlayerInput, type PlayerInput } from './PlayerInput.js';

export interface ISelectCardConfig {
  cards: Array<{ id: string; [key: string]: unknown }>;
  minSelections?: number;
  maxSelections?: number;
  onSelect: (selectedCardIds: string[]) => PlayerInput | undefined;
}

export class SelectCard extends BasePlayerInput {
  private readonly cards: Array<{ id: string; [key: string]: unknown }>;

  private readonly minSelections: number;

  private readonly maxSelections: number;

  private readonly onSelect: (
    selectedCardIds: string[],
  ) => PlayerInput | undefined;

  public constructor(
    player: IPlayer,
    config: ISelectCardConfig,
    title?: string,
  ) {
    super(player, EPlayerInputType.CARD, title);
    this.cards = config.cards;
    this.minSelections = config.minSelections ?? 1;
    this.maxSelections = config.maxSelections ?? 1;
    this.onSelect = config.onSelect;
  }

  public toModel(): ISelectCardInputModel {
    return {
      inputId: this.inputId,
      type: EPlayerInputType.CARD,
      title: this.title,
      cards: this.cards as unknown as ISelectCardInputModel['cards'],
      minSelections: this.minSelections,
      maxSelections: this.maxSelections,
    };
  }

  public process(response: IInputResponse): PlayerInput | undefined {
    this.validateResponseType(response, EPlayerInputType.CARD);
    const cardResponse = response as ICardInputResponse;
    const { cardIds } = cardResponse;

    if (
      cardIds.length < this.minSelections ||
      cardIds.length > this.maxSelections
    ) {
      throw new GameError(
        EErrorCode.INVALID_INPUT_RESPONSE,
        `Must select between ${this.minSelections} and ${this.maxSelections} cards`,
        { inputId: this.inputId, selected: cardIds.length },
      );
    }

    const validIds = new Set(this.cards.map((c) => c.id));
    for (const id of cardIds) {
      if (!validIds.has(id)) {
        throw new GameError(
          EErrorCode.INVALID_INPUT_RESPONSE,
          `Invalid card id: ${id}`,
          { inputId: this.inputId, cardId: id },
        );
      }
    }

    return this.onSelect(cardIds);
  }
}
