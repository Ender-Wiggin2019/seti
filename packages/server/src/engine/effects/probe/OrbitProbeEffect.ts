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

  private static applyReward(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    reward: TPlanetReward,
  ): number {
    switch (reward.type) {
      case 'resource':
        return gainResourceReward(player, reward);
      case 'signal':
        for (let index = 0; index < reward.amount; index += 1) {
          if (planet === EPlanet.OUMUAMUA) {
            const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
            if (plugin instanceof OumuamuaAlienPlugin) {
              plugin.markTileSignal(player, game);
              continue;
            }
          }
          MarkSectorSignalEffect.markByPlanet(player, game, planet);
        }
        return 0;
      case 'card':
        for (let index = 0; index < reward.amount; index += 1) {
          const drawn = game.mainDeck.drawWithReshuffle(game.random);
          if (drawn === undefined) {
            break;
          }
          player.hand.push(drawn);
          game.lockCurrentTurn();
        }
        return 0;
      case 'tuck':
        game.deferredActions.push(
          new SimpleDeferredAction(player, (g) =>
            this.buildTuckChain(player, g, reward.amount),
          ),
        );
        return 0;
      case 'alien-card': {
        const board = game.alienState.getBoardByType(reward.alienType);
        if (!board) return 0;
        for (let index = 0; index < reward.amount; index += 1) {
          const source = board.faceUpAlienCardId ? 'face-up' : 'deck';
          const drawn = game.alienState.drawAlienCard(
            player,
            board,
            source,
            game,
          );
          if (!drawn) break;
        }
        return 0;
      }
      case 'exofossil':
        player.gainExofossils(reward.amount);
        return 0;
      case 'trace':
        return 0;
      default: {
        const exhaustive: never = reward;
        return exhaustive;
      }
    }
  }

  private static applyRewards(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
  ): number {
    return rewards.reduce(
      (vpGained, reward) =>
        vpGained + this.applyReward(player, game, planet, reward),
      0,
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
    const vpGained = this.applyRewards(
      player,
      game,
      planet,
      orbitResult.rewards,
    );

    return {
      planet,
      vpGained,
    };
  }
}
