import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'ET.27';
const HANDLED_CUSTOM_ID = 'desc.et-27';

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => id !== HANDLED_CUSTOM_ID);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class PerfectTiming extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: behaviorWithoutHandledCustom() });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<MissionCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const visited = game.missionTracker.hasTurnEvent(
            (event) =>
              event.type === EMissionEventType.PROBE_VISITED_PLANET &&
              event.planet === EPlanet.OUMUAMUA,
          );
          if (visited) {
            context.player.gainExofossils(1);
          }
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
