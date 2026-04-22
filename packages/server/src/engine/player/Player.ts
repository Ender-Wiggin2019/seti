import { EResource, ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import type { ETechId } from '@seti/common/types/tech';
import { GameError } from '@/shared/errors/GameError.js';
import { SimpleDeferredAction } from '../deferred/SimpleDeferredAction.js';
import type {
  ILandOptions,
  ILandResult,
} from '../effects/probe/LandProbeEffect.js';
import { LandProbeEffect } from '../effects/probe/LandProbeEffect.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { EMissionEventType } from '../missions/IMission.js';
import type { Computer } from './Computer.js';
import { Data } from './Data.js';
import type { DataPool } from './DataPool.js';
import { Income, type TIncomeBundle } from './Income.js';
import type { IPlayer, IPlayerInit, TCardItem } from './IPlayer.js';
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

  public hand: TCardItem[];

  public playedMissions: TCardItem[];

  public completedMissions: TCardItem[];

  public endGameCards: TCardItem[];

  public tuckedIncomeCards: TCardItem[];

  public techs: ETechId[];

  public traces: Partial<Record<ETrace, number>>;

  public tracesByAlien: Record<number, Partial<Record<ETrace, number>>>;

  public passed: boolean;

  public probesInSpace: number;

  public probeSpaceLimit: number;

  public handLimitAfterPass: number;

  public pendingSetupTucks: number;

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
      columnConfigs: init.computerColumnConfigs,
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
    this.traces = {
      [ETrace.RED]: init.traces?.[ETrace.RED] ?? 0,
      [ETrace.YELLOW]: init.traces?.[ETrace.YELLOW] ?? 0,
      [ETrace.BLUE]: init.traces?.[ETrace.BLUE] ?? 0,
      [ETrace.ANY]: init.traces?.[ETrace.ANY] ?? 0,
    };
    this.tracesByAlien = { ...(init.tracesByAlien ?? {}) };

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

    this.handLimitAfterPass = init.handLimitAfterPass ?? 4;
    assertValidInteger('handLimitAfterPass', this.handLimitAfterPass, 0);

    this.pendingSetupTucks = init.pendingSetupTucks ?? 0;
    assertValidInteger('pendingSetupTucks', this.pendingSetupTucks, 0);

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
    return this.applyIncomePayout(this.income.computeRoundPayout());
  }

  /**
   * End-of-round income: round 1 pays base corporation income only (setup tuck
   * does not recur yet). From round 2 onward, base + tucked stacks per Income.
   */
  public applyEndOfRoundIncome(round: number): TIncomeBundle {
    const payout =
      round === 1
        ? { ...this.income.baseIncome }
        : this.income.computeRoundPayout();
    return this.applyIncomePayout(payout);
  }

  private applyIncomePayout(payout: TIncomeBundle): TIncomeBundle {
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

  public gainTech(techId: ETechId): void {
    if (this.techs.includes(techId)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Player already owns this tech',
        { playerId: this.id, techId },
      );
    }

    this.techs.push(techId);
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

  public canLand(planet: EPlanet, options: ILandOptions = {}): boolean {
    const game = this.game;
    if (!game || planet === EPlanet.EARTH) return false;
    if (!LandProbeEffect.canExecute(this, game, planet, options)) return false;
    const cost = LandProbeEffect.getLandingCost(this, game, planet, options);
    return this.resources.has({ energy: cost });
  }

  public getLandingCost(planet: EPlanet, options: ILandOptions = {}): number {
    const game = this.game;
    if (!game) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Player is not bound to a game',
      );
    }
    return LandProbeEffect.getLandingCost(this, game, planet, options);
  }

  public land(planet: EPlanet, options: ILandOptions = {}): ILandResult {
    const game = this.game;
    if (!game) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Player is not bound to a game',
      );
    }
    if (!this.canLand(planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Land action is not currently legal',
        { playerId: this.id, planet, isMoon: options.isMoon ?? false },
      );
    }

    const cost = LandProbeEffect.getLandingCost(this, game, planet, options);
    this.resources.spend({ energy: cost });
    const result = LandProbeEffect.execute(this, game, planet, options);

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_LANDED,
      planet,
      isMoon: result.isMoon,
    });

    if (result.lifeTraceGained > 0) {
      for (let i = 0; i < result.lifeTraceGained; i++) {
        game.deferredActions.push(
          new SimpleDeferredAction(this, (g) =>
            g.alienState.createTraceInput(this, g, ETrace.ANY),
          ),
        );
      }
    }

    return result;
  }

  public getCardIdAt(index: number): string {
    if (index < 0 || index >= this.hand.length) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Card index out of range',
        { index, handSize: this.hand.length },
      );
    }
    const card = this.hand[index];
    if (typeof card === 'string') {
      return card;
    }
    const cardId = (card as { id?: string })?.id;
    if (!cardId) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Card at index does not have a valid id',
        { index },
      );
    }
    return cardId;
  }

  public findCardInHand(cardId: string): number {
    return this.hand.findIndex(
      (card) =>
        (typeof card === 'string' ? card : (card as { id?: string })?.id) ===
        cardId,
    );
  }

  public removeCardAt(index: number): TCardItem {
    if (index < 0 || index >= this.hand.length) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Card index out of range',
        { index, handSize: this.hand.length },
      );
    }
    return this.hand.splice(index, 1)[0];
  }

  public removeCardById(cardId: string): TCardItem | undefined {
    const index = this.findCardInHand(cardId);
    if (index < 0) return undefined;
    return this.hand.splice(index, 1)[0];
  }
}
