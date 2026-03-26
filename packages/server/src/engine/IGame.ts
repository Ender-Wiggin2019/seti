import type {
  IFreeActionRequest,
  IInputResponse,
  IMainActionRequest,
} from '@seti/common/types/protocol/actions';
import { EPhase } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { PlanetaryBoard } from './board/PlanetaryBoard.js';
import type { SolarSystem } from './board/SolarSystem.js';
import type { EMarkSource } from './cards/utils/Mark.js';
import type { Deck } from './deck/Deck.js';
import type { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import type { EventLog } from './event/EventLog.js';
import type { IGameOptions } from './GameOptions.js';
import type { IPlayerInput } from './input/PlayerInput.js';
import type { MissionTracker } from './missions/MissionTracker.js';
import type { IPlayer } from './player/IPlayer.js';
import type { TechBoard } from './tech/TechBoard.js';

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
  planetaryBoard: PlanetaryBoard | null;
  techBoard: TechBoard | null;
  sectors: unknown[];

  mainDeck: Deck<string>;
  cardRow: unknown[];
  endOfRoundStacks: unknown[][];
  hiddenAliens: string[];
  neutralMilestones: number[];
  roundRotationReminderIndex: number;

  deferredActions: DeferredActionsQueue;
  missionTracker: MissionTracker;
  eventLog: EventLog;
  random: SeededRandom;

  rotationCounter: number;
  hasRoundFirstPassOccurred: boolean;

  processMainAction(playerId: string, action: IMainActionRequest): void;
  processFreeAction(playerId: string, action: IFreeActionRequest): void;
  processInput(playerId: string, response: IInputResponse): void;
  mark(
    source: EMarkSource,
    count: number,
    playerId?: string,
  ): IPlayerInput | undefined;
}
