import {
  EEffectType,
  type IBaseEffect,
  type IMissionEffect,
} from '@seti/common/types/effect';
import { EScanAction } from '@seti/common/types/element';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { hasCardData, loadCardData } from '../cards/loadCardData.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { SelectOption } from '../input/SelectOption.js';
import type { IPlayer, TCardItem } from '../player/IPlayer.js';
import {
  EMissionEventType,
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
  private readonly eventBuffer: Array<{
    checkpointId: number;
    event: IMissionEvent;
  }> = [];
  private nextCheckpointId = 1;
  private activeCheckpointId?: number;

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
    this.eventBuffer.push({
      checkpointId: this.activeCheckpointId ?? this.nextCheckpointId++,
      event,
    });
  }

  public runInCheckpoint<T>(callback: () => T): T {
    if (this.activeCheckpointId !== undefined) {
      return callback();
    }

    this.beginCheckpoint();

    try {
      return callback();
    } finally {
      this.endCheckpoint();
    }
  }

  public beginCheckpoint(): number {
    if (this.activeCheckpointId !== undefined) {
      return this.activeCheckpointId;
    }

    const checkpointId = this.nextCheckpointId++;
    this.activeCheckpointId = checkpointId;
    return checkpointId;
  }

  public endCheckpoint(): void {
    this.activeCheckpointId = undefined;
  }

  public hasActiveCheckpoint(): boolean {
    return this.activeCheckpointId !== undefined;
  }

  /**
   * Process buffered events against all FULL_MISSION branches for a player.
   * Each event is an independent checkpoint — per rules, one event can trigger
   * multiple branches but the player may only claim one space per event.
   * After that selection (or skip), the next event is evaluated separately.
   */
  public checkAndPromptTriggers(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    return this.checkAndPromptTriggersForPlayers([player], game);
  }

  public checkAndPromptTriggersForPlayers(
    players: ReadonlyArray<IPlayer>,
    game: IGame,
  ): IPlayerInput | undefined {
    const checkpoints = this.drainCheckpoints();
    if (checkpoints.length === 0) return undefined;

    return this.processCheckpointChain(players, game, checkpoints, 0, 0);
  }

  private processCheckpointChain(
    players: ReadonlyArray<IPlayer>,
    game: IGame,
    checkpoints: ReadonlyArray<ReadonlyArray<IMissionEvent>>,
    checkpointIndex: number,
    playerIndex: number,
  ): IPlayerInput | undefined {
    const checkpoint = checkpoints[checkpointIndex];
    if (!checkpoint) {
      return undefined;
    }

    for (let index = playerIndex; index < players.length; index++) {
      const player = players[index];
      const triggered = this.collectTriggeredBranches(player, checkpoint);

      if (triggered.length === 0) {
        continue;
      }

      return this.buildTriggerPrompt(player, game, triggered, () => {
        const nextPlayerIndex = index + 1;
        if (nextPlayerIndex < players.length) {
          return this.processCheckpointChain(
            players,
            game,
            checkpoints,
            checkpointIndex,
            nextPlayerIndex,
          );
        }

        return this.processCheckpointChain(
          players,
          game,
          checkpoints,
          checkpointIndex + 1,
          0,
        );
      });
    }

    return this.processCheckpointChain(
      players,
      game,
      checkpoints,
      checkpointIndex + 1,
      0,
    );
  }

  private collectTriggeredBranches(
    player: IPlayer,
    events: ReadonlyArray<IMissionEvent>,
  ): ICompletableMission[] {
    const missions = this.getOrCreatePlayerMissions(player.id);
    const triggered: ICompletableMission[] = [];
    const seenBranches = new Set<string>();

    for (const mission of missions) {
      if (!this.isMissionActiveOnBoard(player, mission.def.cardId)) continue;
      if (mission.def.type !== EMissionType.FULL) continue;

      for (let i = 0; i < mission.def.branches.length; i++) {
        if (mission.branchStates[i].completed) continue;

        const branch = mission.def.branches[i];
        const isTriggered = events.some((event) =>
          branch.matchEvent
            ? branch.matchEvent(event)
            : matchesFullMissionTrigger(branch, event),
        );

        if (isTriggered) {
          const branchKey = `${mission.def.cardId}:${i}`;
          if (seenBranches.has(branchKey)) {
            continue;
          }
          seenBranches.add(branchKey);
          triggered.push({
            cardId: mission.def.cardId,
            cardName: mission.def.cardName,
            branchIndex: i,
            rewards: branch.rewards,
          });
        }
      }
    }

    return this.applySignalOnlyMissionTriggerCap(triggered, events, missions);
  }

  /**
   * FAQ (rule-faq): one effect may satisfy multiple mission spaces, but only one
   * circle is covered at a time. For missions whose branches are exclusively
   * sector-signal triggers, a single checkpoint with multiple SIGNAL_PLACED
   * events (e.g. DISPLAY_CARD ×2) may only offer one branch until the player
   * triggers the mission again. SCAN checkpoints include SCAN_PERFORMED and
   * are not capped here.
   */
  private applySignalOnlyMissionTriggerCap(
    triggered: ICompletableMission[],
    events: ReadonlyArray<IMissionEvent>,
    missions: IMissionRuntimeState[],
  ): ICompletableMission[] {
    const signalPlacedCount = events.filter(
      (e) => e.type === EMissionEventType.SIGNAL_PLACED,
    ).length;
    if (
      signalPlacedCount <= 1 ||
      events.some((e) => e.type === EMissionEventType.SCAN_PERFORMED)
    ) {
      return triggered;
    }

    const byCard = new Map<string, ICompletableMission[]>();
    for (const item of triggered) {
      const list = byCard.get(item.cardId) ?? [];
      list.push(item);
      byCard.set(item.cardId, list);
    }

    const limited: ICompletableMission[] = [];
    for (const [cardId, list] of byCard) {
      const mission = missions.find((m) => m.def.cardId === cardId);
      if (
        !mission ||
        !this.isSignalSectorOnlyFullMission(mission) ||
        list.length <= 1
      ) {
        limited.push(...list);
        continue;
      }

      list.sort((a, b) => a.branchIndex - b.branchIndex);
      const first = list[0];
      if (first !== undefined) {
        limited.push(first);
      }
    }

    return limited;
  }

  private isSignalSectorOnlyFullMission(
    mission: IMissionRuntimeState,
  ): boolean {
    if (mission.def.type !== EMissionType.FULL) {
      return false;
    }

    const signalTypes = new Set<string>([
      EScanAction.YELLOW,
      EScanAction.RED,
      EScanAction.BLUE,
      EScanAction.BLACK,
    ]);

    return mission.def.branches.every((branch) =>
      branch.req.every((req) => {
        if (req.effectType === EEffectType.CUSTOMIZED) {
          return false;
        }
        return signalTypes.has((req as IBaseEffect).type as string);
      }),
    );
  }

  public getCompletableQuickMissions(
    player: IPlayer,
    game: IGame,
  ): ICompletableMission[] {
    const missions = this.getOrCreatePlayerMissions(player.id);
    const completable: ICompletableMission[] = [];

    for (const mission of missions) {
      if (!this.isMissionActiveOnBoard(player, mission.def.cardId)) continue;
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

  public checkAndPromptQuickMissions(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const completable = this.getCompletableQuickMissions(player, game);
    if (completable.length === 0) {
      return undefined;
    }

    return this.buildTriggerPrompt(player, game, completable);
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

  private drainCheckpoints(): IMissionEvent[][] {
    const buffered = [...this.eventBuffer];
    this.eventBuffer.length = 0;

    if (buffered.length === 0) {
      return [];
    }

    const checkpoints: IMissionEvent[][] = [];
    let currentCheckpointId: number | undefined;
    let currentEvents: IMissionEvent[] = [];

    for (const item of buffered) {
      if (currentCheckpointId !== item.checkpointId) {
        if (currentEvents.length > 0) {
          checkpoints.push(currentEvents);
        }
        currentCheckpointId = item.checkpointId;
        currentEvents = [];
      }

      currentEvents.push(item.event);
    }

    if (currentEvents.length > 0) {
      checkpoints.push(currentEvents);
    }

    return checkpoints;
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
    onDone?: () => IPlayerInput | undefined,
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

    const advance = onDone ?? (() => undefined);

    const options = [
      ...triggered.map((t) => ({
        id: `complete-${t.cardId}-${t.branchIndex}`,
        label: `${t.cardName}: ${rewardDesc(t)}`,
        onSelect: (): IPlayerInput | undefined => {
          this.completeMissionBranch(player, game, t.cardId, t.branchIndex);
          return advance();
        },
      })),
      {
        id: 'skip-missions',
        label: 'Skip',
        onSelect: (): IPlayerInput | undefined => advance(),
      },
    ];

    return new SelectOption(
      player,
      options,
      'Mission triggered! Claim reward?',
    );
  }

  private markMissionFullyComplete(player: IPlayer, cardId: string): void {
    const missionIndex = player.playedMissions.findIndex(
      (m) => MissionTracker.resolveCardId(m) === cardId,
    );

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

  private isMissionActiveOnBoard(player: IPlayer, cardId: string): boolean {
    return player.playedMissions.some(
      (m) => MissionTracker.resolveCardId(m) === cardId,
    );
  }

  private static resolveCardId(item: TCardItem): string | undefined {
    if (typeof item === 'string') return item;
    return (item as { id?: string })?.id;
  }
}
