import { ETechBonusType, type ITechBonusToken } from '@seti/common/types/tech';
import { drawCard } from '../../deck/drawCard.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import {
  type ISelectOptionEntry,
  SelectOption,
} from '../../input/SelectOption.js';
import type { IPlayer, TCardItem } from '../../player/IPlayer.js';
import { RefillCardRowEffect } from '../cardRow/RefillCardRowEffect.js';
import { LaunchProbeEffect } from '../probe/LaunchProbeEffect.js';

export interface ITechBonusResult {
  bonus: ITechBonusToken;
  applied: boolean;
}

/**
 * Resolves a one-time bonus token from an acquired tech tile.
 */
export class TechBonusEffect {
  public static createAnyCardChoice(
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

  public static apply(
    player: IPlayer,
    game: IGame,
    bonus: ITechBonusToken,
  ): ITechBonusResult {
    switch (bonus.type) {
      case ETechBonusType.ENERGY:
        player.resources.gain({ energy: 1 });
        break;

      case ETechBonusType.DATA:
        player.resources.gain({ data: 1 });
        break;

      case ETechBonusType.DATA_2:
        player.resources.gain({ data: 2 });
        break;

      case ETechBonusType.PUBLICITY:
        player.resources.gain({ publicity: 1 });
        break;

      case ETechBonusType.CARD:
        throw new Error(
          'Tech bonus CARD requires createAnyCardChoice for card row/deck selection.',
        );

      case ETechBonusType.CREDIT:
        player.resources.gain({ credits: 1 });
        break;

      case ETechBonusType.VP_2:
        player.score += 2;
        break;

      case ETechBonusType.VP_3:
        player.score += 3;
        break;

      case ETechBonusType.LAUNCH_IGNORE_LIMIT:
        if (!LaunchProbeEffect.canExecute(player, game)) {
          return { bonus, applied: false };
        }
        LaunchProbeEffect.execute(player, game);
        break;
    }
    return { bonus, applied: true };
  }
}

function resolveCardId(card: TCardItem, fallback: string): string {
  return typeof card === 'string' ? card : (card.id ?? fallback);
}

function isDeckAvailable(game: IGame): boolean {
  const totalSize = (game.mainDeck as { totalSize?: number }).totalSize;
  return totalSize === undefined || totalSize > 0;
}
