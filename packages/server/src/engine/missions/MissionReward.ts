import {
  EEffectType,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import { EResource } from '@seti/common/types/element';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export function applyMissionRewards(
  rewards: ReadonlyArray<IBaseEffect | ICustomizedEffect>,
  player: IPlayer,
  game: IGame,
): void {
  for (const reward of rewards) {
    if (reward.effectType !== EEffectType.BASE) continue;
    applyBaseReward(reward as IBaseEffect, player, game);
  }
}

function applyBaseReward(
  reward: IBaseEffect,
  player: IPlayer,
  game: IGame,
): void {
  const value = reward.value ?? 1;

  switch (reward.type) {
    case EResource.SCORE:
      player.score += value;
      break;
    case EResource.CREDIT:
      player.resources.gain({ credits: value });
      break;
    case EResource.ENERGY:
      player.resources.gain({ energy: value });
      break;
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: value });
      break;
    case EResource.DATA:
      player.resources.gain({ data: value });
      break;
    case EResource.MOVE:
      player.gainMove(value);
      break;
    case EResource.CARD:
    case EResource.CARD_ANY: {
      for (let i = 0; i < value; i++) {
        const drawn = game.mainDeck.drawWithReshuffle(game.random);
        if (drawn !== undefined) {
          player.hand.push(drawn);
        }
      }
      break;
    }
    default:
      break;
  }
}
