import { EResource } from '@seti/common/types/element';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import type { IPlayer } from '../../player/IPlayer.js';

const INCOME_RESOURCE_MAP: Record<string, keyof typeof RESOURCE_GAIN_MAP> = {
  [EResource.CREDIT]: EResource.CREDIT,
  [EResource.ENERGY]: EResource.ENERGY,
  [EResource.CARD]: EResource.CARD,
  [EResource.DATA]: EResource.DATA,
};

const RESOURCE_GAIN_MAP = {
  [EResource.CREDIT]: { credits: 1 },
  [EResource.ENERGY]: { energy: 1 },
  [EResource.CARD]: {},
  [EResource.DATA]: { data: 1 },
} as const;

function resolveCardIncomeType(cardId: string): EResource | undefined {
  if (!hasCardData(cardId)) return undefined;
  const data = loadCardData(cardId);
  return data.income;
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

  public static execute(
    player: IPlayer,
    game: IGame,
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

          player.tuckedIncomeCards.push(removed);

          const incomeType = resolveCardIncomeType(selectedId);
          const mappedResource = incomeType
            ? INCOME_RESOURCE_MAP[incomeType]
            : undefined;

          if (mappedResource) {
            player.income.addTuckedIncome(mappedResource as EResource);

            if (mappedResource === EResource.CARD) {
              const drawn = game.mainDeck.drawWithReshuffle(game.random);
              if (drawn !== undefined) {
                player.hand.push(drawn);
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

          return undefined;
        },
      },
      'Select a card to tuck for income',
    );
  }
}
