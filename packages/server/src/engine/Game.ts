import { randomUUID } from 'node:crypto';
import { EPhase } from '@seti/common/types/protocol/enums';
import { SeededRandom } from '@/shared/rng/SeededRandom.js';
import { createGameOptions, type IGameOptions } from './GameOptions.js';
import { GameSetup } from './GameSetup.js';
import type { IGame, IGamePlayerIdentity } from './IGame.js';
import { assertValidPhaseTransition } from './Phase.js';

export class Game implements IGame {
  public readonly id: string;

  public readonly options: Readonly<IGameOptions>;

  public readonly players: ReadonlyArray<IGamePlayerIdentity>;

  public phase: EPhase;

  public round: number;

  public activePlayer: IGamePlayerIdentity;

  public startPlayer: IGamePlayerIdentity;

  public solarSystem: unknown;

  public planetaryBoard: unknown;

  public techBoard: unknown;

  public sectors: unknown[];

  public mainDeck: unknown;

  public cardRow: unknown[];

  public endOfRoundStacks: unknown[][];

  public deferredActions: unknown;

  public eventLog: unknown;

  public random: SeededRandom;

  public rotationCounter: number;

  public hasRoundFirstPassOccurred: boolean;

  private constructor(
    id: string,
    players: ReadonlyArray<IGamePlayerIdentity>,
    options: Readonly<IGameOptions>,
    seed: string,
  ) {
    this.id = id;
    this.players = players;
    this.options = options;

    this.phase = EPhase.SETUP;
    this.round = 1;
    this.startPlayer = players[0];
    this.activePlayer = this.startPlayer;

    this.solarSystem = null;
    this.planetaryBoard = null;
    this.techBoard = null;
    this.sectors = [];
    this.mainDeck = null;
    this.cardRow = [];
    this.endOfRoundStacks = [];
    this.deferredActions = null;
    this.eventLog = null;

    this.random = new SeededRandom(seed);
    this.rotationCounter = 0;
    this.hasRoundFirstPassOccurred = false;
  }

  public static create(
    players: ReadonlyArray<IGamePlayerIdentity>,
    options: Partial<IGameOptions>,
    seed: string,
    id: string = randomUUID(),
  ): Game {
    if (players.length === 0) {
      throw new Error('players must not be empty');
    }

    const resolvedOptions = createGameOptions(options);
    if (players.length !== resolvedOptions.playerCount) {
      throw new Error('players length must match options.playerCount');
    }

    const game = new Game(id, players, resolvedOptions, seed);
    GameSetup.initialize(game);
    return game;
  }

  public transitionTo(nextPhase: EPhase): void {
    assertValidPhaseTransition(this.phase, nextPhase);
    this.phase = nextPhase;
  }

  public getActivePlayer(): IGamePlayerIdentity {
    return this.activePlayer;
  }

  public getNextPlayer(
    fromPlayerId: string = this.activePlayer.id,
  ): IGamePlayerIdentity {
    const currentPlayerIndex = this.players.findIndex(
      (player) => player.id === fromPlayerId,
    );
    if (currentPlayerIndex < 0) {
      throw new Error(`Unknown player id: ${fromPlayerId}`);
    }

    const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    return this.players[nextPlayerIndex];
  }

  public setActivePlayer(playerId: string): void {
    const selectedPlayer = this.players.find(
      (player) => player.id === playerId,
    );
    if (!selectedPlayer) {
      throw new Error(`Unknown player id: ${playerId}`);
    }

    this.activePlayer = selectedPlayer;
  }
}
