import type { TSectorWinnerBonus } from '@seti/common/constant/sectorSetup';
import { ESector, ETrace } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { IPublicSectorState } from '@seti/common/types/protocol/gameState';
import { GameError } from '@/shared/errors/GameError.js';

// ── Re-exports for convenience ──────────────────────────────────────────

export type { TSectorWinnerBonus } from '@seti/common/constant/sectorSetup';

// ── Signal types ────────────────────────────────────────────────────────

export interface IDataSignal {
  type: 'data';
  tokenId: string;
}

export interface IPlayerSignal {
  type: 'player';
  playerId: string;
}

export type TSectorSignal = IDataSignal | IPlayerSignal;

// ── Mark result ─────────────────────────────────────────────────────────

export interface ISectorMarkSignalResult {
  /** Whether a data token was displaced (player gains 1 data). */
  dataGained: boolean;
  /** VP awarded from the position where the signal was placed. */
  vpAwarded: number;
}

// ── Completion result ───────────────────────────────────────────────────

export interface ISectorCompletionResult {
  winnerPlayerId: string | null;
  secondPlacePlayerId: string | null;
  isFirstWin: boolean;
  participants: string[];
}

// ── Default bonuses (simple single-item arrays) ─────────────────────────

export const DEFAULT_FIRST_WIN_BONUS: TSectorWinnerBonus = [
  { type: 'trace', trace: ETrace.RED },
];

export const DEFAULT_REPEAT_WIN_BONUS: TSectorWinnerBonus = [
  { type: 'vp', amount: 3 },
];

// ── Init ────────────────────────────────────────────────────────────────

export interface ISectorInit {
  id: string;
  color: ESector;
  dataSlotCapacity?: number;
  firstWinBonus?: TSectorWinnerBonus;
  repeatWinBonus?: TSectorWinnerBonus;
  /** VP awarded at each slot position when a data token is displaced.
   *  Array length must equal `dataSlotCapacity`. */
  positionRewards?: number[];
}

/**
 * Build the default per-position VP rewards for a sector.
 * Signals fill right-to-left, so the 2nd signal placed lands at
 * index `capacity - 2`. That position awards 2 VP; all others award 0.
 */
function defaultPositionRewards(capacity: number): number[] {
  const rewards = new Array<number>(capacity).fill(0);
  if (capacity >= 3) {
    rewards[capacity - 2] = 2;
  }
  return rewards;
}

function assertPlayerId(playerId: string): void {
  if (playerId.trim().length === 0) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      'playerId must not be empty',
      { playerId },
    );
  }
}

// ── Sector class ────────────────────────────────────────────────────────

/**
 * A sector on the game board.
 *
 * Internally tracks a **unified signal list** where each entry is either a
 * data token or a player marker. Marking a signal replaces the rightmost
 * data token; if no data remains the marker is appended.
 *
 * The sector is "fulfilled" when no data signals remain (all replaced by
 * player markers). Fulfillment resolution determines a winner, resets the
 * sector, and places the second-place marker at position 0.
 */
export class Sector {
  public readonly id: string;

  public readonly color: ESector;

  public readonly dataSlotCapacity: number;

  public readonly firstWinBonus: TSectorWinnerBonus;

  public readonly repeatWinBonus: TSectorWinnerBonus;

  /** VP awarded at each slot position when a data token is displaced. */
  public readonly positionRewards: number[];

  /**
   * Unified signal list — each entry is either `{ type: 'data' }` or
   * `{ type: 'player', playerId }`. The array starts fully populated
   * with data signals and player markers replace data from right to left.
   */
  public signals: TSectorSignal[];

  /** History of winner player IDs across completion cycles. */
  public sectorWinners: string[];

  /** True when no data signals remain (all slots occupied by players). */
  public completed: boolean;

  private nextDataTokenId: number;

