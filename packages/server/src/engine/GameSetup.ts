import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { BoardBuilder } from './board/BoardBuilder.js';
import { PlanetaryBoard } from './board/PlanetaryBoard.js';
import { Deck } from './deck/Deck.js';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { EventLog } from './event/EventLog.js';
import type { Game } from './Game.js';
import { Resources } from './player/Resources.js';
import { TechBoard } from './tech/TechBoard.js';

export class GameSetup {
  public static initialize(game: Game): void {
    game.solarSystem = BoardBuilder.buildSolarSystem(game.random);
    game.planetaryBoard = new PlanetaryBoard();
    game.techBoard = new TechBoard(game.random);
    game.sectors = Array.from({ length: 8 }, (_, index) => ({
      id: `sector-${index + 1}`,
      dataSlots: ['data-1', 'data-2'],
      markers: [],
      completed: false,
    }));

    const baseDeckCards = Array.from(
      { length: 80 },
      (_, index) => `card-${index + 1}`,
    );
    game.mainDeck = new Deck(baseDeckCards);
    game.mainDeck.shuffle(game.random);
    game.cardRow = game.mainDeck.drawN(3);
    game.endOfRoundStacks = Array.from({ length: 4 }, () =>
      game.mainDeck.drawN(game.options.playerCount + 1),
    );

    const alienPool = game.random.shuffle(Object.values(EAlienType));
    game.hiddenAliens = alienPool.slice(0, 2).map((alien) => String(alien));
    game.neutralMilestones = GameSetup.buildNeutralMilestones(
      game.options.playerCount,
    );
    game.roundRotationReminderIndex = 0;

    game.players.forEach((player) => {
      player.score = player.seatIndex + 1;
      player.publicity = 4;
      player.resources = new Resources(
        { credits: 4, energy: 3, publicity: 4, data: 0 },
        { dataController: player.data },
      );
      player.passed = false;
      player.playedMissions = [];
      player.completedMissions = [];
      player.endGameCards = [];
      player.tuckedIncomeCards = [];
      player.hand = game.mainDeck.drawN(5);

      const tuckedCard = player.hand.shift();
      if (tuckedCard !== undefined) {
        player.tuckedIncomeCards = [tuckedCard];
      }
    });

    game.deferredActions = new DeferredActionsQueue();
    game.eventLog = new EventLog();

    game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
  }

  private static buildNeutralMilestones(playerCount: number): number[] {
    if (playerCount === 2) {
      return [20, 20, 30, 30];
    }
    if (playerCount === 3) {
      return [20, 30];
    }
    return [];
  }
}
