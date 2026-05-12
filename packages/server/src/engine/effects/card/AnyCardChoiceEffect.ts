import { drawCard } from '../../deck/drawCard.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import {
  type ISelectOptionEntry,
  SelectOption,
} from '../../input/SelectOption.js';
import type { IPlayer, TCardItem } from '../../player/IPlayer.js';
import { RefillCardRowEffect } from '../cardRow/RefillCardRowEffect.js';

export class AnyCardChoiceEffect {
  public static execute(
    player: IPlayer,
    game: IGame,
    count = 1,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (count <= 0) {
      return onComplete?.();
    }
    return this.createOneChoice(player, game, () =>
      this.execute(player, game, count - 1, onComplete),
    );
  }

  private static createOneChoice(
    player: IPlayer,
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    const options: ISelectOptionEntry[] = [];

    game.cardRow.forEach((card, index) => {
      const cardId = resolveCardId(card, `row-${index}`);
      options.push({
        id: `row:${index}:${cardId}`,
        label: `Take ${cardId} from card row`,
        onSelect: () => {
          const currentIndex = game.cardRow.indexOf(card);
          const removeIndex = currentIndex >= 0 ? currentIndex : index;
          const [removed] = game.cardRow.splice(removeIndex, 1);
          if (removed !== undefined) {
            player.hand.push(removed);
            RefillCardRowEffect.execute(game);
          }
          return onComplete?.();
        },
      });
    });

    if (isDeckAvailable(game)) {
      options.push({
        id: 'deck',
        label: 'Draw from deck',
        onSelect: () => {
          drawCard(player, game, { source: 'base', count: 1 });
          return onComplete?.();
        },
      });
    }

    if (options.length === 0) {
      return onComplete?.();
    }

    if (options.length === 1) {
      return options[0].onSelect();
    }

    return new SelectOption(player, options, 'Choose any card');
  }
}

function resolveCardId(card: TCardItem, fallback: string): string {
  return typeof card === 'string' ? card : (card.id ?? fallback);
}

function isDeckAvailable(game: IGame): boolean {
  const totalSize = (game.mainDeck as { totalSize?: number }).totalSize;
  return totalSize === undefined || totalSize > 0;
}
