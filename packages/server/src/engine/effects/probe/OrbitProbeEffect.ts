import type { TPlanetReward } from '@seti/common/constant/boardLayout';
import { EResource } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from './ProbeEffectUtils.js';

export interface IOrbitProbeEffectResult {
  planet: EPlanet;
  vpGained: number;
  pendingInput?: IPlayerInput;
}

interface IOrbitRewardResolution {
  vpGained: number;
  pendingInput?: IPlayerInput;
}

function gainResourceReward(player: IPlayer, reward: TPlanetReward): number {
  if (reward.type !== 'resource') {
    return 0;
  }

  switch (reward.resource) {
    case EResource.CREDIT:
      player.resources.gain({ credits: reward.amount });
      return 0;
    case EResource.ENERGY:
      player.resources.gain({ energy: reward.amount });
      return 0;
    case EResource.PUBLICITY:
      player.resources.gain({ publicity: reward.amount });
      return 0;
    case EResource.DATA:
      player.resources.gain({ data: reward.amount });
      return 0;
    case EResource.SIGNAL_TOKEN:
      player.resources.gain({ signalTokens: reward.amount });
      return 0;
    case EResource.SCORE:
      player.score += reward.amount;
      return reward.amount;
    case EResource.MOVE:
      player.gainMove(reward.amount);
      return 0;
    default:
      return 0;
  }
}

export class OrbitProbeEffect {
  private static buildTuckChain(
    player: IPlayer,
    game: IGame,
    remaining: number,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return undefined;
    }
    return TuckCardForIncomeEffect.execute(player, game, () =>
      this.buildTuckChain(player, game, remaining - 1),
    );
  }

  private static applyRewardChain(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
    index: number,
    vpGained: number,
    onComplete?: () => IPlayerInput | undefined,
  ): IOrbitRewardResolution {
    const reward = rewards[index];
    if (reward === undefined) {
      const pendingInput = onComplete?.();
      return pendingInput ? { vpGained, pendingInput } : { vpGained };
    }

    switch (reward.type) {
      case 'resource': {
        const gained = gainResourceReward(player, reward);
        return this.applyRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          vpGained + gained,
          onComplete,
        );
      }
      case 'signal':
        return {
          vpGained,
          pendingInput: this.applySignalReward(
            player,
            game,
            planet,
            reward.amount,
            () =>
              this.applyRewardChain(
                player,
                game,
                planet,
                rewards,
                index + 1,
                vpGained,
                onComplete,
              ).pendingInput,
          ),
        };
      case 'card':
        for (let index = 0; index < reward.amount; index += 1) {
          const drawn = game.mainDeck.drawWithReshuffle(game.random);
          if (drawn === undefined) {
            break;
          }
          player.hand.push(drawn);
          game.lockCurrentTurn();
        }
        return this.applyRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          vpGained,
          onComplete,
        );
      case 'tuck':
        game.deferredActions.push(
          new SimpleDeferredAction(player, (g) =>
            this.buildTuckChain(player, g, reward.amount),
          ),
        );
        return this.applyRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          vpGained,
          onComplete,
        );
      case 'alien-card':
        return {
          vpGained,
          pendingInput: this.applyAlienCardReward(
            player,
            game,
            reward.alienType,
            reward.amount,
            () =>
              this.applyRewardChain(
                player,
                game,
                planet,
                rewards,
                index + 1,
                vpGained,
                onComplete,
              ).pendingInput,
          ),
        };
      case 'exofossil':
        player.gainExofossils(reward.amount);
        return this.applyRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          vpGained,
          onComplete,
        );
      case 'trace':
        return this.applyRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          vpGained,
          onComplete,
        );
      default: {
        const exhaustive: never = reward;
        return exhaustive;
      }
    }
  }

  private static applySignalReward(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    remaining: number,
    onComplete: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return onComplete();
    }

    if (planet === EPlanet.OUMUAMUA) {
      const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
      if (plugin instanceof OumuamuaAlienPlugin) {
        return MarkSectorSignalEffect.markByPlanetWithAlternatives(
          player,
          game,
          planet,
          () =>
            this.applySignalReward(
              player,
              game,
              planet,
              remaining - 1,
              onComplete,
            ),
        );
      }
    }

    MarkSectorSignalEffect.markByPlanet(player, game, planet);
    return this.applySignalReward(
      player,
      game,
      planet,
      remaining - 1,
      onComplete,
    );
  }

  private static applyAlienCardReward(
    player: IPlayer,
    game: IGame,
    alienType: EAlienType,
    remaining: number,
    onComplete: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return onComplete();
    }

    const input = game.alienState.createDrawAlienCardInput(
      player,
      game,
      { alienType },
      () =>
        this.applyAlienCardReward(
          player,
          game,
          alienType,
          remaining - 1,
          onComplete,
        ),
    );
    return input ?? onComplete();
  }

  private static applyRewards(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
    onComplete?: () => IPlayerInput | undefined,
  ): IOrbitRewardResolution {
    return this.applyRewardChain(
      player,
      game,
      planet,
      rewards,
      0,
      0,
      onComplete,
    );
  }

  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): boolean {
    if (
      planet === EPlanet.EARTH ||
      game.solarSystem === null ||
      game.planetaryBoard === null
    ) {
      return false;
    }

    syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canOrbit(planet, player.id);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: { onComplete?: () => IPlayerInput | undefined } = {},
  ): IOrbitProbeEffectResult {
    if (!this.canExecute(player, game, planet)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'OrbitProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
        },
      );
    }

    const consumed = consumeProbeFromPlanet(game, player.id, planet);
    if (!consumed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No probe available to enter orbit',
        {
          playerId: player.id,
          planet,
        },
      );
    }

    player.probesInSpace = Math.max(0, player.probesInSpace - 1);
    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Planetary board not initialized',
      );
    }

    const orbitResult = planetaryBoard.orbit(planet, player.id);
    syncProbeCountsForPlayer(game, player.id);
    const rewardResolution = this.applyRewards(
      player,
      game,
      planet,
      orbitResult.rewards,
      options.onComplete,
    );

    return {
      planet,
      vpGained: rewardResolution.vpGained,
      pendingInput: rewardResolution.pendingInput,
    };
  }
}
