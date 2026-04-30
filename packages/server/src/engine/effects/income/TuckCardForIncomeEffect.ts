import { EResource } from '@seti/common/types/element';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { resolveCardIncomeType } from './incomeCardUtils.js';

const RESOURCE_GAIN_MAP = {
  [EResource.CREDIT]: { credits: 1 },
  [EResource.ENERGY]: { energy: 1 },
  [EResource.CARD]: {},
  [EResource.DATA]: { data: 1 },
  [EResource.SIGNAL_TOKEN]: { signalTokens: 1 },
} as const;

/**
 * Tuck a card from hand into the income area.
 * The tucked card's `income` type determines which income is increased.
 * The player also immediately gains 1 of that resource.
 *
 * For CARD income type, draw 1 card instead of gaining a resource.
 */
export class TuckCardForIncomeEffect {
  public static canExecute(player: IPlayer): boolean {
    return player.hand.length > 0;
  }

  /**
   * Build a self-chaining setup-tuck input driven by
   * `player.pendingSetupTucks`. Each resolution decrements the counter
   * and returns the next prompt until the counter reaches 0. Used both
   * by {@link GameSetup} when a game starts and by
   * {@link GameDeserializer} when a persisted game is rehydrated
   * mid-setup (pending inputs are not serialized).
   *
   * The counter is the single source of truth: callers don't need to
   * pass a `count`, and the chain is resumable from any intermediate
   * state.
   */
  public static executeSetupChain(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (player.pendingSetupTucks <= 0) return undefined;
    const input = TuckCardForIncomeEffect.execute(player, game, () => {
      player.pendingSetupTucks = Math.max(0, player.pendingSetupTucks - 1);
      return TuckCardForIncomeEffect.executeSetupChain(player, game);
    });

    if (!input) {
      // Defensive fallback: if setup asks for a tuck but no card can be
      // selected (e.g. malformed/legacy state), avoid a permanent action lock.
      player.pendingSetupTucks = 0;
      return undefined;
    }

    return input;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (!this.canExecute(player)) return undefined;

    const handCards = player.hand.map((_card, idx) => {
      const cardId = player.getCardIdAt(idx);
      const incomeType = resolveCardIncomeType(cardId);
      return {
        id: cardId,
        index: idx,
        incomeType: incomeType ?? EResource.CREDIT,
      };
    });

    return new SelectCard(
      player,
      {
        cards: handCards,
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selectedCardIds) => {
          const selectedId = selectedCardIds[0];
          const removed = player.removeCardById(selectedId);
          if (removed === undefined) return undefined;

          const mappedResource = player.addTuckedIncomeFromCard(removed);

          if (mappedResource) {
            if (mappedResource === EResource.CARD) {
              const drawn = game.mainDeck.drawWithReshuffle(game.random);
              if (drawn !== undefined) {
                player.hand.push(drawn);
                game.lockCurrentTurn();
              }
            } else {
              const gain =
                RESOURCE_GAIN_MAP[
                  mappedResource as keyof typeof RESOURCE_GAIN_MAP
                ];
              if (gain && Object.keys(gain).length > 0) {
                player.resources.gain(gain);
              }
            }
          }

          return onComplete?.();
        },
      },
      'Select a card to tuck for income',
    );
  }
}
