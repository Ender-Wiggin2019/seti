import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer, TCardItem } from '../../player/IPlayer.js';

export type TCardRowDestination = 'hand' | 'discard' | 'choose';

export interface ICardRowCardInfo {
  /** Stable card id used for discard/hand display. */
  cardId: string;
  /** Selection id shown in the input model. */
  selectionId: string;
  /** Raw item from the card row (string ID or card object). */
  rawItem: TCardItem;
  /** Index the card occupied before removal. */
  originalIndex: number;
  /** Where the card ended up. */
  destination: 'hand' | 'discard';
}

export interface ISelectCardFromCardRowOptions {
  /**
   * What to do with the selected card:
   * - `'hand'`    – add to player's hand
   * - `'discard'` – send to main deck discard pile
   * - `'choose'`  – player decides (default)
   */
  destination?: TCardRowDestination;
  /**
   * Callback fired after the card is removed and dispatched.
   * Return a `PlayerInput` to chain further interaction, or
   * `undefined` to finish.
   */
  onComplete?: (info: ICardRowCardInfo) => IPlayerInput | undefined;
  /** Include row index in selection ids so duplicate displayed cards stay distinct. */
  includeRowIndexInSelectionId?: boolean;
}

/**
 * Atomic interactive effect: let a player select one card from the card row.
 *
 * The card is removed from `game.cardRow` and dispatched to the chosen
 * destination (hand or discard).  Card row is **not** refilled automatically
 * — use `RefillCardRowEffect` separately if needed.
 */
export class SelectCardFromCardRowEffect {
  public static canExecute(_player: IPlayer, game: IGame): boolean {
    return game.cardRow.length > 0;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    options: ISelectCardFromCardRowOptions = {},
  ): IPlayerInput | undefined {
    if (!this.canExecute(player, game)) {
      return options.onComplete?.(undefined as never);
    }

    const cardRowItems = game.cardRow
      .map((item, index) => ({
        cardId:
          typeof item === 'string'
            ? item
            : ((item as { id?: string })?.id ?? `row-${index}`),
        index,
        rawItem: item,
      }))
      .map((item) => ({
        ...item,
        selectionId: options.includeRowIndexInSelectionId
          ? `${item.cardId}@${item.index}`
          : item.cardId,
      }));

    const cards = cardRowItems.map((c) => ({
      id: c.selectionId,
      _rowIndex: c.index,
    }));

    return new SelectCard(
      player,
      {
        cards: cards as Array<{ id: string; [key: string]: unknown }>,
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selectedCardIds: string[]) => {
          const selectedId = selectedCardIds[0];
          const entry = cardRowItems.find((c) => c.selectionId === selectedId);
          if (!entry) {
            throw new GameError(
              EErrorCode.INVALID_INPUT_RESPONSE,
              `Card not found in card row: ${selectedId}`,
            );
          }

          const currentIndex = game.cardRow.indexOf(entry.rawItem);
          if (currentIndex >= 0) {
            game.cardRow.splice(currentIndex, 1);
          }

          const dest = options.destination ?? 'choose';

          if (dest === 'choose') {
            return this.buildDestinationChoice(
              player,
              game,
              entry,
              options.onComplete,
            );
          }

          return this.applyDestination(
            player,
            game,
            entry,
            dest,
            options.onComplete,
          );
        },
      },
      'Select a card from the card row',
    );
  }

  private static buildDestinationChoice(
    player: IPlayer,
    game: IGame,
    entry: {
      cardId: string;
      selectionId: string;
      index: number;
      rawItem: TCardItem;
    },
    onComplete?: (info: ICardRowCardInfo) => IPlayerInput | undefined,
  ): IPlayerInput {
    return new SelectOption(
      player,
      [
        {
          id: 'hand',
          label: 'Add to hand',
          onSelect: () =>
            this.applyDestination(player, game, entry, 'hand', onComplete),
        },
        {
          id: 'discard',
          label: 'Discard',
          onSelect: () =>
            this.applyDestination(player, game, entry, 'discard', onComplete),
        },
      ],
      'Choose card destination',
    );
  }

  private static applyDestination(
    player: IPlayer,
    game: IGame,
    entry: {
      cardId: string;
      selectionId: string;
      index: number;
      rawItem: TCardItem;
    },
    destination: 'hand' | 'discard',
    onComplete?: (info: ICardRowCardInfo) => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (destination === 'hand') {
      player.hand.push(entry.rawItem);
    } else {
      game.mainDeck.discard(entry.cardId);
    }

    const info: ICardRowCardInfo = {
      cardId: entry.cardId,
      selectionId: entry.selectionId,
      rawItem: entry.rawItem,
      originalIndex: entry.index,
      destination,
    };

    return onComplete?.(info);
  }
}
