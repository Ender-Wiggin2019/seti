import type { IComputerColumnConfig } from '@seti/common/types/computer';
import { ETrace } from '@seti/common/types/element';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import type { ETechId } from '@seti/common/types/tech';
import type { ICard } from '../cards/ICard.js';
import type {
  ILandOptions,
  ILandResult,
} from '../effects/probe/LandProbeEffect.js';
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

export type TCardItem =
  | string
  | {
      id?: string;
      [key: string]: unknown;
    }
  | ICard;

export interface IPlayerInit extends IPlayerIdentity {
  score?: number;
  publicity?: number;
  resources?: TPartialResourceBundle;
  baseIncome?: TPartialIncomeBundle;
  tuckedCardIncome?: TPartialIncomeBundle;
  /** Column configs for the player's computer. Defaults to DEFAULT_COLUMN_CONFIGS (6 columns). */
  computerColumnConfigs?: readonly IComputerColumnConfig[];
  dataPoolCount?: number;
  dataStashCount?: number;
  dataPoolMax?: number;
  pieceInventory?: Partial<IPieceInventory>;
  hand?: TCardItem[];
  playedMissions?: TCardItem[];
  completedMissions?: TCardItem[];
  endGameCards?: TCardItem[];
  tuckedIncomeCards?: TCardItem[];
  techs?: ETechId[];
  traces?: Partial<Record<ETrace, number>>;
  tracesByAlien?: Record<number, Partial<Record<ETrace, number>>>;
  passed?: boolean;
  probesInSpace?: number;
  probeSpaceLimit?: number;
  /** Max hand size after passing; excess cards are discarded. Default 4. */
  handLimitAfterPass?: number;
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

  hand: TCardItem[];
  playedMissions: TCardItem[];
  completedMissions: TCardItem[];
  endGameCards: TCardItem[];
  tuckedIncomeCards: TCardItem[];
  techs: ETechId[];
  traces: Partial<Record<ETrace, number>>;
  tracesByAlien: Record<number, Partial<Record<ETrace, number>>>;

  passed: boolean;
  probesInSpace: number;
  probeSpaceLimit: number;
  handLimitAfterPass: number;

  game: IGame | null;
  waitingFor?: IPlayerInput;

  bindGame(game: IGame): void;
  applyRoundIncome(): TIncomeBundle;
  applyEndOfRoundIncome(round: number): TIncomeBundle;
  gainTech(techId: ETechId): void;
  gainMove(amount: number): void;
  spendMove(amount: number): void;
  getMoveStash(): number;
  flushDataStashAtTurnEnd(): { movedToPool: number; discarded: number };
  flushTurnStashAtTurnEnd(): {
    data: { movedToPool: number; discarded: number };
    moveDiscarded: number;
  };
  getResourceSnapshot(): IResourceBundle;

  canLand(planet: EPlanet, options?: ILandOptions): boolean;
  getLandingCost(planet: EPlanet, options?: ILandOptions): number;
  land(planet: EPlanet, options?: ILandOptions): ILandResult;

  getCardIdAt(index: number): string;
  findCardInHand(cardId: string): number;
  removeCardAt(index: number): TCardItem;
  removeCardById(cardId: string): TCardItem | undefined;
}
