import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectCard } from '@/engine/input/SelectCard.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  enqueueAnomalyCardEffect,
  gainResourceByIncome,
  incomeForCard,
  toCardId,
} from './AnomalyCardBehavior.js';

export class PartOfEverydayLifeCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ET.15'), { behavior: behaviorWithoutCustom('ET.15') });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    enqueueAnomalyCardEffect(context, (player, game) =>
      this.selectCornerDiscard(player, game),
    );
    return undefined;
  }

  private selectCornerDiscard(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (player.hand.length <= 0) return undefined;

    const handCards = player.hand.map((rawCard, idx) => ({
      id: toCardId(rawCard, `hand-${idx}`),
      index: idx,
    }));

    return new SelectCard(
      player,
      {
        cards: handCards.map((item) => ({
          id: `${item.id}@${item.index}`,
          index: item.index,
        })),
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selected) => {
          const picked = handCards.find(
            (item) => `${item.id}@${item.index}` === selected[0],
          );
          if (!picked) return undefined;

          FreeActionCornerFreeAction.execute(player, game, picked.id);
          return this.selectIncomeDiscard(player, game);
        },
      },
      'Discard 1 card to gain its free-action corner reward',
    );
  }

  private selectIncomeDiscard(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (player.hand.length <= 0) return undefined;

    const handCards = player.hand.map((rawCard, idx) => ({
      id: toCardId(rawCard, `hand-2-${idx}`),
      index: idx,
    }));

    return new SelectCard(
      player,
      {
        cards: handCards.map((item) => ({
          id: `${item.id}@${item.index}`,
          index: item.index,
        })),
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selected) => {
          const picked = handCards.find(
            (item) => `${item.id}@${item.index}` === selected[0],
          );
          if (!picked) return undefined;

          const removed = player.removeCardById(picked.id);
          if (removed === undefined) return undefined;
          game.mainDeck.discard(picked.id);

          const income = incomeForCard(picked.id);
          if (income !== undefined) {
            gainResourceByIncome(player, game, income);
          }
          return undefined;
        },
      },
      'Discard 1 card to gain the resource matching its income',
    );
  }
}
