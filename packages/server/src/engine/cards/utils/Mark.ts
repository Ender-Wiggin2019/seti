import { ESector } from '@seti/common/types/element';
import {
  extractSectorColorFromCardItem,
  MarkSectorSignalEffect,
  RefillCardRowEffect,
  SelectCardFromCardRowEffect,
} from '@/engine/effects/index.js';
import type { IGame } from '@/engine/IGame.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { hasCardData, loadCardData } from '../loadCardData.js';

export enum EMarkSource {
  CARD_ROW = 'CARD_ROW',
  ANY = 'ANY',
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
    if (source === EMarkSource.ANY) {
      return this.markAnySignal(player, game, count);
    }
    return undefined;
  }

  private static markAnySignal(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0) {
      return undefined;
    }

    return new SelectOption(
      player,
      [
        { id: 'any-signal-red', label: 'Red signal', sector: ESector.RED },
        {
          id: 'any-signal-yellow',
          label: 'Yellow signal',
          sector: ESector.YELLOW,
        },
        {
          id: 'any-signal-blue',
          label: 'Blue signal',
          sector: ESector.BLUE,
        },
        {
          id: 'any-signal-black',
          label: 'Black signal',
          sector: ESector.BLACK,
        },
      ].map((option) => ({
        id: option.id,
        label: option.label,
        onSelect: () =>
          MarkSectorSignalEffect.markByColor(player, game, option.sector, () =>
            this.markAnySignal(player, game, remainingCount - 1),
          ),
      })),
      'Choose signal color to mark',
    );
  }

  private static markFromCardRow(
    player: IPlayer,
    game: IGame,
    remainingCount: number,
    selectedAny = false,
  ): IPlayerInput | undefined {
    if (remainingCount <= 0 || game.cardRow.length === 0) {
      if (selectedAny) {
        RefillCardRowEffect.execute(game);
      }
      return undefined;
    }

    return SelectCardFromCardRowEffect.execute(player, game, {
      destination: 'discard',
      includeRowIndexInSelectionId: true,
      onComplete: (cardInfo) => {
        const sectorColor = this.resolveCardSector(cardInfo.rawItem);
        const continueBatch = () =>
          this.markFromCardRow(player, game, remainingCount - 1, true);

        if (sectorColor !== null) {
          return MarkSectorSignalEffect.markByColor(
            player,
            game,
            sectorColor,
            continueBatch,
          );
        }

        return continueBatch();
      },
    });
  }

  private static resolveCardSector(card: unknown) {
    if (typeof card === 'string' && hasCardData(card)) {
      return loadCardData(card).sector ?? null;
    }
    return extractSectorColorFromCardItem(card);
  }
}
