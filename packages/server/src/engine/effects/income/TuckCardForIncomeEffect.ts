import { ORGANIZATIONS_BY_ID } from '@seti/common/data/organizations';
import { EResource } from '@seti/common/types/element';
import type { ISetupTuckProgressMetadata } from '@seti/common/types/protocol/playerInput';
import { BaseCorporation } from '../../corporation/BaseCorporation.js';
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

interface ITuckCardForIncomeOptions {
  allowSkip?: boolean;
  setupTuckProgress?: ISetupTuckProgressMetadata;
  onComplete?: () => IPlayerInput | undefined;
}

function getSetupTuckTotal(player: IPlayer, chainTotal?: number): number {
  if (chainTotal !== undefined) return chainTotal;
  const organizationId = player.organizationIds[0];
  const organizationTotal =
    organizationId !== undefined
      ? ORGANIZATIONS_BY_ID[organizationId]?.setup.tuckIncome
      : undefined;
  return Math.max(
    player.pendingSetupTucks,
    organizationTotal ?? BaseCorporation.startActions.tuckIncome,
  );
}

function getSetupTuckProgress(
  player: IPlayer,
  chainTotal?: number,
): ISetupTuckProgressMetadata | undefined {
  const total = getSetupTuckTotal(player, chainTotal);
  if (total <= 1) return undefined;
  return {
    current: Math.min(total, Math.max(1, total - player.pendingSetupTucks + 1)),
    total,
  };
}

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
    chainTotal?: number,
  ): IPlayerInput | undefined {
    if (player.pendingSetupTucks <= 0) return undefined;
    const setupTuckProgress = getSetupTuckProgress(player, chainTotal);
    const input = TuckCardForIncomeEffect.execute(player, game, {
      allowSkip: false,
      setupTuckProgress,
      onComplete: () => {
        player.pendingSetupTucks = Math.max(0, player.pendingSetupTucks - 1);
        return TuckCardForIncomeEffect.executeSetupChain(
          player,
          game,
          setupTuckProgress?.total ?? chainTotal,
        );
      },
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
    onCompleteOrOptions?:
      | (() => IPlayerInput | undefined)
      | ITuckCardForIncomeOptions,
  ): IPlayerInput | undefined {
    if (!this.canExecute(player)) return undefined;
    const options =
      typeof onCompleteOrOptions === 'function'
        ? { onComplete: onCompleteOrOptions }
        : (onCompleteOrOptions ?? {});
    const allowSkip = options.allowSkip ?? true;

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
        minSelections: allowSkip ? 0 : 1,
        maxSelections: 1,
        setupTuckProgress: options.setupTuckProgress,
        onSelect: (selectedCardIds) => {
          const selectedId = selectedCardIds[0];
          if (selectedId === undefined) return options.onComplete?.();

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

          return options.onComplete?.();
        },
      },
      'Select a card to tuck for income',
    );
  }
}