  public constructor(init: ISectorInit) {
    const capacity = init.dataSlotCapacity ?? 5;
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'dataSlotCapacity must be an integer >= 1',
        { dataSlotCapacity: capacity },
      );
    }

    this.id = init.id;
    this.color = init.color;
    this.dataSlotCapacity = capacity;
    this.firstWinBonus = init.firstWinBonus ?? DEFAULT_FIRST_WIN_BONUS;
    this.repeatWinBonus = init.repeatWinBonus ?? DEFAULT_REPEAT_WIN_BONUS;
    this.positionRewards =
      init.positionRewards ?? defaultPositionRewards(capacity);
    this.signals = [];
    this.sectorWinners = [];
    this.completed = false;
    this.nextDataTokenId = 1;

    for (let i = 0; i < capacity; i++) {
      this.signals.push(this.createDataSignal());
    }
  }

  // ── Mark signal ───────────────────────────────────────────────────────

  /**
   * Mark a signal on this sector for the given player.
   *
   * - Finds the **rightmost** data signal and replaces it with a player marker.
   *   The player gains 1 data.
   * - If no data signals remain, **appends** a player marker. The player
   *   does NOT gain data in this case.
   */
  public markSignal(playerId: string): ISectorMarkSignalResult {
    assertPlayerId(playerId);

    const rightmostDataIdx = this.findRightmostDataIndex();

    if (rightmostDataIdx >= 0) {
      const vpAwarded = this.positionRewards[rightmostDataIdx] ?? 0;
      this.signals[rightmostDataIdx] = { type: 'player', playerId };
      this.completed = this.isFulfilled();
      return { dataGained: true, vpAwarded };
    }

    this.signals.push({ type: 'player', playerId });
    return { dataGained: false, vpAwarded: 0 };
  }

  // ── Fulfillment ───────────────────────────────────────────────────────

  /** True when all data signals have been replaced by player markers. */
  public isFulfilled(): boolean {
    return (
      this.signals.length > 0 && !this.signals.some((s) => s.type === 'data')
    );
  }

  /**
   * Resolve a fulfilled sector.
   *
   * 1. Determine winner (most markers, tie-break: rightmost position)
   * 2. Determine second place (same logic, excluding winner)
   * 3. Append winner to `sectorWinners`
   * 4. Reset the sector: clear all signals, refill data, place 2nd-place
   *    marker at index 0 (replaces data, player does NOT gain data)
   */
  public resolveCompletion(): ISectorCompletionResult {
    if (!this.isFulfilled()) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Cannot resolve an unfulfilled sector',
        { sectorId: this.id },
      );
    }

    const { markerCounts, rightmostPositions, participants } =
      this.computeRanking();

    const ranking = [...participants].sort((a, b) => {
      const countDiff = (markerCounts.get(b) ?? 0) - (markerCounts.get(a) ?? 0);
      if (countDiff !== 0) return countDiff;
      return (
        (rightmostPositions.get(b) ?? 0) - (rightmostPositions.get(a) ?? 0)
      );
    });

    const winnerPlayerId = ranking[0] ?? null;
    const secondPlacePlayerId = ranking[1] ?? null;

    if (winnerPlayerId !== null) {
      this.sectorWinners.push(winnerPlayerId);
    }

    const isFirstWin =
      winnerPlayerId !== null &&
      this.sectorWinners.filter((id) => id === winnerPlayerId).length === 1;

    const result: ISectorCompletionResult = {
      winnerPlayerId,
      secondPlacePlayerId,
      isFirstWin,
      participants,
    };

    this.reset(secondPlacePlayerId);
    return result;
  }

  // ── Reset ─────────────────────────────────────────────────────────────

  /**
   * Clear all signals, refill data to capacity, optionally place a
   * second-place marker at the first position (replacing a data token).
   * The second-place marker does NOT grant data to the player.
   */
  public reset(secondPlacePlayerId: string | null = null): void {
    this.signals = [];
    this.completed = false;

    for (let i = 0; i < this.dataSlotCapacity; i++) {
      this.signals.push(this.createDataSignal());
    }

    if (secondPlacePlayerId !== null) {
      assertPlayerId(secondPlacePlayerId);
      this.signals[0] = { type: 'player', playerId: secondPlacePlayerId };
    }
  }

  // ── Query helpers ─────────────────────────────────────────────────────

  public getDataCount(): number {
    return this.signals.filter((s) => s.type === 'data').length;
  }

  public getPlayerMarkerCount(playerId?: string): number {
    if (playerId) {
      return this.signals.filter(
        (s) => s.type === 'player' && s.playerId === playerId,
      ).length;
    }
    return this.signals.filter((s) => s.type === 'player').length;
  }

  /**
   * Project to the common public state for client consumption.
   */
  public toPublicState(): IPublicSectorState {
    return {
      sectorId: this.id,
      color: this.color,
      signals: this.signals.map((s) =>
        s.type === 'data'
          ? { type: 'data' as const }
          : { type: 'player' as const, playerId: s.playerId },
      ),
      dataSlotCapacity: this.dataSlotCapacity,
      sectorWinners: [...this.sectorWinners],
      completed: this.completed,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────

  private createDataSignal(): IDataSignal {
    const tokenId = `data-${this.nextDataTokenId}`;
    this.nextDataTokenId += 1;
    return { type: 'data', tokenId };
  }

  private findRightmostDataIndex(): number {
    for (let i = this.signals.length - 1; i >= 0; i--) {
      if (this.signals[i].type === 'data') return i;
    }
    return -1;
  }

  private computeRanking(): {
    markerCounts: Map<string, number>;
    rightmostPositions: Map<string, number>;
    participants: string[];
  } {
    const markerCounts = new Map<string, number>();
    const rightmostPositions = new Map<string, number>();

    for (let i = 0; i < this.signals.length; i++) {
      const signal = this.signals[i];
      if (signal.type === 'player') {
        const pid = signal.playerId;
        markerCounts.set(pid, (markerCounts.get(pid) ?? 0) + 1);
        rightmostPositions.set(pid, i);
      }
    }

    return {
      markerCounts,
      rightmostPositions,
      participants: Array.from(markerCounts.keys()),
    };
  }
}
