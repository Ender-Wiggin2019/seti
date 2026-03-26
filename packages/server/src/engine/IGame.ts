import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EPhase } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { SolarSystem } from './board/SolarSystem.js';
import type { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import type { EventLog } from './event/EventLog.js';
import type { IGameOptions } from './GameOptions.js';
import type { IPlayer } from './player/IPlayer.js';

export interface IGamePlayerIdentity {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
}

export interface IGame {
  readonly id: string;
  readonly options: Readonly<IGameOptions>;
  readonly players: ReadonlyArray<IPlayer>;

  phase: EPhase;
  round: number;
  activePlayer: IPlayer;
  startPlayer: IPlayer;

  solarSystem: SolarSystem | null;
  planetaryBoard: unknown;
  techBoard: unknown;
  sectors: unknown[];

  mainDeck: unknown;
  cardRow: unknown[];
  endOfRoundStacks: unknown[][];
  hiddenAliens: string[];
  neutralMilestones: number[];
  roundRotationReminderIndex: number;

  deferredActions: DeferredActionsQueue;
  eventLog: EventLog;
  random: SeededRandom;

  rotationCounter: number;
  hasRoundFirstPassOccurred: boolean;

  processMainAction(playerId: string, action: IMainActionRequest): void;
  processFreeAction(playerId: string, action: IFreeActionRequest): void;
  processInput(playerId: string, response: IInputResponse): void;
}
