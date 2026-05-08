import { alienCards } from '@seti/common/data/alienCards';
import { EResource, ETrace } from '@seti/common/types/element';
import { EAlienType } from '@seti/common/types/protocol/enums';
import type { TPublicSlotReward } from '@seti/common/types/protocol/gameState';
import { createActionEvent } from '../../event/GameEvent.js';
import { isSoloMode } from '../../GameOptions.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { RivalResourceResolver } from '../../solo/RivalResourceResolver.js';
import { RivalSetup } from '../../solo/RivalSetup.js';
import {
  type AlienBoard,
  type ICentauriansRewardSlotComponent,
  isCentauriansAlienBoard,
} from '../AlienBoard.js';
import { executeSimpleSlotRewards } from '../AlienRewards.js';
import { getCentaurianMessageDelayedEffect } from '../CentaurianMessageEffects.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

export class CentauriansAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.CENTAURIANS;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      return undefined;
    }

    if (board.messageMilestones.length === 0) {
      board.messageMilestones = game.players.map((player) => ({
        playerId: player.id,
        threshold: player.score + 15,
        sourceCardId: null,
        resolved: false,
      }));
    }
    for (const player of game.players) {
      board.pendingMessagesByPlayer[player.id] ??= [];
    }

    return undefined;
  }

  public getAlienDeckCardIds(_game: IGame, _board: AlienBoard): string[] {
    return alienCards
      .filter((card) => card.alien === EAlienType.CENTAURIANS)
      .map((card) => card.id);
  }

  public onMilestoneCheck(
    game: IGame,
    orderedPlayers: readonly IPlayer[],
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      return onComplete();
    }

    const claim = orderedPlayers
      .map((player) => ({
        player,
        milestone: board.messageMilestones.find(
          (candidate) =>
            candidate.playerId === player.id &&
            !candidate.resolved &&
            player.score >= candidate.threshold,
        ),
      }))
      .find((candidate) => candidate.milestone !== undefined);

    if (!claim || !claim.milestone) {
      return onComplete();
    }

    const { player, milestone } = claim;
    const pendingMessages = board.pendingMessagesByPlayer[player.id] ?? [];
    const resolvedCardId =
      milestone.sourceCardId === null
        ? null
        : this.resolvePendingMessage(pendingMessages, milestone.sourceCardId);

    const continueResolving = () =>
      this.onMilestoneCheck(game, orderedPlayers, onComplete);
    return this.createRewardClaimInput(
      game,
      player,
      resolvedCardId,
      milestone.threshold,
      () => {
        milestone.resolved = true;
        game.eventLog.append(
          createActionEvent(
            player.id,
            'MILESTONE_CENTAURIANS_MESSAGE_RESOLVED',
            {
              threshold: milestone.threshold,
              cardId: resolvedCardId,
            },
          ),
        );
        if (resolvedCardId === null) {
          return continueResolving();
        }
        const delayedInput = this.resolveDelayedMessage(
          game,
          player,
          resolvedCardId,
          continueResolving,
        );
        return delayedInput ?? continueResolving();
      },
    );
  }

  private resolvePendingMessage(
    pendingMessages: string[],
    expectedCardId: string,
  ): string | null {
    if (pendingMessages.length === 0) {
      return null;
    }

    const [firstMessage] = pendingMessages;
    if (firstMessage === expectedCardId) {
      return pendingMessages.shift() ?? null;
    }

    const index = pendingMessages.indexOf(expectedCardId);
    if (index < 0) {
      return null;
    }
    return pendingMessages.splice(index, 1)[0] ?? null;
  }

  private resolveDelayedMessage(
    game: IGame,
    player: IPlayer,
    cardId: string,
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const delayed = getCentaurianMessageDelayedEffect(cardId);
    if (delayed?.type === 'trace') {
      return game.alienState.createTraceInput(player, game, delayed.trace, {
        onComplete: () => {
          this.discardResolvedMessage(game, cardId);
          return onComplete();
        },
      });
    }
    if (delayed?.type === 'credit-and-trace') {
      player.resources.gain({ credits: 1 });
      return game.alienState.createTraceInput(player, game, delayed.trace, {
        onComplete: () => {
          this.discardResolvedMessage(game, cardId);
          return onComplete();
        },
      });
    }

    this.tuckResolvedMessage(game, player, cardId);
    return undefined;
  }

  private createRewardClaimInput(
    game: IGame,
    player: IPlayer,
    cardId: string | null,
    threshold: number,
    onRewardClaimed: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      return onRewardClaimed();
    }

    const availableSlots = board
      .getAvailableRewardSlots()
      .filter((slot) => player.resources.canAfford({ data: slot.dataCost }));
    if (availableSlots.length === 0) {
      return onRewardClaimed();
    }

    if (isSoloMode(game.options) && RivalSetup.isRivalPlayer(player)) {
      return this.claimRivalRewardSlot(
        game,
        player,
        cardId,
        threshold,
        availableSlots,
        onRewardClaimed,
      );
    }

    return new SelectOption(
      player,
      availableSlots.map((slot) => ({
        id: `claim-centaurians:${slot.slotId}`,
        label: this.formatRewardSlotLabel(slot),
        onSelect: () => {
          const claimedSlot = board.claimRewardSlot(slot.slotId, player.id);
          if (!claimedSlot) {
            return onRewardClaimed();
          }
          if (claimedSlot.dataCost > 0) {
            player.resources.spend({ data: claimedSlot.dataCost });
          }
          game.eventLog.append(
            createActionEvent(player.id, 'CENTAURIANS_REWARD_CLAIMED', {
              threshold,
              cardId,
              slotId: claimedSlot.slotId,
            }),
          );
          return this.resolveRewardSlot(
            game,
            player,
            claimedSlot,
            onRewardClaimed,
          );
        },
      })),
      `Claim Centaurians ${threshold} VP reward`,
    );
  }

  private claimRivalRewardSlot(
    game: IGame,
    player: IPlayer,
    cardId: string | null,
    threshold: number,
    availableSlots: readonly ICentauriansRewardSlotComponent[],
    onRewardClaimed: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (!isCentauriansAlienBoard(board)) {
      return onRewardClaimed();
    }

    const selectedSlot = availableSlots[availableSlots.length - 1];
    if (!selectedSlot) {
      return onRewardClaimed();
    }
    const claimedSlot = board.claimRewardSlot(selectedSlot.slotId, player.id);
    if (!claimedSlot) {
      return onRewardClaimed();
    }
    if (claimedSlot.dataCost > 0) {
      player.resources.spend({ data: claimedSlot.dataCost });
    }
    game.eventLog.append(
      createActionEvent(player.id, 'CENTAURIANS_REWARD_CLAIMED', {
        threshold,
        cardId,
        slotId: claimedSlot.slotId,
      }),
    );
    this.resolveRivalRewardSlot(game, claimedSlot);
    return onRewardClaimed();
  }

  private formatRewardSlotLabel(slot: ICentauriansRewardSlotComponent): string {
    const rewards = slot.rewards
      .map((reward) => {
        if (reward.type === 'CUSTOM') return reward.effectId;
        return `${reward.amount} ${reward.type}`;
      })
      .join(', ');
    return slot.dataCost > 0
      ? `${rewards} (cost ${slot.dataCost} data)`
      : rewards;
  }

  private resolveRewardSlot(
    game: IGame,
    player: IPlayer,
    slot: ICentauriansRewardSlotComponent,
    onComplete: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    for (const reward of slot.rewards) {
      if (reward.type !== 'CUSTOM') {
        executeSimpleSlotRewards(player, game, [reward]);
        continue;
      }
      if (reward.effectId === 'CENTAURIANS_ANY_TRACE') {
        return game.alienState.createTraceInput(player, game, ETrace.ANY, {
          onComplete,
        });
      }
      if (reward.effectId === 'CENTAURIANS_DRAW_ALIEN_CARD') {
        return game.alienState.createDrawAlienCardInput(
          player,
          game,
          { alienType: EAlienType.CENTAURIANS },
          onComplete,
        );
      }
    }

    return onComplete();
  }

  private resolveRivalRewardSlot(
    game: IGame,
    slot: ICentauriansRewardSlotComponent,
  ): void {
    for (const reward of slot.rewards) {
      if (reward.type !== 'CUSTOM') {
        RivalResourceResolver.applyRewards(game, [
          reward,
        ] as readonly TPublicSlotReward[]);
        continue;
      }
      if (reward.effectId === 'CENTAURIANS_DRAW_ALIEN_CARD') {
        RivalResourceResolver.gainProgress(game, 1);
      }
    }
  }

  private discardResolvedMessage(game: IGame, cardId: string): void {
    const board = game.alienState.getBoardByType(EAlienType.CENTAURIANS);
    if (isCentauriansAlienBoard(board)) {
      board.discardAlienCard(cardId);
    }
  }

  private tuckResolvedMessage(
    game: IGame,
    player: IPlayer,
    cardId: string,
  ): void {
    const incomeResource = player.addTuckedIncomeFromCard(cardId);
    if (incomeResource === EResource.CREDIT) {
      player.resources.gain({ credits: 1 });
      return;
    }
    if (incomeResource === EResource.ENERGY) {
      player.resources.gain({ energy: 1 });
      return;
    }
    if (incomeResource === EResource.DATA) {
      player.resources.gain({ data: 1 });
      return;
    }
    if (incomeResource === EResource.PUBLICITY) {
      player.resources.gain({ publicity: 1 });
      return;
    }
    if (incomeResource === EResource.CARD) {
      const drawn = game.mainDeck.drawWithReshuffle(game.random);
      if (drawn !== undefined) {
        player.hand.push(drawn);
        game.lockCurrentTurn();
      }
    }
  }
}
