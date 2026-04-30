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

export class ExchangeResourcesFreeAction {
  static canExecute(player: IPlayer, _game: IGame): boolean {
    return (
      player.resources.credits >= EXCHANGE_INPUT_AMOUNT ||
      player.resources.energy >= EXCHANGE_INPUT_AMOUNT ||
      player.hand.length >= EXCHANGE_INPUT_AMOUNT
    );
  }

  static execute(
    player: IPlayer,
    game: IGame,
    from: EResource,
    to: EResource,
    gainCardOptions?: { fromDeck?: boolean; cardId?: string },
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
      this.assertCanGainExchangedCard(game, gainCardOptions);
    }

    this.spendInput(player, game, from as TExchangeableResource);
    this.gainOutput(player, game, to as TExchangeableResource, gainCardOptions);

    return {
      from: from as TExchangeableResource,
      to: to as TExchangeableResource,
      inputAmount: EXCHANGE_INPUT_AMOUNT,
      outputAmount: EXCHANGE_OUTPUT_AMOUNT,
    };
  }

  private static assertCanGainExchangedCard(
    game: IGame,
    options?: { fromDeck?: boolean; cardId?: string },
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

      case EResource.CARD:
        if (player.hand.length < EXCHANGE_INPUT_AMOUNT) {
          throw new GameError(
            EErrorCode.INSUFFICIENT_RESOURCES,
            'Not enough cards in hand',
            { required: EXCHANGE_INPUT_AMOUNT, available: player.hand.length },
          );
        }
        for (let i = 0; i < EXCHANGE_INPUT_AMOUNT; i++) {
          const removed = player.hand.pop();
          if (removed !== undefined) {
            const cardId =
              typeof removed === 'string'
                ? removed
                : ((removed as { id?: string })?.id ?? 'unknown');
            game.mainDeck.discard(cardId);
          }
        }
        break;

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
    gainCardOptions?: { fromDeck?: boolean; cardId?: string },
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
}
