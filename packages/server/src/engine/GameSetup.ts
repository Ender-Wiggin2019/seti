import type { Game } from './Game.js';

export class GameSetup {
  public static initialize(game: Game): void {
    game.solarSystem = {};
    game.planetaryBoard = {};
    game.techBoard = {};
    game.sectors = [];

    game.mainDeck = [];
    game.cardRow = [];
    game.endOfRoundStacks = [];

    game.deferredActions = [];
    game.eventLog = [];
  }
}
