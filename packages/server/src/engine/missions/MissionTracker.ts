import { EEffectType, type IMissionEffect } from '@seti/common/types/effect';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import type { IPlayer } from '../player/IPlayer.js';
import {
  EMissionType,
  type ICompletableMission,
  type IMissionDef,
  type IMissionEvent,
  type IMissionRuntimeState,
} from './IMission.js';
import {
  checkQuickMissionCondition,
  matchesFullMissionTrigger,
} from './MissionCondition.js';
import { applyMissionRewards } from './MissionReward.js';

/**
 * Tracks mission state for all players.
 *
 * Responsibilities:
 * - Register missions when mission cards are played
 * - Buffer game events and check FULL_MISSION triggers
 * - Evaluate QUICK_MISSION state conditions
 * - Apply rewards and track branch completion
 */
export class MissionTracker {
  private readonly missionsByPlayer = new Map<string, IMissionRuntimeState[]>();
  private readonly eventBuffer: IMissionEvent[] = [];

  public registerMission(missionDef: IMissionDef, playerId: string): void {
    const missions = this.getOrCreatePlayerMissions(playerId);
    if (missions.some((m) => m.def.cardId === missionDef.cardId)) return;

    missions.push({
      def: missionDef,
      playerId,
      branchStates: missionDef.branches.map(() => ({ completed: false })),
    });
  }

  public registerMissionFromCard(cardId: string, playerId: string): void {
    if (!hasCardData(cardId)) return;

    const cardData = loadCardData(cardId);
    const missionEffect = cardData.effects.find(
      (eff) =>
        eff.effectType === EEffectType.MISSION_FULL ||
        eff.effectType === EEffectType.MISSION_QUICK,
    ) as IMissionEffect | undefined;

    if (!missionEffect) return;

    const type =
      missionEffect.effectType === EEffectType.MISSION_FULL
        ? EMissionType.FULL
        : EMissionType.QUICK;

    this.registerMission(
      {
        cardId,
        cardName: cardData.name,
        type,
        branches: missionEffect.missions.map((item) => ({
          req: item.req,
          rewards: item.reward,
        })),
      },
      playerId,
    );
  }

  public recordEvent(event: IMissionEvent): void {
    this.eventBuffer.push(event);
  }

  /**
   * Process buffered events against all FULL_MISSION branches for a player.
   * Returns a SelectOption prompt if any branches triggered, undefined otherwise.
   * Clears the event buffer after processing.
   */
  public checkAndPromptTriggers(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const events = [...this.eventBuffer];
    this.eventBuffer.length = 0;

    if (events.length === 0) return undefined;

    const missions = this.getOrCreatePlayerMissions(player.id);
    const triggered: ICompletableMission[] = [];

    for (const mission of missions) {
      if (mission.def.type !== EMissionType.FULL) continue;

      for (let i = 0; i < mission.def.branches.length; i++) {
        if (mission.branchStates[i].completed) continue;

        const branch = mission.def.branches[i];
        const isTriggered = events.some((event) =>
          matchesFullMissionTrigger(branch, event),
        );

        if (isTriggered) {
          triggered.push({
            cardId: mission.def.cardId,
            cardName: mission.def.cardName,
            branchIndex: i,
            rewards: branch.rewards,
          });
        }
      }
    }

    if (triggered.length === 0) return undefined;

    return this.buildTriggerPrompt(player, game, triggered);
  }

  public getCompletableQuickMissions(
    player: IPlayer,
    game: IGame,
  ): ICompletableMission[] {
    const missions = this.getOrCreatePlayerMissions(player.id);
    const completable: ICompletableMission[] = [];

    for (const mission of missions) {
      if (mission.def.type !== EMissionType.QUICK) continue;

      for (let i = 0; i < mission.def.branches.length; i++) {
        if (mission.branchStates[i].completed) continue;

        const branch = mission.def.branches[i];
        if (checkQuickMissionCondition(branch, player, game)) {
          completable.push({
            cardId: mission.def.cardId,
            cardName: mission.def.cardName,
            branchIndex: i,
            rewards: branch.rewards,
          });
        }
      }
    }

    return completable;
  }

