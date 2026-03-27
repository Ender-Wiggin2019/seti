import { EAlienType, EPhase } from '@seti/common/types/protocol/enums';
import { AlienState } from './alien/AlienState.js';
import { BoardBuilder } from './board/BoardBuilder.js';
import { PlanetaryBoard } from './board/PlanetaryBoard.js';
import { loadAllCardData } from './cards/loadCardData.js';
import { Deck } from './deck/Deck.js';
import { DeferredActionsQueue } from './deferred/DeferredActionsQueue.js';
import { EventLog } from './event/EventLog.js';
import type { Game } from './Game.js';
import { Resources } from './player/Resources.js';
import {
  GoldScoringTile,
  type TGoldScoringTileId,
} from './scoring/GoldScoringTile.js';
import { MilestoneState } from './scoring/Milestone.js';
import { TechBoard } from './tech/TechBoard.js';

const GOLD_TILE_IDS: readonly TGoldScoringTileId[] = [
  'tech',
  'mission',
  'income',
  'other',
];

export class GameSetup {
  public static initialize(game: Game): void {
    const boardResult = BoardBuilder.buildAll(game.random);

    game.solarSystem = boardResult.solarSystem;
    game.solarSystemSetup = boardResult.setupConfig;
    game.sectors = boardResult.sectors;
    game.planetaryBoard = new PlanetaryBoard();
    game.techBoard = new TechBoard(game.random);

    const baseDeckCards = loadAllCardData().map((card) => card.id);
    game.mainDeck = new Deck(baseDeckCards);
    game.mainDeck.shuffle(game.random);
    game.cardRow = game.mainDeck.drawN(3);
    game.endOfRoundStacks = Array.from({ length: 4 }, () =>
      game.mainDeck.drawN(game.options.playerCount + 1),
    );

    const alienPool = game.random.shuffle(
      Object.values(EAlienType) as EAlienType[],
    );
    game.hiddenAliens = alienPool.slice(0, 2);
    game.alienState = AlienState.createFromHiddenAliens(game.hiddenAliens);
    game.neutralMilestones = GameSetup.buildNeutralMilestones(
      game.options.playerCount,
    );
    game.milestoneState = new MilestoneState(game.neutralMilestones);
    game.goldScoringTiles = GOLD_TILE_IDS.map(
      (id) =>
        new GoldScoringTile({
          id,
          side: game.random.next() < 0.5 ? 'A' : 'B',
        }),
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
