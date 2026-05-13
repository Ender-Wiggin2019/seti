import type { TPlanetReward } from '@seti/common/constant/boardLayout';
import { EResource, type ETrace } from '@seti/common/types/element';
import { EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { TuckCardForIncomeEffect } from '@/engine/effects/income/TuckCardForIncomeEffect.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EPieceType } from '../../player/Pieces.js';
import { TechModifierQuery } from '../../tech/TechModifierQuery.js';
import {
  consumeProbeFromPlanet,
  syncProbeCountsForPlayer,
} from './ProbeEffectUtils.js';

export interface ILandOptions {
  isMoon?: boolean;
  moonId?: string;
  allowMoons?: boolean;
  allowDuplicate?: boolean;
  onComplete?: () => IPlayerInput | undefined;
}

export interface ILandResult {
  planet: EPlanet;
  isMoon: boolean;
  landingCost: number;
  vpGained: number;
  firstLandDataGained: number;
  exofossilsGained: number;
  lifeTraceGained: number;
  traceRewards: Array<{ trace: ETrace; amount: number }>;
  pendingInput?: IPlayerInput;
}

interface ILandRewardResolution {
  pendingInput?: IPlayerInput;
}

/** @deprecated Use ILandOptions instead */
export type ILandProbeEffectOptions = ILandOptions;
/** @deprecated Use ILandResult instead */
export type ILandProbeEffectResult = ILandResult;

export class LandProbeEffect {
  private static buildTuckChain(
    player: IPlayer,
    game: IGame,
    remaining: number,
    onComplete?: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return onComplete?.();
    }
    return TuckCardForIncomeEffect.execute(player, game, () =>
      this.buildTuckChain(player, game, remaining - 1, onComplete),
    );
  }

  private static gainMoonResourceReward(
    player: IPlayer,
    reward: Extract<TPlanetReward, { type: 'resource' }>,
  ): void {
    switch (reward.resource) {
      case EResource.CREDIT:
        player.resources.gain({ credits: reward.amount });
        break;
      case EResource.ENERGY:
        player.resources.gain({ energy: reward.amount });
        break;
      case EResource.PUBLICITY:
        player.resources.gain({ publicity: reward.amount });
        break;
      case EResource.DATA:
        player.resources.gain({ data: reward.amount });
        break;
      case EResource.SIGNAL_TOKEN:
        player.resources.gain({ signalTokens: reward.amount });
        break;
      case EResource.MOVE:
        player.gainMove(reward.amount);
        break;
      case EResource.SCORE:
      case EResource.CARD:
      case EResource.CARD_ANY:
        break;
      default: {
        const exhaustive: never = reward.resource;
        return exhaustive;
      }
    }
  }

  private static applyColoredSignalReward(
    player: IPlayer,
    game: IGame,
    reward: Extract<TPlanetReward, { type: 'signal'; sector: unknown }>,
    remaining: number,
    onComplete: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return onComplete();
    }
    return MarkSectorSignalEffect.markByColor(player, game, reward.sector, () =>
      this.applyColoredSignalReward(
        player,
        game,
        reward,
        remaining - 1,
        onComplete,
      ),
    );
  }

  private static applyPlanetSignalReward(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    remaining: number,
    onComplete: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (remaining <= 0) {
      return onComplete();
    }
    MarkSectorSignalEffect.markByPlanet(player, game, planet);
    return this.applyPlanetSignalReward(
      player,
      game,
      planet,
      remaining - 1,
      onComplete,
    );
  }

  private static applyMoonRewardChain(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
    index: number,
    onComplete?: () => IPlayerInput | undefined,
  ): ILandRewardResolution {
    const reward = rewards[index];
    if (reward === undefined) {
      const pendingInput = onComplete?.();
      return pendingInput ? { pendingInput } : {};
    }

    switch (reward.type) {
      case 'resource':
        this.gainMoonResourceReward(player, reward);
        return this.applyMoonRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          onComplete,
        );
      case 'signal':
        return {
          pendingInput:
            'sector' in reward
              ? this.applyColoredSignalReward(
                  player,
                  game,
                  reward,
                  reward.amount,
                  () =>
                    this.applyMoonRewardChain(
                      player,
                      game,
                      planet,
                      rewards,
                      index + 1,
                      onComplete,
                    ).pendingInput,
                )
              : this.applyPlanetSignalReward(
                  player,
                  game,
                  planet,
                  reward.amount,
                  () =>
                    this.applyMoonRewardChain(
                      player,
                      game,
                      planet,
                      rewards,
                      index + 1,
                      onComplete,
                    ).pendingInput,
                ),
        };
      case 'tuck': {
        return {
          pendingInput: this.buildTuckChain(
            player,
            game,
            reward.amount,
            () =>
              this.applyMoonRewardChain(
                player,
                game,
                planet,
                rewards,
                index + 1,
                onComplete,
              ).pendingInput,
          ),
        };
      }
      case 'card':
      case 'alien-card':
      case 'trace':
      case 'exofossil':
        return this.applyMoonRewardChain(
          player,
          game,
          planet,
          rewards,
          index + 1,
          onComplete,
        );
      default: {
        const exhaustive: never = reward;
        return exhaustive;
      }
    }
  }

  private static applyMoonRewards(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    rewards: readonly TPlanetReward[],
    onComplete?: () => IPlayerInput | undefined,
  ): ILandRewardResolution {
    return this.applyMoonRewardChain(
      player,
      game,
      planet,
      rewards,
      0,
      onComplete,
    );
  }

  private static resolveMoonFlag(
    player: IPlayer,
    options: ILandOptions,
  ): boolean {
    return (
      options.allowMoons ??
      TechModifierQuery.fromTechIds(player.techs).canLandOnMoon()
    );
  }

  public static canExecute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): boolean {
    if (
      planet === EPlanet.EARTH ||
      game.solarSystem === null ||
      game.planetaryBoard === null
    ) {
      return false;
    }

    syncProbeCountsForPlayer(game, player.id);
    return game.planetaryBoard.canLand(planet, player.id, {
      isMoon: options.isMoon,
      moonId: options.moonId,
      allowMoonLanding: this.resolveMoonFlag(player, options),
      allowDuplicate: options.allowDuplicate,
    });
  }

  public static getLandingCost(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): number {
    if (!this.canExecute(player, game, planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LandProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
          isMoon: options.isMoon ?? false,
          moonId: options.moonId,
        },
      );
    }

    const planetaryBoard = game.planetaryBoard;
    if (planetaryBoard === null) {
      throw new GameError(
        EErrorCode.INTERNAL_SERVER_ERROR,
        'Planetary board not initialized',
      );
    }

    const baseCost = planetaryBoard.getLandingCost(planet, player.id);
    return TechModifierQuery.fromTechIds(player.techs).getLandingCost(baseCost);
  }

  public static execute(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): ILandResult {
    if (!this.canExecute(player, game, planet, options)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'LandProbe effect is not currently legal',
        {
          playerId: player.id,
          planet,
          isMoon: options.isMoon ?? false,
          moonId: options.moonId,
        },
      );
    }

    const effectiveLandingCost = this.getLandingCost(
      player,
      game,
      planet,
      options,
    );

    const consumed = consumeProbeFromPlanet(game, player.id, planet);
    if (!consumed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'No probe available to land',
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

    const landingResult = planetaryBoard.land(planet, player.id, {
      isMoon: options.isMoon,
      moonId: options.moonId,
      allowMoonLanding: this.resolveMoonFlag(player, options),
      allowDuplicate: options.allowDuplicate,
    });
    if (player.pieces.available(EPieceType.LANDER) > 0) {
      player.pieces.deploy(EPieceType.LANDER);
    }
    syncProbeCountsForPlayer(game, player.id);
    player.score += landingResult.centerReward.vpGained;
    if (landingResult.firstLandDataGained > 0) {
      player.resources.gain({ data: landingResult.firstLandDataGained });
    }
    const exofossilsGained = landingResult.rewards.reduce((total, reward) => {
      if (reward.type !== 'exofossil') {
        return total;
      }
      player.gainExofossils(reward.amount);
      return total + reward.amount;
    }, 0);
    const rewardResolution = landingResult.isMoon
      ? this.applyMoonRewards(
          player,
          game,
          planet,
          landingResult.rewards,
          options.onComplete,
        )
      : {};

    return {
      planet,
      isMoon: landingResult.isMoon,
      landingCost: effectiveLandingCost,
      vpGained: landingResult.centerReward.vpGained,
      firstLandDataGained: landingResult.firstLandDataGained,
      exofossilsGained,
      lifeTraceGained: landingResult.centerReward.lifeTraceGained,
      traceRewards: landingResult.centerReward.traceRewards,
      pendingInput: rewardResolution.pendingInput,
    };
  }

  public static executeCardContainedAction(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    options: ILandOptions = {},
  ): ILandResult {
    const result = this.execute(player, game, planet, options);

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_LANDED,
      planet,
      isMoon: result.isMoon,
    });

    for (const traceReward of result.traceRewards) {
      for (let i = 0; i < traceReward.amount; i += 1) {
        game.deferredActions.push(
          new SimpleDeferredAction(player, (g) =>
            g.alienState.createTraceInput(player, g, traceReward.trace),
          ),
        );
      }
    }

    return result;
  }
}
