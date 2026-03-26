import { EResource } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { Computer } from './Computer.js';
import { Data } from './Data.js';
import type { DataPool } from './DataPool.js';
import { Income, type TIncomeBundle } from './Income.js';
import type { IPlayer, IPlayerInit } from './IPlayer.js';
import { Pieces } from './Pieces.js';
import type { IResourceBundle } from './Resources.js';
import { Resources } from './Resources.js';

function assertValidInteger(label: string, value: number, minValue = 0): void {
  if (!Number.isInteger(value) || value < minValue) {
    throw new GameError(
      EErrorCode.VALIDATION_ERROR,
      `${label} must be an integer >= ${minValue}`,
      { label, value, minValue },
    );
  }
}

export class Player implements IPlayer {
  public readonly id: string;

  public readonly name: string;

  public readonly color: string;

  public readonly seatIndex: number;

  public score: number;

  public resources: Resources;

  public income: Income;

  public data: Data;

  public pieces: Pieces;

  public hand: unknown[];

  public playedMissions: unknown[];

  public completedMissions: unknown[];

  public endGameCards: unknown[];

  public tuckedIncomeCards: unknown[];

  public techs: ETechId[];

  public passed: boolean;

  public probesInSpace: number;

  public probeSpaceLimit: number;

  public game: IGame | null;

  public waitingFor?: IPlayerInput;

  private moveStashCount: number;

  private pendingCardDrawCount: number;

  private pendingAnyCardDrawCount: number;

  public constructor(init: IPlayerInit) {
    this.id = init.id;
    this.name = init.name;
    this.color = init.color;
    this.seatIndex = init.seatIndex;
    assertValidInteger('seatIndex', this.seatIndex);

    this.score = init.score ?? this.seatIndex + 1;
    assertValidInteger('score', this.score);

    this.data = new Data({
      poolCount: init.dataPoolCount,
      stashCount: init.dataStashCount,
      poolMax: init.dataPoolMax,
      computerTopSlots: init.computerTopSlots,
      computerBottomSlots: init.computerBottomSlots,
    });
    const defaultResourceBundle = {
      credits: 4,
      energy: 3,
      publicity: 4,
      data: 0,
    };
    const initialResources = {
      ...defaultResourceBundle,
      ...init.resources,
      publicity: init.resources?.publicity ?? init.publicity ?? 4,
    };

    this.resources = new Resources(initialResources, {
      dataController: this.data,
    });
    assertValidInteger('publicity', this.resources.publicity);
    this.income = new Income(init.baseIncome, init.tuckedCardIncome);
    this.pieces = new Pieces(init.pieceInventory);

    this.hand = [...(init.hand ?? [])];
    this.playedMissions = [...(init.playedMissions ?? [])];
    this.completedMissions = [...(init.completedMissions ?? [])];
    this.endGameCards = [...(init.endGameCards ?? [])];
    this.tuckedIncomeCards = [...(init.tuckedIncomeCards ?? [])];
    this.techs = [...(init.techs ?? [])];

    this.passed = init.passed ?? false;
    this.probesInSpace = init.probesInSpace ?? 0;
    this.probeSpaceLimit = init.probeSpaceLimit ?? 1;
    assertValidInteger('probesInSpace', this.probesInSpace);
    assertValidInteger('probeSpaceLimit', this.probeSpaceLimit, 1);
    if (this.probesInSpace > this.probeSpaceLimit) {
      throw new GameError(
        EErrorCode.VALIDATION_ERROR,
        'probesInSpace cannot exceed probeSpaceLimit',
        {
          probesInSpace: this.probesInSpace,
          probeSpaceLimit: this.probeSpaceLimit,
        },
      );
    }

    this.moveStashCount = 0;
    this.pendingCardDrawCount = 0;
    this.pendingAnyCardDrawCount = 0;
    this.game = null;
  }

  public get publicity(): number {
    return this.resources.publicity;
  }

  public set publicity(value: number) {
    assertValidInteger('publicity', value);
    this.resources.setPublicity(value);
  }

  public get computer(): Computer {
    return this.data.computer;
  }

  public get dataPool(): DataPool {
    return this.data.dataPool;
  }

  public bindGame(game: IGame): void {
    this.game = game;
  }

  public applyRoundIncome(): TIncomeBundle {
    const payout = this.income.computeRoundPayout();
    this.resources.gain({
      credits: payout[EResource.CREDIT],
      energy: payout[EResource.ENERGY],
      publicity: payout[EResource.PUBLICITY],
      data: payout[EResource.DATA],
    });
    this.score += payout[EResource.SCORE];
    this.gainMove(payout[EResource.MOVE]);
    this.pendingCardDrawCount += payout[EResource.CARD];
    this.pendingAnyCardDrawCount += payout[EResource.CARD_ANY];
    return payout;
  }

  public gainMove(amount: number): void {
    assertValidInteger('move', amount);
    this.moveStashCount += amount;
  }

  public spendMove(amount: number): void {
    assertValidInteger('move', amount);
    if (amount > this.moveStashCount) {
      throw new GameError(
        EErrorCode.INSUFFICIENT_RESOURCES,
        'Not enough move',
        {
          requested: amount,
          current: this.moveStashCount,
        },
      );
    }
    this.moveStashCount -= amount;
  }

  public getMoveStash(): number {
    return this.moveStashCount;
  }

  public getPendingCardDrawCount(): number {
    return this.pendingCardDrawCount;
  }

  public getPendingAnyCardDrawCount(): number {
    return this.pendingAnyCardDrawCount;
  }

  public flushDataStashAtTurnEnd(): { movedToPool: number; discarded: number } {
    return this.data.flushStashToPool();
  }

  public flushTurnStashAtTurnEnd(): {
    data: { movedToPool: number; discarded: number };
    moveDiscarded: number;
  } {
    const data = this.flushDataStashAtTurnEnd();
    const moveDiscarded = this.moveStashCount;
    this.moveStashCount = 0;
    return { data, moveDiscarded };
  }

  public getResourceSnapshot(): IResourceBundle {
    return this.resources.toObject();
  }
}
