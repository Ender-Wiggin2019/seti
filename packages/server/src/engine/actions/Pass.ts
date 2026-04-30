import {
  countCardsTowardHandLimit,
  isHandLimitExemptCard,
} from '@seti/common/rules';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import { SelectCard } from '../input/SelectCard.js';
import { SelectEndOfRoundCard } from '../input/SelectEndOfRoundCard.js';
import type { IPlayer, TCardItem } from '../player/IPlayer.js';

export class PassAction {
  public static canExecute(_player: IPlayer, _game: IGame): boolean {
    return true;
  }

  /**
   * Pass sequence (PRD §7.8):
   *  1. Discard hand down to `player.handLimitAfterPass`  (PlayerInput if excess)
   *  2. Rotate SolarSystem disc on the first pass of the round
   *  3. Pick one card from end-of-round stack             (PlayerInput)
   *  4. Mark player as passed
   */
  public static execute(player: IPlayer, game: IGame): PlayerInput | undefined {
    return this.discardStep(player, game);
  }

  private static discardStep(
    player: IPlayer,
    game: IGame,
  ): PlayerInput | undefined {
    const handLimit = player.handLimitAfterPass;
    const excessCount = countCardsTowardHandLimit(player.hand) - handLimit;

    if (excessCount > 0) {
      const cards = player.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => !isHandLimitExemptCard(card))
        .map(({ card, index }) =>
          PassAction.toCardDescriptor(card, player.getCardIdAt(index)),
        );

      return new SelectCard(
        player,
        {
          cards,
          minSelections: excessCount,
          maxSelections: excessCount,
          onSelect: (selectedCardIds) => {
            for (const cardId of selectedCardIds) {
              player.removeCardById(cardId);
            }
            return PassAction.rotateAndPickStep(player, game);
          },
        },
        'Discard down to hand limit',
      );
    }

    return PassAction.rotateAndPickStep(player, game);
  }

  private static rotateAndPickStep(
    player: IPlayer,
    game: IGame,
  ): PlayerInput | undefined {
    if (!game.hasRoundFirstPassOccurred) {
      game.hasRoundFirstPassOccurred = true;
      if (game.solarSystem !== null) {
        game.solarSystem.rotateNextDisc();
        game.alienState?.onSolarSystemRotated(game);
      }
    }

    return PassAction.endOfRoundCardStep(player, game);
  }

  private static endOfRoundCardStep(
    player: IPlayer,
    game: IGame,
  ): PlayerInput | undefined {
    const stackIndex = game.roundRotationReminderIndex;

    if (stackIndex >= 0 && stackIndex < game.endOfRoundStacks.length) {
      const stack = game.endOfRoundStacks[stackIndex];

      if (stack.length > 0) {
        const cards = stack.map((card, index) =>
          PassAction.toCardDescriptor(card, `eor-${index}`),
        );

        return new SelectEndOfRoundCard(
          player,
          cards,
          (cardId) => {
            const cardIndex = stack.findIndex(
              (c) => PassAction.getCardItemId(c) === cardId,
            );
            if (cardIndex >= 0) {
              const selected = stack.splice(cardIndex, 1)[0];
              if (selected !== undefined) {
                player.hand.push(selected);
                // Picking from the pass pile reveals the rest of the
                // stack to the active player, so lock the turn.
                game.lockCurrentTurn();
              }
            }

            player.passed = true;
            return undefined;
          },
          'Select end-of-round card',
        );
      }
    }

    player.passed = true;
    return undefined;
  }

  private static toCardDescriptor(
    card: TCardItem,
    fallbackId: string,
  ): { id: string; [key: string]: unknown } {
    if (typeof card === 'string') {
      return { id: card };
    }
    const obj = card as Record<string, unknown>;
    return { ...obj, id: (obj.id as string) ?? fallbackId };
  }

  private static getCardItemId(card: TCardItem): string | undefined {
    if (typeof card === 'string') return card;
    return (card as { id?: string }).id;
  }
}
