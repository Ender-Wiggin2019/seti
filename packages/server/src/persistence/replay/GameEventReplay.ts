import type { IMainActionRequest } from '@seti/common/types/protocol/actions';
import {
  EGameEventType,
  type TGameEvent,
} from '@seti/common/types/protocol/events';
import { Game } from '@/engine/Game.js';
import type { IGame } from '@/engine/IGame.js';
import { RivalTurnController } from '@/engine/solo/RivalTurnController.js';

export function replayGameEvents(game: IGame, events: TGameEvent[]): IGame {
  let index = 0;
  while (index < events.length) {
    const event = events[index];
    const didReplayCommand = replayEvent(game, event);
    if (!didReplayCommand) {
      index += 1;
      continue;
    }

    const replayedThroughSeq = latestEventSeq(game);
    index += 1;
    while (
      index < events.length &&
      events[index] &&
      events[index].seq <= replayedThroughSeq
    ) {
      index += 1;
    }
  }
  return game;
}

function replayEvent(game: IGame, event: TGameEvent): boolean {
  switch (event.type) {
    case EGameEventType.ACTION:
      return replayActionEvent(game, event);
    case EGameEventType.FREE_ACTION:
      game.processFreeAction(requireActorId(event), event.action);
      return true;
    case EGameEventType.INPUT:
      game.processInput(requireActorId(event), event.response);
      return true;
    default:
      return false;
  }
}

function replayActionEvent(
  game: IGame,
  event: Extract<TGameEvent, { type: EGameEventType.ACTION }>,
): boolean {
  if (event.action === 'END_TURN') {
    game.processEndTurn(requireActorId(event));
    return true;
  }

  if (event.action === 'RIVAL_ACTION' || event.action === 'RIVAL_PASS') {
    if (!(game instanceof Game)) {
      throw new Error('Cannot replay rival turn without a Game instance');
    }
    RivalTurnController.resolveCurrentTurn(game);
    return true;
  }

  if (typeof event.action === 'string') {
    return false;
  }

  game.processMainAction(
    requireActorId(event),
    event.action as IMainActionRequest,
  );
  return true;
}

function requireActorId(event: TGameEvent): string {
  if (event.actorId === null) {
    throw new Error(`Cannot replay ${event.type} event without actorId`);
  }
  return event.actorId;
}

function latestEventSeq(game: IGame): number {
  return game.eventLog.toArray().at(-1)?.seq ?? 0;
}
