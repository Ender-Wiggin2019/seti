import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { ILaunchProbeEffectResult } from '../probe/LaunchProbeEffect.js';
import { LaunchProbeEffect } from '../probe/LaunchProbeEffect.js';
import type { IMarkSectorSignalResult } from './MarkSectorSignalEffect.js';
import { MarkSectorSignalEffect } from './MarkSectorSignalEffect.js';
import { extractSectorColorFromCardItem } from './ScanEffectUtils.js';

const MERCURY_SIGNAL_PUBLICITY_COST = 1;
const ENERGY_LAUNCH_ENERGY_COST = 1;

export interface IScanEarthNeighborOptions {
  earthSectorIndex: number;
  selectedSectorIndex?: number;
  sectorCount?: number;
}

export interface IScanMercurySignalOptions {
  mercurySectorIndex: number;
  onComplete?: (
    result: IMarkSectorSignalResult | null,
  ) => IPlayerInput | undefined;
}

export interface IScanHandSignalResult {
  discardedCardId: string;
  markedSignal: IMarkSectorSignalResult | null;
}

export interface IScanHandSignalOptions {
  onComplete?: (
    result: IScanHandSignalResult | null,
  ) => IPlayerInput | undefined;
}

export type TEnergyLaunchChoice = 'launch' | 'move';

export type IScanEnergyLaunchResult =
  | { choice: 'launch'; launchResult: ILaunchProbeEffectResult }
  | { choice: 'move'; movementGained: number };

export interface IScanEnergyLaunchOptions {
  onComplete?: (result: IScanEnergyLaunchResult) => IPlayerInput | undefined;
}

export class ScanEarthNeighborEffect {
  public static getAdjacentSectorIndexes(
    earthSectorIndex: number,
    sectorCount: number,
  ): [number, number] {
    const normalizedEarth = this.normalizeSectorIndex(
      earthSectorIndex,
      sectorCount,
    );
    const left = (normalizedEarth - 1 + sectorCount) % sectorCount;
    const right = (normalizedEarth + 1) % sectorCount;
    return [left, right];
  }

  public static canExecute(
    earthSectorIndex: number,
    targetSectorIndex: number,
    sectorCount: number,
  ): boolean {
    const [left, right] = this.getAdjacentSectorIndexes(
      earthSectorIndex,
      sectorCount,
    );
    const normalizedTarget = this.normalizeSectorIndex(
      targetSectorIndex,
      sectorCount,
    );
    return normalizedTarget === left || normalizedTarget === right;
  }

  public static resolveEarthSignalSector(
    options: IScanEarthNeighborOptions,
  ): number {
    const sectorCount = options.sectorCount ?? 8;
    const selectedSectorIndex =
      options.selectedSectorIndex ?? options.earthSectorIndex;

    if (selectedSectorIndex === options.earthSectorIndex) {
      return this.normalizeSectorIndex(options.earthSectorIndex, sectorCount);
    }

    if (
      !this.canExecute(
        options.earthSectorIndex,
        selectedSectorIndex,
        sectorCount,
      )
    ) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Selected sector is not adjacent to earth sector',
        {
          earthSectorIndex: options.earthSectorIndex,
          selectedSectorIndex: options.selectedSectorIndex,
          sectorCount,
        },
      );
    }

    return this.normalizeSectorIndex(selectedSectorIndex, sectorCount);
  }

  private static normalizeSectorIndex(
    index: number,
    sectorCount: number,
  ): number {
    if (!Number.isInteger(sectorCount) || sectorCount <= 0) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'sectorCount must be a positive integer',
        { sectorCount },
      );
    }

    if (!Number.isInteger(index)) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'index must be an integer',
        {
          index,
        },
      );
    }

    return ((index % sectorCount) + sectorCount) % sectorCount;
  }
}

