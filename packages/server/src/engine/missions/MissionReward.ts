import {
  EEffectType,
  type IBaseEffect,
  type ICustomizedEffect,
} from '@seti/common/types/effect';
import {
  EAlienIcon,
  EResource,
  EScanAction,
  type ESector,
  ESpecialAction,
  ETrace,
} from '@seti/common/types/element';
import { drawCard } from '../deck/drawCard.js';
import { LaunchProbeEffect } from '../effects/probe/LaunchProbeEffect.js';
import { MarkSectorSignalEffect } from '../effects/scan/MarkSectorSignalEffect.js';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';
import { EMissionEventType } from './IMission.js';

export function applyMissionRewards(
  rewards: ReadonlyArray<IBaseEffect | ICustomizedEffect>,
  player: IPlayer,
  game: IGame,
  onComplete?: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const applyAt = (index: number): PlayerInput | undefined => {
    const reward = rewards[index];
    if (!reward) {
      return onComplete?.();
    }

    if (reward.effectType !== EEffectType.BASE) {
      return applyAt(index + 1);
    }

    return applyBaseReward(reward as IBaseEffect, player, game, () =>
      applyAt(index + 1),
    );
  };

  return applyAt(0);
}

function gainFallbackTrace(
  player: IPlayer,
  game: IGame,
  traceColor: ETrace,
): void {
  player.traces[traceColor] = (player.traces[traceColor] ?? 0) + 1;
  game.missionTracker.recordEvent({
    type: EMissionEventType.TRACE_MARKED,
    traceColor,
  });
}

function applyTraceReward(
  reward: IBaseEffect,
  player: IPlayer,
  game: IGame,
  onComplete: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const traceColor = reward.type as ETrace;
  const chainTraceChoice = (remaining: number): PlayerInput | undefined => {
    if (remaining <= 0) {
      return onComplete();
    }

    if (!game.alienState) {
      gainFallbackTrace(player, game, traceColor);
      return chainTraceChoice(remaining - 1);
    }

    return game.alienState.createTraceInput(player, game, traceColor, {
      onComplete: () => chainTraceChoice(remaining - 1),
    });
  };

  return chainTraceChoice(reward.value ?? 1);
}

function applySignalReward(
  reward: IBaseEffect,
  player: IPlayer,
  game: IGame,
  onComplete: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const color = reward.type as ESector;
  const chainSignalChoice = (remaining: number): PlayerInput | undefined => {
    if (remaining <= 0) {
      return onComplete();
    }

    return MarkSectorSignalEffect.markByColor(player, game, color, () =>
      chainSignalChoice(remaining - 1),
    );
  };

  return chainSignalChoice(reward.value ?? 1);
}

function applyLaunchReward(
  reward: IBaseEffect,
  player: IPlayer,
  game: IGame,
  onComplete: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const count = reward.value ?? 1;
  for (let i = 0; i < count; i += 1) {
    if (!LaunchProbeEffect.canExecute(player, game)) {
      break;
    }

    LaunchProbeEffect.execute(player, game);
    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_LAUNCHED,
    });
  }

  return onComplete();
}

function applyBaseReward(
  reward: IBaseEffect,
  player: IPlayer,
  game: IGame,
  onComplete: () => PlayerInput | undefined,
): PlayerInput | undefined {
  const value = reward.value ?? 1;

  switch (reward.type) {
    case EResource.SCORE:
      player.score += value;
      return onComplete();
    case EResource.CREDIT:
      player.resources.gain({ credits: value });
      return onComplete();
    case EResource.ENERGY:
      player.resources.gain({ energy: value });
      return onComplete();
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: value });
      return onComplete();
    case EResource.DATA:
      player.resources.gain({ data: value });
      return onComplete();
    case EResource.SIGNAL_TOKEN:
      player.resources.gain({ signalTokens: value });
      return onComplete();
    case EResource.MOVE:
      player.gainMove(value);
      return onComplete();
    case EResource.CARD:
    case EResource.CARD_ANY: {
      drawCard(player, game, { source: 'base', count: value });
      return onComplete();
    }
    case ETrace.RED:
    case ETrace.YELLOW:
    case ETrace.BLUE:
    case ETrace.ANY:
      return applyTraceReward(reward, player, game, onComplete);
    case EScanAction.YELLOW:
    case EScanAction.RED:
    case EScanAction.BLUE:
    case EScanAction.BLACK:
      return applySignalReward(reward, player, game, onComplete);
    case ESpecialAction.LAUNCH:
      return applyLaunchReward(reward, player, game, onComplete);
    case EAlienIcon.EXOFOSSIL:
      player.gainExofossils(value);
      return onComplete();
    case EAlienIcon.USE_EXOFOSSIL:
      player.spendExofossils(value);
      return onComplete();
    default:
      return onComplete();
  }
}
