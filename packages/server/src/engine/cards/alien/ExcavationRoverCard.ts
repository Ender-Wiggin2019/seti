import { EPlanet } from '@seti/common/types/protocol/enums';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'ET.30';
const HANDLED_CUSTOM_ID = 'desc.et-30';

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => id !== HANDLED_CUSTOM_ID);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class ExcavationRover extends MissionCard {
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
          const landedWithThisAction = game.missionTracker.hasTurnEvent(
            (event) =>
              event.type === EMissionEventType.PROBE_LANDED &&
              event.planet === EPlanet.OUMUAMUA,
          );
          if (landedWithThisAction) {
            context.player.score += 3;
          }
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
