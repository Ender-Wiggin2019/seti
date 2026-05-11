import {
  RIVAL_BOARD_CONFIGS,
  RIVAL_OBJECTIVE_IDS_BY_LEVEL,
} from '@seti/common/constant/solo';
import { rivalActionCards } from '@seti/common/data/rivalActionCards';
import { ERivalActionCardTier } from '@seti/common/types/protocol/solo';
import type { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { Income } from '@/engine/player/Income.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { Resources } from '@/engine/player/Resources.js';
import { RivalState } from './RivalState.js';

const RIVAL_ID_PREFIX = 'rival:';

export class RivalSetup {
  public static initialize(game: Game): void {
    const rival = this.getRivalPlayer(game);
    this.initializeRivalPlayer(rival);

    const config = RIVAL_BOARD_CONFIGS[game.options.soloDifficulty];
    const basicCardIds = rivalActionCards
      .filter((card) => card.deckTier === ERivalActionCardTier.BASIC)
      .map((card) => card.id);
    const advancedCardIds = game.random.shuffle(
      rivalActionCards
        .filter((card) => card.deckTier === ERivalActionCardTier.ADVANCED)
        .map((card) => card.id),
    );
    const extraAdvancedCount = Math.floor(config.initialProgress / 12);
    const startingAdvancedCardIds = advancedCardIds.slice(
      0,
      extraAdvancedCount,
    );
    const advancedReserve = advancedCardIds.slice(extraAdvancedCount);
    const startingActionDeck = game.random.shuffle([
      ...basicCardIds,
      ...startingAdvancedCardIds,
    ]);
    const objectiveDrawPile = this.buildObjectiveDrawPile(game);
    const revealedObjectiveIds = objectiveDrawPile.splice(0, 3);

    game.rivalState = new RivalState({
      rivalPlayerId: rival.id,
      difficulty: game.options.soloDifficulty,
      progress: config.initialProgress,
      progressSlot: config.initialProgress % 12,
      boardConfigId: config.boardConfigId,
      actionDeck: startingActionDeck,
      advancedReserve,
      objectiveDrawPile,
      revealedObjectiveIds,
    });
  }

  public static isRivalPlayer(player: IPlayer): boolean {
    return player.id.startsWith(RIVAL_ID_PREFIX);
  }

  public static getRivalPlayer(game: Pick<IGame, 'players'>): IPlayer {
    const rival =
      game.players.find((player) => this.isRivalPlayer(player)) ??
      game.players[1];
    if (!rival) {
      throw new Error('Solo mode requires a rival player identity');
    }
    return rival;
  }

  private static initializeRivalPlayer(player: IPlayer): void {
    player.resources = new Resources(
      {
        credits: 0,
        energy: 0,
        publicity: 4,
        data: 0,
        signalTokens: 0,
      },
      { dataController: player.data },
    );
    player.income = new Income();
    player.hand = [];
    player.playedMissions = [];
    player.completedMissions = [];
    player.endGameCards = [];
    player.tuckedIncomeCards = [];
    player.pendingSetupTucks = 0;
    player.waitingFor = undefined;
  }

  private static buildObjectiveDrawPile(game: Game) {
    const config = RIVAL_BOARD_CONFIGS[game.options.soloDifficulty];
    const level1 = game.random
      .shuffle([...RIVAL_OBJECTIVE_IDS_BY_LEVEL.level1])
      .slice(0, config.objectiveStack.level1);
    const level2 = game.random
      .shuffle([...RIVAL_OBJECTIVE_IDS_BY_LEVEL.level2])
      .slice(0, config.objectiveStack.level2);
    const level3 = game.random
      .shuffle([...RIVAL_OBJECTIVE_IDS_BY_LEVEL.level3])
      .slice(0, config.objectiveStack.level3);

    return [...level1, ...level2, ...level3];
  }
}