  public hasCompletableQuickMissions(player: IPlayer, game: IGame): boolean {
    return this.getCompletableQuickMissions(player, game).length > 0;
  }

  public completeMissionBranch(
    player: IPlayer,
    game: IGame,
    cardId: string,
    branchIndex: number,
  ): void {
    const missions = this.getOrCreatePlayerMissions(player.id);
    const mission = missions.find((m) => m.def.cardId === cardId);
    if (!mission) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Mission card ${cardId} not registered for player ${player.id}`,
        { cardId, playerId: player.id },
      );
    }

    const branchState = mission.branchStates[branchIndex];
    if (!branchState) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Branch index ${branchIndex} out of range for mission ${cardId}`,
        { cardId, branchIndex },
      );
    }
    if (branchState.completed) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Branch ${branchIndex} of mission ${cardId} is already completed`,
        { cardId, branchIndex },
      );
    }

    const branch = mission.def.branches[branchIndex];
    applyMissionRewards(branch.rewards, player, game);

    branchState.completed = true;
    branchState.completedAtRound = game.round;

    if (mission.branchStates.every((s) => s.completed)) {
      this.markMissionFullyComplete(player, cardId);
    }
  }

  public getMissionState(
    playerId: string,
    cardId: string,
  ): IMissionRuntimeState | undefined {
    return this.getOrCreatePlayerMissions(playerId).find(
      (m) => m.def.cardId === cardId,
    );
  }

  public getAllMissions(playerId: string): ReadonlyArray<IMissionRuntimeState> {
    return this.getOrCreatePlayerMissions(playerId);
  }

  public clearEventBuffer(): void {
    this.eventBuffer.length = 0;
  }

  private getOrCreatePlayerMissions(playerId: string): IMissionRuntimeState[] {
    let missions = this.missionsByPlayer.get(playerId);
    if (!missions) {
      missions = [];
      this.missionsByPlayer.set(playerId, missions);
    }
    return missions;
  }

  private buildTriggerPrompt(
    player: IPlayer,
    game: IGame,
    triggered: ICompletableMission[],
  ): IPlayerInput {
    const rewardDesc = (t: ICompletableMission) =>
      t.rewards
        .map((r) => {
          if (r.effectType !== EEffectType.BASE) return '';
          const base = r as { type: string; value?: number };
          return `${base.type}${base.value && base.value > 1 ? ` ×${base.value}` : ''}`;
        })
        .filter(Boolean)
        .join(', ');

    const options = [
      ...triggered.map((t) => ({
        id: `complete-${t.cardId}-${t.branchIndex}`,
        label: `${t.cardName}: ${rewardDesc(t)}`,
        onSelect: (): IPlayerInput | undefined => {
          this.completeMissionBranch(player, game, t.cardId, t.branchIndex);
          const remaining = triggered.filter(
            (other) =>
              !(
                other.cardId === t.cardId && other.branchIndex === t.branchIndex
              ),
          );
          if (remaining.length > 0) {
            return this.buildTriggerPrompt(player, game, remaining);
          }
          return undefined;
        },
      })),
      {
        id: 'skip-missions',
        label: 'Skip',
        onSelect: (): IPlayerInput | undefined => undefined,
      },
    ];

    return new SelectOption(
      player,
      options,
      'Mission triggered! Claim reward?',
    );
  }

  private markMissionFullyComplete(player: IPlayer, cardId: string): void {
    const missionIndex = player.playedMissions.findIndex((m) => {
      if (typeof m === 'string') return m === cardId;
      return (m as { id?: string })?.id === cardId;
    });

    if (missionIndex >= 0) {
      const [removed] = player.playedMissions.splice(missionIndex, 1);
      player.completedMissions.push(removed);
    }

    const missions = this.getOrCreatePlayerMissions(player.id);
    const trackerIndex = missions.findIndex((m) => m.def.cardId === cardId);
    if (trackerIndex >= 0) {
      missions.splice(trackerIndex, 1);
    }
  }
}
