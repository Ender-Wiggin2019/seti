import type { IGame } from '../../IGame.js';

export interface IRefillCardRowResult {
  cardsAdded: number;
}

/**
 * Atomic effect: draw from the main deck to refill the card row
 * back to its expected size.
 *
 * Non-interactive, no costs.
 */
export class RefillCardRowEffect {
  /**
   * @param targetSize – desired card row length (defaults to 3)
   */
  public static execute(game: IGame, targetSize = 3): IRefillCardRowResult {
    let cardsAdded = 0;
    while (game.cardRow.length < targetSize) {
      const card = game.mainDeck.draw();
      if (card === undefined) break;
      game.cardRow.push(card);
      cardsAdded++;
    }
    if (cardsAdded > 0) {
      game.lockCurrentTurn();
    }
    return { cardsAdded };
  }
}
