import type { ISolarSystemSetupConfig } from '@seti/common/constant/sectorSetup';
import type { ETrace } from '@seti/common/types/element';
import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import type { EAlienType } from '@seti/common/types/protocol/enums';
import { EPhase } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { AlienState } from './alien/AlienState.js';
import type { PlanetaryBoard } from './board/PlanetaryBoard.js';
import type { Sector } from './board/Sector.js';
import type { SolarSystem } from './board/SolarSystem.js';
import type { EMarkSource } from './cards/utils/Mark.js';
import type { Deck } from './deck/Deck.js';
import type { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import type { EventLog } from './event/EventLog.js';
import type { IGameOptions } from './GameOptions.js';
import type { IPlayerInput } from './input/PlayerInput.js';
import type { MissionTracker } from './missions/MissionTracker.js';
import type { IPlayer, TCardItem } from './player/IPlayer.js';
import type { IFinalScoringResult } from './scoring/FinalScoring.js';
import type { GoldScoringTile } from './scoring/GoldScoringTile.js';
import type { MilestoneState } from './scoring/Milestone.js';
import type { TechBoard } from './tech/TechBoard.js';

export interface IGamePlayerIdentity {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
}

export interface IGame {
  readonly id: string;
  readonly seed: string;
  readonly options: Readonly<IGameOptions>;
  readonly players: ReadonlyArray<IPlayer>;

  phase: EPhase;
  round: number;
  activePlayer: IPlayer;
  startPlayer: IPlayer;

  solarSystem: SolarSystem | null;
  solarSystemSetup: ISolarSystemSetupConfig | null;
  planetaryBoard: PlanetaryBoard | null;
  techBoard: TechBoard | null;
  sectors: Sector[];

  alienState: AlienState;
  milestoneState: MilestoneState;
  goldScoringTiles: GoldScoringTile[];
  finalScoringResult?: IFinalScoringResult;

  mainDeck: Deck<string>;
  cardRow: TCardItem[];
  endOfRoundStacks: TCardItem[][];
  hiddenAliens: EAlienType[];
  neutralMilestones: number[];
  roundRotationReminderIndex: number;

  deferredActions: DeferredActionsQueue;
  missionTracker: MissionTracker;
  eventLog: EventLog;
  random: SeededRandom;

  rotationCounter: number;
  hasRoundFirstPassOccurred: boolean;

  /**
   * Monotonic counter incremented every time the engine enters a new
   * player turn (transition into `AWAIT_MAIN_ACTION` from a turn-boundary
   * phase). Used by the undo subsystem to key the "current turn start"
   * checkpoint.
   */
  turnIndex: number;

  /**
   * Set whenever the current turn reveals hidden information that would
   * make a rollback unfair — any draw from the main deck, a successful
   * card-row refill, or a pick from the end-of-round pass pile. Reset
   * to `false` at the start of every new turn.
   */
  turnLocked: boolean;

  /**
   * Mark the current turn as locked. No-op if undo is disabled for this
   * game. Safe to call from effect handlers; no-op before the first turn
   * starts.
   */
  lockCurrentTurn(): void;

  processMainAction(playerId: string, action: IMainActionRequest): void;
  processEndTurn(playerId: string): void;
  processFreeAction(playerId: string, action: IFreeActionRequest): void;
  processInput(playerId: string, response: IInputResponse): void;
  mark(
    source: EMarkSource,
    count: number,
    playerId?: string,
  ): IPlayerInput | undefined;
  markTrace(traceColor: ETrace, playerId?: string): IPlayerInput | undefined;
}
