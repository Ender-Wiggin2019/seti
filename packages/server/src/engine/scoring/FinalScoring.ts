import { AlienRegistry } from '../alien/AlienRegistry.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import { scoreEndGameCard } from './GoldScoringTile.js';

export interface IPlayerFinalScoreBreakdown {
  endGameCards: number;
  goldTiles: number;
  alienBonus: number;
  totalAdded: number;
  finalScore: number;
}

export interface IFinalScoringResult {
  scores: Record<string, number>;
  breakdown: Record<string, IPlayerFinalScoreBreakdown>;
  winnerIds: string[];
}

function getAlienBonus(player: IPlayer, game: IGame): number {
  let bonus = 0;
  for (const board of game.alienState.boards) {
    if (!board.discovered) continue;
    const plugin = AlienRegistry.get(board.alienType);
    if (plugin?.onGameEndScoring) {
      bonus += plugin.onGameEndScoring(game, player);
    }
  }
  return bonus;
}

export class FinalScoring {
  public static score(game: IGame): IFinalScoringResult {
    const scores: Record<string, number> = {};
    const breakdown: Record<string, IPlayerFinalScoreBreakdown> = {};

    for (const player of game.players) {
      const endGameCards = player.endGameCards.reduce(
        (sum: number, card) => sum + scoreEndGameCard(card, player, game),
        0,
      );
      const scoredGoldTiles = game.goldScoringTiles.reduce(
        (sum: number, tile) => sum + tile.scorePlayer(player, game),
        0,
      );
      const alienBonus = getAlienBonus(player, game);
      const totalAdded = endGameCards + scoredGoldTiles + alienBonus;
      const finalScore = player.score + totalAdded;

      scores[player.id] = finalScore;
      breakdown[player.id] = {
        endGameCards,
        goldTiles: scoredGoldTiles,
        alienBonus,
        totalAdded,
        finalScore,
      };
    }

    const highestScore = Math.max(...Object.values(scores));
    const winnerIds = Object.entries(scores)
      .filter(([, score]) => score === highestScore)
      .map(([playerId]) => playerId);

    return { scores, breakdown, winnerIds };
  }
}
