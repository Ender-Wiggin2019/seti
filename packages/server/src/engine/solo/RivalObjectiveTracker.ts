import {
  ERivalObjectiveTaskKind,
  type IRivalObjectiveDefinition,
  type IRivalObjectiveTaskDefinition,
  RIVAL_OBJECTIVE_DEFINITIONS,
} from '@seti/common/constant/solo';
import {
  EPlanet,
  EResource,
  ESector,
  ETech,
  ETrace,
} from '@seti/common/types/element';
import {
  ERivalObjectiveTrigger,
  type TRivalObjectiveId,
} from '@seti/common/types/protocol/solo';
import type { Game } from '@/engine/Game.js';
import {
  EMissionEventType,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { RivalSetup } from './RivalSetup.js';

const OBJECTIVE_BY_ID = new Map<TRivalObjectiveId, IRivalObjectiveDefinition>(
  RIVAL_OBJECTIVE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export class RivalObjectiveTracker {
  public static refreshAfterHumanTurn(game: Game, playerId: string): void {
    const rivalState = game.rivalState;
    if (!rivalState || rivalState.difficulty === 1) {
      return;
    }

    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player || RivalSetup.isRivalPlayer(player)) {
      return;
    }

    for (const objectiveId of [...rivalState.revealedObjectiveIds]) {
      const definition = OBJECTIVE_BY_ID.get(objectiveId);
      if (!definition) {
        continue;
      }

      definition.tasks.forEach((task, index) => {
        if (this.isStaticConditionMet(task, player)) {
          this.markTask(game, definition, index);
        }
      });
    }

    for (const event of game.missionTracker.getTurnEvents()) {
      this.markFirstMatchingTriggeredTask(game, event, player.id);
    }

    this.refillRevealedRow(game);
  }

  private static isStaticConditionMet(
    task: IRivalObjectiveTaskDefinition,
    player: IPlayer,
  ): boolean {
    switch (task.kind) {
      case ERivalObjectiveTaskKind.MIN_SCORE:
        return player.score >= (task.amount ?? Number.POSITIVE_INFINITY);
      case ERivalObjectiveTaskKind.MIN_DATA_POOL:
        return (
          player.dataPool.count >= (task.amount ?? Number.POSITIVE_INFINITY)
        );
      case ERivalObjectiveTaskKind.MIN_PUBLICITY:
        return player.publicity >= (task.amount ?? Number.POSITIVE_INFINITY);
      default:
        return false;
    }
  }

  private static markFirstMatchingTriggeredTask(
    game: Game,
    event: IMissionEvent,
    playerId: string,
  ): void {
    const rivalState = game.rivalState;
    if (!rivalState) {
      return;
    }

    for (const objectiveId of [...rivalState.revealedObjectiveIds]) {
      const definition = OBJECTIVE_BY_ID.get(objectiveId);
      if (!definition) {
        continue;
      }

      const markedIndexes =
        rivalState.objectiveTaskMarkers[definition.id] ?? [];
      const taskIndex = definition.tasks.findIndex(
        (task, index) =>
          !markedIndexes.includes(index) &&
          this.isTriggerMatch(task, event, playerId),
      );
      if (taskIndex >= 0) {
        this.markTask(game, definition, taskIndex);
        return;
      }
    }
  }

  private static isTriggerMatch(
    task: IRivalObjectiveTaskDefinition,
    event: IMissionEvent,
    playerId: string,
  ): boolean {
    if (
      task.kind !== ERivalObjectiveTaskKind.TRIGGER ||
      task.triggerKey === undefined
    ) {
      return false;
    }

    return this.isTriggerKeyMatch(task.triggerKey, event, playerId);
  }

  private static isTriggerKeyMatch(
    triggerKey: string,
    event: IMissionEvent,
    playerId: string,
  ): boolean {
    if (triggerKey.startsWith('either:')) {
      return triggerKey
        .slice('either:'.length)
        .split('|')
        .some((key) => this.isTriggerKeyMatch(key, event, playerId));
    }

    switch (triggerKey) {
      case ERivalObjectiveTrigger.PROBE_LAUNCHED:
        return event.type === EMissionEventType.PROBE_LAUNCHED;
      case ERivalObjectiveTrigger.SCAN_PERFORMED:
        return event.type === EMissionEventType.SCAN_PERFORMED;
      case ERivalObjectiveTrigger.TECH_PROBE:
        return (
          event.type === EMissionEventType.TECH_RESEARCHED &&
          event.techCategory === ETech.PROBE
        );
      case ERivalObjectiveTrigger.TECH_SCAN:
        return (
          event.type === EMissionEventType.TECH_RESEARCHED &&
          event.techCategory === ETech.SCAN
        );
      case ERivalObjectiveTrigger.TECH_COMPUTER:
        return (
          event.type === EMissionEventType.TECH_RESEARCHED &&
          event.techCategory === ETech.COMPUTER
        );
      case ERivalObjectiveTrigger.TECH_ANY:
        return event.type === EMissionEventType.TECH_RESEARCHED;
      case ERivalObjectiveTrigger.TRACE_BLUE:
        return (
          event.type === EMissionEventType.TRACE_MARKED &&
          event.traceColor === ETrace.BLUE
        );
      case ERivalObjectiveTrigger.PROBE_VISITED_ASTEROIDS:
        return event.type === EMissionEventType.PROBE_VISITED_ASTEROIDS;
      case ERivalObjectiveTrigger.PROBE_VISITED_COMET:
        return event.type === EMissionEventType.PROBE_VISITED_COMET;
      case ERivalObjectiveTrigger.CARD_COST_3:
        return (
          event.type === EMissionEventType.CARD_PLAYED &&
          event.cost === 3 &&
          event.costType === EResource.CREDIT
        );
      case ERivalObjectiveTrigger.MISSION_COMPLETED:
        return event.type === EMissionEventType.MISSION_COMPLETED;
      case ERivalObjectiveTrigger.PROBE_LANDED:
        return event.type === EMissionEventType.PROBE_LANDED;
      case ERivalObjectiveTrigger.PROBE_ORBITED:
        return event.type === EMissionEventType.PROBE_ORBITED;
      case ERivalObjectiveTrigger.PLANET_VENUS:
        return this.isPlanetMissionEvent(event, EPlanet.VENUS);
      case ERivalObjectiveTrigger.PLANET_MERCURY:
        return this.isPlanetMissionEvent(event, EPlanet.MERCURY);
      case ERivalObjectiveTrigger.PLANET_JUPITER:
        return this.isPlanetMissionEvent(event, EPlanet.JUPITER);
      case ERivalObjectiveTrigger.PLANET_SATURN:
        return this.isPlanetMissionEvent(event, EPlanet.SATURN);
      case ERivalObjectiveTrigger.PLANET_MARS:
        return this.isPlanetMissionEvent(event, EPlanet.MARS);
      case ERivalObjectiveTrigger.PLANET_NEPTUNE:
        return this.isPlanetMissionEvent(event, EPlanet.NEPTUNE);
      case ERivalObjectiveTrigger.PLANET_URANUS:
        return this.isPlanetMissionEvent(event, EPlanet.URANUS);
      case ERivalObjectiveTrigger.SECTOR_DOMINANCE:
        return this.isSectorCompletionEvent(event, playerId);
      case ERivalObjectiveTrigger.SECTOR_DOMINANCE_YELLOW:
        return this.isSectorCompletionEvent(event, playerId, ESector.YELLOW);
      case ERivalObjectiveTrigger.SECTOR_DOMINANCE_RED:
        return this.isSectorCompletionEvent(event, playerId, ESector.RED);
      case ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLUE:
        return this.isSectorCompletionEvent(event, playerId, ESector.BLUE);
      case ERivalObjectiveTrigger.SECTOR_DOMINANCE_BLACK:
        return this.isSectorCompletionEvent(event, playerId, ESector.BLACK);
      default:
        return false;
    }
  }

  private static isPlanetMissionEvent(
    event: IMissionEvent,
    planet: EPlanet,
  ): boolean {
    return (
      (event.type === EMissionEventType.PROBE_ORBITED ||
        event.type === EMissionEventType.PROBE_LANDED) &&
      event.planet === planet
    );
  }

  private static isSectorCompletionEvent(
    event: IMissionEvent,
    playerId: string,
    color?: ESector,
  ): boolean {
    return (
      event.type === EMissionEventType.SECTOR_COMPLETED &&
      event.winnerPlayerId === playerId &&
      (color === undefined || event.color === color)
    );
  }

  private static markTask(
    game: Game,
    definition: IRivalObjectiveDefinition,
    taskIndex: number,
  ): void {
    const rivalState = game.rivalState;
    if (!rivalState) {
      return;
    }

    const markedIndexes = rivalState.objectiveTaskMarkers[definition.id] ?? [];
    if (markedIndexes.includes(taskIndex)) {
      return;
    }

    rivalState.objectiveTaskMarkers[definition.id] = [
      ...markedIndexes,
      taskIndex,
    ].sort((left, right) => left - right);

    if (
      rivalState.objectiveTaskMarkers[definition.id]?.length ===
      definition.tasks.length
    ) {
      rivalState.revealedObjectiveIds = rivalState.revealedObjectiveIds.filter(
        (id) => id !== definition.id,
      );
      delete rivalState.objectiveTaskMarkers[definition.id];
      if (!rivalState.completedObjectiveIds.includes(definition.id)) {
        rivalState.completedObjectiveIds.push(definition.id);
      }
    }
  }

  private static refillRevealedRow(game: Game): void {
    const rivalState = game.rivalState;
    if (!rivalState) {
      return;
    }

    while (
      rivalState.revealedObjectiveIds.length < 3 &&
      rivalState.objectiveDrawPile.length > 0
    ) {
      const nextObjectiveId = rivalState.objectiveDrawPile.shift();
      if (nextObjectiveId) {
        rivalState.revealedObjectiveIds.push(nextObjectiveId);
      }
    }
  }
}
