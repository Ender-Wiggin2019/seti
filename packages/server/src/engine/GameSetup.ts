import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { EventLog } from './event/EventLog.js';
import type { Game } from './Game.js';
import { Resources } from './player/Resources.js';

export class GameSetup {
  public static initialize(game: Game): void {
    game.solarSystem = { discs: [0, 0, 0], spaces: [] };
    game.planetaryBoard = { planets: {} };
    game.techBoard = {
      stacks: Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [
          `tech-${index + 1}`,
          ['2vp', 'tile-a', 'tile-b', 'tile-c', 'tile-d'],
        ]),
      ),
    };
    game.sectors = Array.from({ length: 8 }, (_, index) => ({
      id: `sector-${index + 1}`,
      dataSlots: ['data-1', 'data-2'],
      markers: [],
      completed: false,
    }));

    const baseDeck = game.random.shuffle(
      Array.from({ length: 80 }, (_, index) => `card-${index + 1}`),
    );
    game.mainDeck = [...baseDeck];
    game.cardRow = GameSetup.drawCards(game, 3);
    game.endOfRoundStacks = Array.from({ length: 4 }, () =>
      GameSetup.drawCards(game, game.options.playerCount + 1),
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
      player.hand = GameSetup.drawCards(game, 5);

      const tuckedCard = player.hand.shift();
      if (tuckedCard !== undefined) {
        player.tuckedIncomeCards = [tuckedCard];
      }
    });

    game.deferredActions = new DeferredActionsQueue();
    game.eventLog = new EventLog();

    game.transitionTo(EPhase.AWAIT_MAIN_ACTION);
  }

  private static drawCards(game: Game, count: number): string[] {
    const deck = game.mainDeck as string[];
    return deck.splice(0, count);
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
