import type {
  TSectorWinnerBonus,
  TSectorWinnerBonusItem,
} from '@seti/common/constant/sectorSetup';
import { ETrace } from '@seti/common/types/element';
import type { ISectorCompletionResult, Sector } from '../../board/Sector.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EPieceType } from '../../player/Pieces.js';

export interface ISectorFulfillmentResult {
  sectorId: string;
  completion: ISectorCompletionResult;
}

export type TOnSectorResolved = (sectorId: string) => void;

/**
 * Check all sectors for fulfillment after a full main action's effect
 * chain has settled (enqueued as a {@link ResolveSectorCompletion}
 * deferred action in the main-action pipeline).
 *
 * Rule §5.4 / 5.13 — when multiple sectors fulfill at the same time,
 * the **turn owner chooses the resolution order**. We surface a
 * `SelectOption` input with one entry per fulfilled sector and let the
 * active player pick the next one to resolve; the chain recurses until
 * every fulfilled sector has been resolved.
 *
 * Fallback: when `turnOwner` is not provided (legacy callers / unit
 * tests that do not care about ordering), sectors resolve in board
 * order without prompting. A single fulfilled sector also resolves
 * directly (no prompt needed).
 */
export class SectorFulfillmentEffect {
  public static checkAll(
    game: IGame,
    onComplete?: () => IPlayerInput | undefined,
    turnOwner?: IPlayer,
    onSectorResolved?: TOnSectorResolved,
  ): IPlayerInput | undefined {
    const fulfilled = game.sectors.filter((s) => s.isFulfilled());
    return this.resolveChoice(
      fulfilled,
      game,
      turnOwner,
      onComplete,
      onSectorResolved,
    );
  }

  /**
   * Drive the resolution of a set of fulfilled sectors:
   *   - 0 sectors → invoke `onComplete`.
   *   - 1 sector (or no turn owner available) → resolve directly in
   *     board order, preserving the legacy non-interactive path for
   *     unit tests that don't pass a `turnOwner`.
   *   - 2+ sectors with a turn owner → prompt the owner to pick which
   *     sector to resolve next, then recurse on the remainder.
   */
  private static resolveChoice(
    sectors: Sector[],
    game: IGame,
    turnOwner: IPlayer | undefined,
    onComplete?: () => IPlayerInput | undefined,
    onSectorResolved?: TOnSectorResolved,
  ): IPlayerInput | undefined {
    if (sectors.length === 0) {
      return onComplete?.();
    }

    if (sectors.length === 1 || !turnOwner) {
      const [next, ...rest] = sectors;
      return this.resolveSector(
        next,
        game,
        () =>
          this.resolveChoice(
            rest,
            game,
            turnOwner,
            onComplete,
            onSectorResolved,
          ),
        onSectorResolved,
      );
    }

    return new SelectOption(
      turnOwner,
      sectors.map((sector) => ({
        id: `resolve-sector-${sector.id}`,
        label: `Resolve sector ${sector.id}`,
        onSelect: () => {
          const remaining = sectors.filter((s) => s !== sector);
          return this.resolveSector(
            sector,
            game,
            () =>
              this.resolveChoice(
                remaining,
                game,
                turnOwner,
                onComplete,
                onSectorResolved,
              ),
            onSectorResolved,
          );
        },
      })),
      'Choose which fulfilled sector to resolve next',
    );
  }

  private static resolveSector(
    sector: Sector,
    game: IGame,
    onDone: () => IPlayerInput | undefined,
    onSectorResolved?: TOnSectorResolved,
  ): IPlayerInput | undefined {
    // Snapshot per-player marker counts before reset so we can return
    // the correct number of sector-marker pieces to each player. After
    // reset the second-place player keeps exactly one marker on slot 0.
    const preResolveCounts = new Map<string, number>();
    for (const signal of sector.signals) {
      if (signal.type === 'player') {
        preResolveCounts.set(
          signal.playerId,
          (preResolveCounts.get(signal.playerId) ?? 0) + 1,
        );
      }
    }

    const result = sector.resolveCompletion();
    onSectorResolved?.(sector.id);

    for (const playerId of result.participants) {
      const player = game.players.find((p) => p.id === playerId);
      if (player) {
        player.resources.gain({ publicity: 1 });

        const placed = preResolveCounts.get(playerId) ?? 0;
        const keepsOne = playerId === result.secondPlacePlayerId ? 1 : 0;
        // Clamp to the player's currently deployed markers so callers
        // that mark sectors without first routing through the deploy
        // bookkeeping (legacy direct `sector.markSignal` in unit tests)
        // are not affected by this piece-tracking return path.
        const deployed = player.pieces.deployed(EPieceType.SECTOR_MARKER);
        const toReturn = Math.min(Math.max(placed - keepsOne, 0), deployed);
        for (let i = 0; i < toReturn; i += 1) {
          player.pieces.return(EPieceType.SECTOR_MARKER);
        }
      }
    }

    if (result.winnerPlayerId) {
      const winner = game.players.find((p) => p.id === result.winnerPlayerId);
      if (winner) {
        const bonus = result.isFirstWin
          ? sector.firstWinBonus
          : sector.repeatWinBonus;
        return this.applyWinnerBonuses(winner, game, bonus, onDone);
      }
    }

    return onDone();
  }

  /**
   * Apply all bonus items in a compound bonus sequentially.
   * Synchronous items (trace, vp) are applied immediately.
   */
  private static applyWinnerBonuses(
    player: IPlayer,
    game: IGame,
    bonus: TSectorWinnerBonus,
    onDone: () => IPlayerInput | undefined,
    index = 0,
  ): IPlayerInput | undefined {
    if (index >= bonus.length) {
      return onDone();
    }

    const item = bonus[index];
    return this.applyBonusItem(player, game, item, () =>
      this.applyWinnerBonuses(player, game, bonus, onDone, index + 1),
    );
  }

  private static applyBonusItem(
    player: IPlayer,
    game: IGame,
    item: TSectorWinnerBonusItem,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    switch (item.type) {
      case 'trace':
        if (!game.alienState) {
          this.addTrace(player, item.trace);
          return onDone();
        }
        return game.alienState.createTraceInput(player, game, item.trace, {
          onComplete: onDone,
        });
      case 'vp':
        player.score += item.amount;
        return onDone();
    }
  }

  private static addTrace(player: IPlayer, trace: ETrace): void {
    player.traces[trace] = (player.traces[trace] ?? 0) + 1;
  }
}