export class ScanMercurySignalEffect {
  public static canExecute(player: IPlayer): boolean {
    return player.resources.has({ publicity: MERCURY_SIGNAL_PUBLICITY_COST });
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanMercurySignalOptions,
  ): IPlayerInput | undefined {
    if (!this.canExecute(player)) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough publicity for mercury signal',
        { playerId: player.id },
      );
    }

    player.resources.spend({ publicity: MERCURY_SIGNAL_PUBLICITY_COST });
    const markResult = MarkSectorSignalEffect.markByIndex(
      player,
      game,
      options.mercurySectorIndex,
    );
    return options.onComplete?.(markResult);
  }
}

interface IResolvedHandCard {
  selectionId: string;
  discardCardId: string;
  handIndex: number;
}

export class ScanHandSignalEffect {
  public static canExecute(player: IPlayer): boolean {
    return player.hand.length > 0;
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanHandSignalOptions = {},
  ): IPlayerInput | undefined {
    if (!this.canExecute(player)) {
      return options.onComplete?.(null);
    }

    const handCards = this.resolveHandCards(player);
    return new SelectCard(
      player,
      {
        cards: handCards.map((card) => ({ id: card.cardId })),
        minSelections: 1,
        maxSelections: 1,
        onSelect: (selectedCardIds) => {
          const selectedCard = handCards.find(
            (card) => card.selectionId === selectedCardIds[0],
          );

          if (!selectedCard) {
            throw new GameError(
              EErrorCode.INVALID_INPUT_RESPONSE,
              `Invalid hand card selection: ${selectedCardIds[0]}`,
            );
          }

          const [discardedCard] = player.hand.splice(selectedCard.handIndex, 1);
          if (discardedCard === undefined) {
            throw new GameError(
              EErrorCode.INTERNAL_SERVER_ERROR,
              'Failed to discard selected hand card',
              { playerId: player.id, handIndex: selectedCard.handIndex },
            );
          }

          const sectorColor = extractSectorColorFromCardItem(discardedCard);
          const markResult =
            sectorColor === null
              ? null
              : MarkSectorSignalEffect.markByColor(player, game, sectorColor);

          game.mainDeck.discard(selectedCard.discardCardId);

          return options.onComplete?.({
            discardedCardId: selectedCard.discardCardId,
            markedSignal: markResult,
          });
        },
      },
      'Select a hand card to discard for signal',
    );
  }

  private static resolveHandCards(player: IPlayer): IResolvedHandCard[] {
    return player.hand.map((card, index) => {
      const baseId =
        typeof card === 'string'
          ? card
          : ((card as { id?: string })?.id ?? `hand-card-${index}`);

      return {
        selectionId: `${baseId}@${index}`,
        discardCardId: baseId,
        handIndex: index,
      };
    });
  }
}

export class ScanEnergyLaunchEffect {
  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanEnergyLaunchOptions = {},
  ): IPlayerInput {
    const optionEntries = [
      {
        id: 'move',
        label: 'Gain 1 movement',
        onSelect: () => {
          player.gainMove(1);
          return options.onComplete?.({
            choice: 'move',
            movementGained: 1,
          });
        },
      },
    ];

    if (this.canUseLaunch(player, game)) {
      optionEntries.unshift({
        id: 'launch',
        label: 'Pay 1 energy to launch a probe',
        onSelect: () => {
          player.resources.spend({ energy: ENERGY_LAUNCH_ENERGY_COST });
          const launchResult = LaunchProbeEffect.execute(player, game);
          return options.onComplete?.({
            choice: 'launch',
            launchResult,
          });
        },
      });
    }

    return new SelectOption(
      player,
      optionEntries,
      'Select Scan Energy Launch effect',
    );
  }

  private static canUseLaunch(player: IPlayer, game: IGame): boolean {
    if (!player.resources.has({ energy: ENERGY_LAUNCH_ENERGY_COST })) {
      return false;
    }
    return LaunchProbeEffect.canExecute(player, game);
  }
}
