import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { TSlotReward } from './AlienBoard.js';

export function executeSimpleSlotReward(
  player: IPlayer,
  game: IGame,
  reward: TSlotReward,
): boolean {
  switch (reward.type) {
    case 'VP':
      player.score += reward.amount;
      return true;
    case 'PUBLICITY':
      player.resources.gain({ publicity: reward.amount });
      return true;
    case 'CREDIT':
      player.resources.gain({ credits: reward.amount });
      return true;
    case 'ENERGY':
      player.resources.gain({ energy: reward.amount });
      return true;
    case 'DATA':
      player.resources.gain({ data: reward.amount });
      return true;
    case 'CARD':
      for (let i = 0; i < reward.amount; i += 1) {
        const drawn = game.mainDeck.drawWithReshuffle(game.random);
        if (drawn === undefined) break;
        player.hand.push(drawn);
        game.lockCurrentTurn();
      }
      return true;
    default:
      return false;
  }
}

export function executeSimpleSlotRewards(
  player: IPlayer,
  game: IGame,
  rewards: readonly TSlotReward[],
): void {
  for (const reward of rewards) {
    executeSimpleSlotReward(player, game, reward);
  }
}
