import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { Computer } from './Computer.js';
import type { Data } from './Data.js';
import type { DataPool } from './DataPool.js';
import type { Income, TIncomeBundle, TPartialIncomeBundle } from './Income.js';
import type { IPieceInventory, Pieces } from './Pieces.js';
import type {
  IResourceBundle,
  Resources,
  TPartialResourceBundle,
} from './Resources.js';

export interface IPlayerIdentity {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
}

export interface IPlayerInit extends IPlayerIdentity {
  score?: number;
  publicity?: number;
  resources?: TPartialResourceBundle;
  baseIncome?: TPartialIncomeBundle;
  tuckedCardIncome?: TPartialIncomeBundle;
  computerTopSlots?: number;
  computerBottomSlots?: number;
  dataPoolCount?: number;
  dataStashCount?: number;
  dataPoolMax?: number;
  pieceInventory?: Partial<IPieceInventory>;
  hand?: unknown[];
  playedMissions?: unknown[];
  completedMissions?: unknown[];
  endGameCards?: unknown[];
  tuckedIncomeCards?: unknown[];
  techs?: unknown[];
  passed?: boolean;
  probesInSpace?: number;
  probeSpaceLimit?: number;
}

export interface IPlayer extends IPlayerIdentity {
  score: number;
  resources: Resources;
  publicity: number;
  income: Income;
  data: Data;
  computer: Computer;
  dataPool: DataPool;
  pieces: Pieces;

  hand: unknown[];
  playedMissions: unknown[];
  completedMissions: unknown[];
  endGameCards: unknown[];
  tuckedIncomeCards: unknown[];
  techs: unknown[];

  passed: boolean;
  probesInSpace: number;
  probeSpaceLimit: number;

  game: IGame | null;
  waitingFor?: IPlayerInput;

  bindGame(game: IGame): void;
  applyRoundIncome(): TIncomeBundle;
  gainMove(amount: number): void;
  spendMove(amount: number): void;
  getMoveStash(): number;
  flushDataStashAtTurnEnd(): { movedToPool: number; discarded: number };
  flushTurnStashAtTurnEnd(): {
    data: { movedToPool: number; discarded: number };
    moveDiscarded: number;
  };
  getResourceSnapshot(): IResourceBundle;
}
