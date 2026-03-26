import { ESector } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

export type TDataToken = string;

export interface ISectorMarker {
  playerId: string;
  timestamp: number;
}

export interface ISectorOverflowMarker {
  playerId: string;
}

export interface ISectorWinnerMarker {
  playerId: string;
  reward: number;
}

export interface ISectorMarkSignalResult {
  dataGained: TDataToken | null;
  vpGained: number;
}

export interface ISectorCompletionResult {
  winnerPlayerId: string | null;
  secondPlacePlayerId: string | null;
  winnerReward: number;
  participants: string[];
  publicityGains: Record<string, number>;
}

export interface ISectorInit {
  id: string;
  color: ESector;
  dataSlotCapacity?: number;
  winnerReward?: number;
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

export class Sector {
  public readonly id: string;

  public readonly color: ESector;

  public readonly dataSlots: Array<TDataToken | null>;

  public readonly markerSlots: ISectorMarker[];

  public readonly overflowMarkers: ISectorOverflowMarker[];

  public readonly winnerMarkers: ISectorWinnerMarker[];

  public completed: boolean;

  private readonly winnerRewardValue: number;

  private nextDataTokenId: number;

  private nextTimestamp: number;

  private markerHistory: ISectorMarker[];

  public constructor(init: ISectorInit) {
    if (
      !Number.isInteger(init.dataSlotCapacity ?? 2) ||
      (init.dataSlotCapacity ?? 2) < 1
    ) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'dataSlotCapacity must be an integer >= 1',
        { dataSlotCapacity: init.dataSlotCapacity },
      );
    }
    if (
      !Number.isInteger(init.winnerReward ?? 3) ||
      (init.winnerReward ?? 3) < 0
    ) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'winnerReward must be an integer >= 0',
        { winnerReward: init.winnerReward },
      );
    }

    this.id = init.id;
    this.color = init.color;
    this.dataSlots = [];
    this.markerSlots = [];
    this.overflowMarkers = [];
    this.winnerMarkers = [];
    this.completed = false;

    this.winnerRewardValue = init.winnerReward ?? 3;
    this.nextDataTokenId = 1;
    this.nextTimestamp = 1;
    this.markerHistory = [];

    const dataSlotCapacity = init.dataSlotCapacity ?? 2;
    for (let index = 0; index < dataSlotCapacity; index += 1) {
      this.dataSlots.push(this.createDataToken());
    }
  }

  public markSignal(playerId: string): ISectorMarkSignalResult {
    assertPlayerId(playerId);

    let dataGained: TDataToken | null = null;
    const markerPosition = this.markerSlots.length;
    if (markerPosition < this.dataSlots.length && !this.isComplete()) {
      dataGained = this.removeLeftmostDataToken();
    }

    if (markerPosition < this.dataSlots.length) {
      const marker: ISectorMarker = {
        playerId,
        timestamp: this.nextTimestamp,
      };
      this.nextTimestamp += 1;
      this.markerSlots.push(marker);
      this.markerHistory.push(marker);
    } else {
      this.overflowMarkers.push({ playerId });
      this.markerHistory.push({
        playerId,
        timestamp: this.nextTimestamp,
      });
      this.nextTimestamp += 1;
    }

    this.completed = this.isComplete();

    return {
      dataGained,
      vpGained: markerPosition === 1 ? 2 : 0,
    };
  }

  public resolveCompletion(): ISectorCompletionResult {
    if (!this.completed) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'Cannot resolve an incomplete sector',
        {
          sectorId: this.id,
        },
      );
    }

    const markerCountByPlayer = new Map<string, number>();
    const latestTimestampByPlayer = new Map<string, number>();
    for (const marker of this.markerHistory) {
      markerCountByPlayer.set(
        marker.playerId,
        (markerCountByPlayer.get(marker.playerId) ?? 0) + 1,
      );
      latestTimestampByPlayer.set(marker.playerId, marker.timestamp);
    }

    const participants = Array.from(markerCountByPlayer.keys());
    const ranking = [...participants].sort((left, right) => {
      const countDiff =
        (markerCountByPlayer.get(right) ?? 0) -
        (markerCountByPlayer.get(left) ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }
      return (
        (latestTimestampByPlayer.get(right) ?? 0) -
        (latestTimestampByPlayer.get(left) ?? 0)
      );
    });

    const winnerPlayerId = ranking[0] ?? null;
    const secondPlacePlayerId = ranking[1] ?? null;

    if (winnerPlayerId !== null) {
      this.winnerMarkers.push({
        playerId: winnerPlayerId,
        reward: this.winnerRewardValue,
      });
    }

    const publicityGains: Record<string, number> = {};
    for (const playerId of participants) {
      publicityGains[playerId] = 1;
    }

    const result: ISectorCompletionResult = {
      winnerPlayerId,
      secondPlacePlayerId,
      winnerReward: winnerPlayerId === null ? 0 : this.winnerRewardValue,
      participants,
      publicityGains,
    };

    this.reset(secondPlacePlayerId);
    return result;
  }

  public isComplete(): boolean {
    return this.dataSlots.every((dataToken) => dataToken === null);
  }

  public reset(secondPlacePlayerId: string | null = null): void {
    for (let index = 0; index < this.dataSlots.length; index += 1) {
      this.dataSlots[index] = this.createDataToken();
    }
    this.markerSlots.length = 0;
    this.overflowMarkers.length = 0;
    this.markerHistory = [];
    this.completed = false;

    if (secondPlacePlayerId !== null) {
      assertPlayerId(secondPlacePlayerId);

      const retainedMarker: ISectorMarker = {
        playerId: secondPlacePlayerId,
        timestamp: this.nextTimestamp,
      };
      this.nextTimestamp += 1;
      this.markerSlots.push(retainedMarker);
      this.markerHistory.push(retainedMarker);

      // The retained marker occupies the first signal position after reset.
      this.removeLeftmostDataToken();
      this.completed = this.isComplete();
    }
  }

  private createDataToken(): TDataToken {
    const token = `data-${this.nextDataTokenId}`;
    this.nextDataTokenId += 1;
    return token;
  }

  private removeLeftmostDataToken(): TDataToken | null {
    const leftmostIndex = this.dataSlots.findIndex(
      (dataToken) => dataToken !== null,
    );
    if (leftmostIndex < 0) {
      return null;
    }

    const removed = this.dataSlots[leftmostIndex];
    for (
      let index = leftmostIndex;
      index < this.dataSlots.length - 1;
      index += 1
    ) {
      this.dataSlots[index] = this.dataSlots[index + 1];
    }
    this.dataSlots[this.dataSlots.length - 1] = null;
    return removed;
  }
}
