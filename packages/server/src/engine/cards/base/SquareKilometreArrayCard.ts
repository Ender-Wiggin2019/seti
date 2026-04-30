import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { RefillCardRowEffect } from '@/engine/effects/cardRow/RefillCardRowEffect.js';
import { SelectCardFromCardRowEffect } from '@/engine/effects/cardRow/SelectCardFromCardRowEffect.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { extractSectorColorFromCardItem } from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

/**
 * Card No.50 - Square Kilometre Array
 *
 * This effect marks signals from displayed card colors and is intentionally
 * NOT treated as Scan action.
 */
export class SquareKilometreArray extends ImmediateCard {
  public constructor() {
    super(loadCardData('50'), {
      behavior: {},
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) =>
          this.markFromCardRow(context.player, game, 3, new Set<string>()),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private markFromCardRow(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
    markedSectorIds: Set<string>,
    selectedAny = false,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0 || game.cardRow.length === 0) {
      if (selectedAny) {
        RefillCardRowEffect.execute(game);
      }
      player.score += markedSectorIds.size * 2;
      return undefined;
    }

    return SelectCardFromCardRowEffect.execute(player, game, {
      destination: 'discard',
      includeRowIndexInSelectionId: true,
      onComplete: (cardInfo) => {
        const sectorColor = extractSectorColorFromCardItem(cardInfo.rawItem);
        const continueBatch = () =>
          this.markFromCardRow(
            player,
            game,
            remainingCount - 1,
            markedSectorIds,
            true,
          );

        if (sectorColor === null) {
          return continueBatch();
        }

        return MarkSectorSignalEffect.markByColor(
          player,
          game,
          sectorColor,
          (result) => {
            if (result !== null) {
              markedSectorIds.add(result.sectorId);
            }
            return continueBatch();
          },
        );
      },
    });
  }
}
