import { EPhase } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import type { IGameOptions } from './GameOptions.js';

export interface IGamePlayerIdentity {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
}

export interface IGame {
  readonly id: string;
  readonly options: Readonly<IGameOptions>;
  readonly players: ReadonlyArray<IGamePlayerIdentity>;

  phase: EPhase;
  round: number;
  activePlayer: IGamePlayerIdentity;
  startPlayer: IGamePlayerIdentity;

  solarSystem: unknown;
  planetaryBoard: unknown;
  techBoard: unknown;
  sectors: unknown[];

  mainDeck: unknown;
  cardRow: unknown[];
  endOfRoundStacks: unknown[][];

  deferredActions: unknown;
  eventLog: unknown;
  random: SeededRandom;

  rotationCounter: number;
  hasRoundFirstPassOccurred: boolean;
}
