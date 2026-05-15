import { EResource, ESector } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';
import { EPriority } from '../../deferred/Priority.js';
import { SimpleDeferredAction } from '../../deferred/SimpleDeferredAction.js';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';
import { drawCardFromMainDeck } from '../OrganizationCardUtils.js';

interface ICosmosStrategyGroupState {
  markedRewards?: Partial<Record<EResource, boolean>>;
}

const COSMOS_REWARD_ORDER = [
  EResource.CREDIT,
  EResource.PUBLICITY,
  EResource.DATA,
] as const;

export class CosmosStrategyGroup extends Organization {
  public constructor() {
    super(EOrganizationId.COSMOS_STRATEGY_GROUP);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(_player: IPlayer, game: IGame): boolean {
    return game.mainDeck.totalSize > 0;
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const cardId = drawCardFromMainDeck(player, game);
    if (cardId === undefined) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'No cards available in deck or discard pile',
        { playerId: player.id },
      );
    }

    this.setState(player, { ...this.getState(player), markedRewards: {} });
    player.oncePerRoundUsed[this.id] = true;
    return undefined;
  }

  protected override registerEvents(player: IPlayer, game: IGame): void {
    const owner = this.getEventOwner(player);
    game.eventBus.unsubscribeOwner(owner);
    game.eventBus.subscribe(
      EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      (context) => {
        if (context.player !== player) {
          return undefined;
        }
        const action = context.action as { type?: EMainAction } | undefined;
        if (action?.type !== EMainAction.PLAY_CARD) {
          return undefined;
        }

        const actionDetails = context.actionDetails as
          | { cardId?: string }
          | undefined;
        const cardId = actionDetails?.cardId;
        if (!cardId || !hasCardData(cardId)) {
          return undefined;
        }

        const cardData = loadCardData(cardId);
        if (cardData.alien !== undefined || cardData.sector === undefined) {
          return undefined;
        }

        const rewards = this.selectRewards(player, cardData.sector);
        if (rewards.length === 0) {
          return undefined;
        }

        if (cardData.sector === ESector.BLACK && rewards.length > 1) {
          game.deferredActions.push(
            new SimpleDeferredAction(
              player,
              () => this.createBlackSectorRewardInput(player, rewards),
              EPriority.DEFAULT,
            ),
          );
          return undefined;
        }

        this.markAndGainReward(player, rewards[0]);
        return undefined;
      },
      { owner },
    );
  }

  private selectRewards(
    player: IPlayer,
    sector: ESector,
  ): Array<EResource.CREDIT | EResource.PUBLICITY | EResource.DATA> {
    if (sector === ESector.YELLOW) {
      return this.isRewardMarked(player, EResource.CREDIT)
        ? []
        : [EResource.CREDIT];
    }
    if (sector === ESector.RED) {
      return this.isRewardMarked(player, EResource.PUBLICITY)
        ? []
        : [EResource.PUBLICITY];
    }
    if (sector === ESector.BLUE) {
      return this.isRewardMarked(player, EResource.DATA)
        ? []
        : [EResource.DATA];
    }
    if (sector === ESector.BLACK) {
      return COSMOS_REWARD_ORDER.filter(
        (
          reward,
        ): reward is EResource.CREDIT | EResource.PUBLICITY | EResource.DATA =>
          !this.isRewardMarked(player, reward),
      );
    }
    return [];
  }

  private createBlackSectorRewardInput(
    player: IPlayer,
    rewards: Array<EResource.CREDIT | EResource.PUBLICITY | EResource.DATA>,
  ): IPlayerInput | undefined {
    return new SelectOption(
      player,
      rewards.map((reward) => ({
        id: reward,
        label: `Gain ${reward}`,
        onSelect: () => {
          this.markAndGainReward(player, reward);
          return undefined;
        },
      })),
      'Choose Cosmos Strategy Group reward',
    );
  }

  private markAndGainReward(
    player: IPlayer,
    reward: EResource.CREDIT | EResource.PUBLICITY | EResource.DATA,
  ): void {
    this.markReward(player, reward);
    this.gainReward(player, reward);
  }

  private gainReward(
    player: IPlayer,
    reward: EResource.CREDIT | EResource.PUBLICITY | EResource.DATA,
  ): void {
    if (reward === EResource.CREDIT) {
      player.resources.gain({ credits: 1 });
      return;
    }
    if (reward === EResource.PUBLICITY) {
      player.resources.gain({ publicity: 1 });
      return;
    }
    player.resources.gain({ data: 1 });
  }

  private isRewardMarked(player: IPlayer, reward: EResource): boolean {
    return this.getState(player).markedRewards?.[reward] === true;
  }

  private markReward(player: IPlayer, reward: EResource): void {
    const state = this.getState(player);
    this.setState(player, {
      ...state,
      markedRewards: {
        ...(state.markedRewards ?? {}),
        [reward]: true,
      },
    });
  }

  private getState(player: IPlayer): ICosmosStrategyGroupState {
    return (player.organizationState[this.id] ??
      {}) as ICosmosStrategyGroupState;
  }

  private setState(player: IPlayer, state: ICosmosStrategyGroupState): void {
    player.organizationState[this.id] = state as Record<string, unknown>;
  }
}
