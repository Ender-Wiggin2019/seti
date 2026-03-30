import { EErrorCode } from '@seti/common/types/protocol/errors';
import {
  extractSectorColorFromCardItem,
  MarkSectorSignalEffect,
} from '@/engine/effects/index.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectCard } from '@/engine/input/SelectCard.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

export enum EMarkSource {
  CARD_ROW = 'CARD_ROW',
}

export class Mark {
  public static execute(
    player: IPlayer,
    game: IGame,
    source: EMarkSource,
    count: number,
  ): IPlayerInput | undefined {
    if (count <= 0) {
      return undefined;
    }
    if (source === EMarkSource.CARD_ROW) {
      return this.markFromCardRow(player, game, count);
    }
    return undefined;
  }

  private static markFromCardRow(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0 || game.cardRow.length === 0) {
      return undefined;
    }

    const cardSelections = game.cardRow.map((card, index) => {
      const cardId =
        typeof card === 'string'
          ? card
          : ((card as { id?: string })?.id ?? `row-card-${index}`);
      return {
        id: `${cardId}@${index}`,
        rowIndex: index,
      };
    });

    return new SelectCard(
      player,
      {
        cards: cardSelections,
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selectedCardIds) => {
          const selected = cardSelections.find(
            (item) => item.id === selectedCardIds[0],
          );
          if (!selected) {
            throw new GameError(
              EErrorCode.INVALID_INPUT_RESPONSE,
              `Invalid card-row selection: ${selectedCardIds[0]}`,
            );
          }

          const selectedRowItem = game.cardRow[selected.rowIndex];
          const sectorColor = this.resolveCardSector(selectedRowItem);
          if (sectorColor !== null) {
            return MarkSectorSignalEffect.markByColor(
              player,
              game,
              sectorColor,
              () => this.markFromCardRow(player, game, remainingCount - 1),
            );
          }

          return this.markFromCardRow(player, game, remainingCount - 1);
        },
      },
      'Select displayed card for signal marking',
    );
  }

  private static resolveCardSector(card: unknown) {
    if (typeof card === 'string' && hasCardData(card)) {
      return loadCardData(card).sector ?? null;
    }
    return extractSectorColorFromCardItem(card);
  }
}
