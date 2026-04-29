import type { IInputResponse } from '@seti/common/types/protocol/actions';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { RefillCardRowEffect } from '../cardRow/RefillCardRowEffect.js';
import {
  type ICardRowCardInfo,
  SelectCardFromCardRowEffect,
} from '../cardRow/SelectCardFromCardRowEffect.js';
import {
  type IMarkSectorSignalResult,
  MarkSectorSignalEffect,
} from './MarkSectorSignalEffect.js';
import {
  type IScanActionPoolResult,
  ScanActionPool,
} from './ScanActionPool.js';
import { extractSectorColorFromCardItem } from './ScanEffectUtils.js';

export interface IScanEffectResult {
  earthSectorSignal: IMarkSectorSignalResult | null;
  cardRowCard: ICardRowCardInfo | null;
  targetSectorSignal: IMarkSectorSignalResult | null;
  /** All sector signals marked by the scan pool itself, in resolution order. */
  signalResults?: IMarkSectorSignalResult[];
  actionPool?: IScanActionPoolResult;
  refillCount?: number;
}

export interface IScanEffectOptions {
  /** Optional override used by card-specific scan effects and tests. */
  earthSectorIndex?: number;
  /** Internal compatibility path for older scan-tech orchestration. */
  useActionPool?: boolean;
  /** Refill the card row after the scan and caller continuation complete. */
  refillCardRow?: boolean;
  /**
   * Callback fired after the full scan sequence completes.
   * Receives the accumulated results from all sub-effects.
   */
  onComplete?: (result: IScanEffectResult) => IPlayerInput | undefined;
}

/**
 * Composed effect: execute the full scan action pool without paying costs.
 *
 * This mirrors the Scan main action after costs have been paid: the player
 * resolves the same sub-action pool, including scan-tech sub-actions, and the
 * card row is refilled once the scan and caller continuation are complete.
 */
export class ScanEffect {
  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanEffectOptions = {},
  ): IPlayerInput | undefined {
    const result: IScanEffectResult = {
      earthSectorSignal: null,
      cardRowCard: null,
      targetSectorSignal: null,
    };

    if (options.useActionPool === false) {
      return this.executeBaseScan(player, game, options, result);
    }

    const capture = startSignalCapture(player, game);
    let restored = false;

    const restore = () => {
      if (restored) return;
      restored = true;
      capture.stop();
    };

    return ScanActionPool.execute(player, game, {
      earthSectorIndex: options.earthSectorIndex,
      onComplete: (poolResult) => {
        restore();

        result.signalResults = [...capture.signalResults];
        result.earthSectorSignal = capture.signalResults[0] ?? null;
        result.targetSectorSignal = capture.signalResults[1] ?? null;
        result.actionPool = poolResult;

        const continuation = options.onComplete?.(result);
        return continueAfterInput(continuation, () => {
          if (options.refillCardRow !== false) {
            result.refillCount = RefillCardRowEffect.execute(game).cardsAdded;
          } else {
            result.refillCount = 0;
          }
          return undefined;
        });
      },
    });
  }

  private static executeBaseScan(
    player: IPlayer,
    game: IGame,
    options: IScanEffectOptions,
    result: IScanEffectResult,
  ): IPlayerInput | undefined {
    const complete = (): IPlayerInput | undefined => {
      const continuation = options.onComplete?.(result);
      if (options.refillCardRow === true) {
        return continueAfterInput(continuation, () => {
          result.refillCount = RefillCardRowEffect.execute(game).cardsAdded;
          return undefined;
        });
      }
      return continuation;
    };

    const continueAfterEarthSignal = (
      earthSignal: IMarkSectorSignalResult | null,
    ): IPlayerInput | undefined => {
      result.earthSectorSignal = earthSignal;

      if (game.cardRow.length === 0) {
        result.signalResults = [earthSignal].filter(
          (signal): signal is IMarkSectorSignalResult => signal !== null,
        );
        return complete();
      }

      return SelectCardFromCardRowEffect.execute(player, game, {
        destination: 'discard',
        onComplete: (cardInfo: ICardRowCardInfo) => {
          result.cardRowCard = cardInfo;

          const sectorColor = extractSectorColorFromCardItem(cardInfo.rawItem);
          if (sectorColor) {
            return MarkSectorSignalEffect.markByColor(
              player,
              game,
              sectorColor,
              (markResult) => {
                result.targetSectorSignal = markResult;
                result.signalResults = [earthSignal, markResult].filter(
                  (signal): signal is IMarkSectorSignalResult =>
                    signal !== null,
                );
                return complete();
              },
            );
          }

          result.signalResults = [earthSignal].filter(
            (signal): signal is IMarkSectorSignalResult => signal !== null,
          );
          return complete();
        },
      });
    };

    const earthSectorIdx = options.earthSectorIndex ?? 0;
    return MarkSectorSignalEffect.markByIndexWithAlternatives(
      player,
      game,
      earthSectorIdx,
      continueAfterEarthSignal,
    );
  }
}

class ContinueAfterInput implements IPlayerInput {
  public constructor(
    private readonly input: IPlayerInput,
    private readonly continuation: () => IPlayerInput | undefined,
  ) {}

  public get inputId() {
    return this.input.inputId;
  }

  public get type() {
    return this.input.type;
  }

  public get player() {
    return this.input.player;
  }

  public get title() {
    return this.input.title;
  }

  public toModel() {
    return this.input.toModel();
  }

  public process(response: IInputResponse): IPlayerInput | undefined {
    return continueAfterInput(this.input.process(response), this.continuation);
  }
}

function continueAfterInput(
  input: IPlayerInput | undefined,
  continuation: () => IPlayerInput | undefined,
): IPlayerInput | undefined {
  if (input !== undefined) {
    return new ContinueAfterInput(input, continuation);
  }
  return continuation();
}

type TSignalCaptureSector = {
  id: string;
  completed: boolean;
  markSignal(playerId: string): { dataGained: boolean; vpAwarded: number };
};

function startSignalCapture(
  player: IPlayer,
  game: IGame,
): {
  signalResults: IMarkSectorSignalResult[];
  stop: () => void;
} {
  const signalResults: IMarkSectorSignalResult[] = [];
  const restorers: Array<() => void> = [];

  for (const sector of game.sectors) {
    if (
      sector === null ||
      typeof sector !== 'object' ||
      !('markSignal' in sector)
    ) {
      continue;
    }

    const target = sector as TSignalCaptureSector;
    const original = target.markSignal;
    target.markSignal = function captureMarkSignal(playerId: string) {
      const markResult = original.call(this, playerId);
      if (playerId === player.id) {
        signalResults.push({
          sectorId: target.id,
          dataGained: markResult.dataGained,
          vpAwarded: markResult.vpAwarded,
          completed: target.completed,
        });
      }
      return markResult;
    };
    restorers.push(() => {
      target.markSignal = original;
    });
  }

  return {
    signalResults,
    stop: () => {
      for (const restore of restorers.splice(0).reverse()) {
        restore();
      }
    },
  };
}
