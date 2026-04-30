import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
} from '../../board/SolarSystem.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '18';

export class HayabusaCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (!hasProbeOnAsteroid(context)) return undefined;
          return game.markTrace(ETrace.YELLOW, context.player.id);
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function hasProbeOnAsteroid(context: ICardRuntimeContext): boolean {
  const solarSystem = context.game.solarSystem;
  if (!solarSystem) return false;

  return solarSystem.spaces.some(
    (space) =>
      hasAsteroid(space) &&
      space.occupants.some((probe) => probe.playerId === context.player.id),
  );
}

function hasAsteroid(space: ISolarSystemSpace): boolean {
  return space.elements.some(
    (element) => element.type === ESolarSystemElementType.ASTEROID,
  );
}
