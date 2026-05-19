import { EOrganizationId } from '@seti/common/types/organization';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';
import { MarkSectorSignalEffect } from '../../effects/scan/MarkSectorSignalEffect.js';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import { FreeActionCornerFreeAction } from '../../freeActions/FreeActionCorner.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';

interface ISentinelState {
  lastCardCornerCardId?: string;
}

export class SentinelProbeNetwork extends Organization {
  public constructor() {
    super(EOrganizationId.SENTINEL_PROBE_NETWORK);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, _game: IGame): boolean {
    const cardId = this.getState(player).lastCardCornerCardId;
    return cardId !== undefined && this.hasFreeActionCorner(cardId);
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const cardId = this.getState(player).lastCardCornerCardId;
    if (cardId === undefined) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Sentinel Probe Network has no stored card corner effect',
        { playerId: player.id },
      );
    }
    const pendingInput = FreeActionCornerFreeAction.executeCardCornerRewards(
      player,
      game,
      cardId,
    );
    this.setState(player, {});
    player.oncePerRoundUsed[this.id] = true;
    return pendingInput;
  }

  protected override registerEvents(player: IPlayer, game: IGame): void {
    const owner = this.getEventOwner(player);
    game.eventBus.unsubscribeOwner(owner);
    game.eventBus.subscribe(
      EGameRuntimeEvent.PROBE_LAUNCHED,
      (context) => {
        if (!player.organizationIds.includes(this.id)) return undefined;
        if ((context.player as IPlayer | undefined)?.id !== player.id) {
          return undefined;
        }
        const spaceId = context.spaceId;
        if (typeof spaceId !== 'string') return undefined;

        const sectorIndex = game.solarSystem?.getSectorIndexOfSpace(spaceId);
        if (sectorIndex === undefined || sectorIndex === null) {
          return undefined;
        }
        MarkSectorSignalEffect.markByIndex(player, game, sectorIndex);
        return undefined;
      },
      { owner },
    );
    game.eventBus.subscribe(
      EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      (context) => {
        if ((context.player as IPlayer | undefined)?.id !== player.id) {
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
        if (loadCardData(cardId).alien !== undefined) {
          return undefined;
        }
        if (!this.hasFreeActionCorner(cardId)) {
          return undefined;
        }

        this.setState(player, { lastCardCornerCardId: cardId });
        return undefined;
      },
      { owner },
    );
    game.eventBus.subscribe(
      EGameRuntimeEvent.TURN_END,
      (context) => {
        if (context.playerId === player.id) {
          this.setState(player, {});
        }
        return undefined;
      },
      { owner },
    );
  }

  private getState(player: IPlayer): ISentinelState {
    return (player.organizationState[this.id] ?? {}) as ISentinelState;
  }

  private setState(player: IPlayer, state: ISentinelState): void {
    player.organizationState[this.id] = state as Record<string, unknown>;
  }

  private hasFreeActionCorner(cardId: string): boolean {
    return (
      hasCardData(cardId) && (loadCardData(cardId).freeAction?.length ?? 0) > 0
    );
  }
}
