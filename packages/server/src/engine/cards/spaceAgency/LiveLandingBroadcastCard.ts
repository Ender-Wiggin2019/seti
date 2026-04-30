import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import {
  EMissionEventType,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.6';
const HANDLED_CUSTOM_ID = 'sa.desc.card_6';

function turnEvents(game: ICardRuntimeContext['game']): IMissionEvent[] {
  return (
    (game.missionTracker as unknown as { turnEventHistory?: IMissionEvent[] })
      .turnEventHistory ?? []
  );
}

function asInput(result: unknown): IPlayerInput | undefined {
  if (
    result !== null &&
    typeof result === 'object' &&
    typeof (result as IPlayerInput).toModel === 'function'
  ) {
    return result as IPlayerInput;
  }
  return undefined;
}

export class LiveLandingBroadcast extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    const eventStart = turnEvents(context.game).length;
    pushCoreAction(context.player, context.game, (game) => {
      const landed = turnEvents(game)
        .slice(eventStart)
        .findLast((event) => event.type === EMissionEventType.PROBE_LANDED);
      if (!landed || landed.type !== EMissionEventType.PROBE_LANDED) {
        return undefined;
      }

      return asInput(
        MarkSectorSignalEffect.markByPlanet(
          context.player,
          game,
          landed.planet,
        ),
      );
    });
    return undefined;
  }
}
