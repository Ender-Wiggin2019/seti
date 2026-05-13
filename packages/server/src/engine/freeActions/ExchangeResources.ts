import { isDiscardProhibitedCard } from '@seti/common/rules';
import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

const EXCHANGE_INPUT_AMOUNT = 2;
const EXCHANGE_OUTPUT_AMOUNT = 1;

type TExchangeableResource =
  | EResource.CREDIT
  | EResource.ENERGY
  | EResource.CARD;

const VALID_EXCHANGE_RESOURCES: TExchangeableResource[] = [
  EResource.CREDIT,
  EResource.ENERGY,
  EResource.CARD,
];

export interface IExchangeResult {
  from: TExchangeableResource;
  to: TExchangeableResource;
  inputAmount: number;
  outputAmount: number;
}

interface IExchangeOptions {
  fromDeck?: boolean;
  cardId?: string;
  spentCardIds?: readonly string[];
}

export class ExchangeResourcesFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    return (
      player.resources.credits >= EXCHANGE_INPUT_AMOUNT ||
      player.resources.energy >= EXCHANGE_INPUT_AMOUNT ||
      this.getDiscardableHandCards(player).length >= EXCHANGE_INPUT_AMOUNT
    );
  }

  static execute(
    player: IPlayer,
    game: IGame,
    from: EResource,
    to: EResource,
    exchangeOptions?: IExchangeOptions,
  ): IExchangeResult {
    if (
      !VALID_EXCHANGE_RESOURCES.includes(from as TExchangeableResource) ||
      !VALID_EXCHANGE_RESOURCES.includes(to as TExchangeableResource)
    ) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Invalid exchange resource type. Must be CREDIT, ENERGY, or CARD',
        { from, to },
      );
    }

    if (from === to) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Cannot exchange a resource for the same type',
        { from, to },
      );
    }

    if (to === EResource.CARD) {
      this.assertCanGainExchangedCard(game, exchangeOptions);
    }

    this.spendInput(
      player,
      game,
      from as TExchangeableResource,
      exchangeOptions,
    );
    this.gainOutput(player, game, to as TExchangeableResource, exchangeOptions);

    return {
      from: from as TExchangeableResource,
      to: to as TExchangeableResource,
      inputAmount: EXCHANGE_INPUT_AMOUNT,
      outputAmount: EXCHANGE_OUTPUT_AMOUNT,
    };
  }

  private static assertCanGainExchangedCard(
    game: IGame,
    options?: IExchangeOptions,
  ): void {
    const insistDeck = options?.fromDeck === true;
    if (!insistDeck && game.cardRow.length > 0) {
      if (options?.cardId !== undefined) {
        const exists = game.cardRow.some(
          (item) =>
            (typeof item === 'string'
              ? item
              : (item as { id?: string })?.id) === options.cardId,
        );
        if (!exists) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            `Card ${options.cardId} not found in card row`,
            { cardId: options.cardId },
          );
        }
      }
      return;
    }

    if (game.mainDeck.totalSize === 0) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No cards available in deck or discard pile',
      );
    }
  }

  private static takeCardFromRowForExchange(
    player: IPlayer,
    game: IGame,
    cardId?: string,
  ): void {
    const row = game.cardRow;
    if (row.length === 0) {
      throw new GameError(EErrorCode.INVALID_ACTION, 'Card row is empty');
    }

    let cardIndex: number;
    if (cardId !== undefined) {
      cardIndex = row.findIndex(
        (item) =>
          (typeof item === 'string' ? item : (item as { id?: string })?.id) ===
          cardId,
      );
      if (cardIndex < 0) {
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Card ${cardId} not found in card row`,
          { cardId },
        );
      }
    } else {
      cardIndex = 0;
    }

    const [removed] = row.splice(cardIndex, 1);
    player.hand.push(removed);

    const drawn = game.mainDeck.drawWithReshuffle(game.random);
    if (drawn !== undefined) {
      row.push(drawn);
      game.lockCurrentTurn();
    }
  }

  private static spendInput(
    player: IPlayer,
    game: IGame,
    resource: TExchangeableResource,
    options?: IExchangeOptions,
  ): void {
    switch (resource) {
      case EResource.CREDIT:
        if (player.resources.credits < EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INSUFFICIENT_RESOURCES,
            'Not enough credits',
            {
              required: EXCHANGE_INPUT_AMOUNT,
              available: player.resources.credits,
            },
          );
        }
        player.resources.spend({ credits: EXCHANGE_INPUT_AMOUNT });
        break;

      case EResource.ENERGY:
        if (player.resources.energy < EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INSUFFICIENT_RESOURCES,
            'Not enough energy',
            {
              required: EXCHANGE_INPUT_AMOUNT,
              available: player.resources.energy,
            },
          );
        }
        player.resources.spend({ energy: EXCHANGE_INPUT_AMOUNT });
        break;

      case EResource.CARD: {
        const discardableCards = this.getDiscardableHandCards(player);
        if (discardableCards.length < EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INSUFFICIENT_RESOURCES,
            'Not enough cards in hand',
            {
              required: EXCHANGE_INPUT_AMOUNT,
              available: discardableCards.length,
            },
          );
        }
        const selectedCardIds = options?.spentCardIds;
        if (selectedCardIds?.length !== EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Exactly two spent card ids are required for card exchange',
            { selectedCardIds },
          );
        }
        if (new Set(selectedCardIds).size !== EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Spent card ids must be distinct',
            { selectedCardIds },
          );
        }
        const selectedCards = selectedCardIds.map((cardId) =>
          discardableCards.find((card) => card.cardId === cardId),
        );
        if (selectedCards.some((card) => card === undefined)) {
          throw new GameError(
            EErrorCode.INVALID_ACTION,
            'Selected spent cards must be discardable hand cards',
            { selectedCardIds },
          );
        }
        const cardsToDiscard = selectedCards.filter(
          (card): card is { handIndex: number; cardId: string } =>
            card !== undefined,
        );
        for (const card of cardsToDiscard.sort(
          (left, right) => right.handIndex - left.handIndex,
        )) {
          player.removeCardAt(card.handIndex);
          game.mainDeck.discard(card.cardId);
        }
        break;
      }

      default:
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Unsupported input resource: ${resource}`,
        );
    }
  }

  private static gainOutput(
    player: IPlayer,
    game: IGame,
    resource: TExchangeableResource,
    gainCardOptions?: IExchangeOptions,
  ): void {
    switch (resource) {
      case EResource.CREDIT:
        player.resources.gain({ credits: EXCHANGE_OUTPUT_AMOUNT });
        break;

      case EResource.ENERGY:
        player.resources.gain({ energy: EXCHANGE_OUTPUT_AMOUNT });
        break;

      case EResource.CARD: {
        const insistDeck = gainCardOptions?.fromDeck === true;
        if (!insistDeck && game.cardRow.length > 0) {
          this.takeCardFromRowForExchange(
            player,
            game,
            gainCardOptions?.cardId,
          );
        } else {
          const card = game.mainDeck.drawWithReshuffle(game.random);
          if (card !== undefined) {
            player.hand.push(card);
            game.lockCurrentTurn();
          }
        }
        break;
      }

      default:
        throw new GameError(
          EErrorCode.INVALID_ACTION,
          `Unsupported output resource: ${resource}`,
        );
    }
  }

  private static getDiscardableHandCards(player: IPlayer): Array<{
    handIndex: number;
    cardId: string;
  }> {
    return player.hand.flatMap((card, handIndex) => {
      if (isDiscardProhibitedCard(card)) {
        return [];
      }
      const cardId =
        typeof card === 'string' ? card : (card as { id?: string })?.id;
      if (cardId === undefined) {
        return [];
      }
      return [{ handIndex, cardId }];
    });
  }
}
