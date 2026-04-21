import {
  EEffectType,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import { EResource, ETrace } from '@seti/common/types/element';
import { drawCard } from '../deck/drawCard.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
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
      drawCard(player, game, { source: 'base', count: value });
      break;
    }
    case ETrace.RED:
    case ETrace.YELLOW:
    case ETrace.BLUE:
    case ETrace.ANY: {
      const chainTraceChoice = (remaining: number): PlayerInput | undefined => {
        if (remaining <= 0) {
          return undefined;
        }

        return game.alienState.createTraceInput(
          player,
          game,
          reward.type as ETrace,
          () => chainTraceChoice(remaining - 1),
        );
      };

      const firstTraceChoice = chainTraceChoice(value);
      if (firstTraceChoice) {
        player.waitingFor = firstTraceChoice;
      }
      break;
    }
    default:
      break;
  }
}
