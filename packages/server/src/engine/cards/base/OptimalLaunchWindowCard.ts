import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { LaunchProbeEffect } from '@/engine/effects/index.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutHandledCustom,
  countOtherPlanetsAndCometsInEarthSector,
} from './probeSectorSignalCardUtils.js';

const CARD_ID = '133';
const HANDLED_CUSTOM_ID = 'desc.card-133';

function behaviorWithoutLaunchProbe() {
  const { launchProbe: _launchProbe, ...behavior } =
    behaviorWithoutHandledCustom(CARD_ID, HANDLED_CUSTOM_ID);
  return behavior;
}

export class OptimalLaunchWindow extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutLaunchProbe(),
    });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (LaunchProbeEffect.canExecute(context.player, game)) {
            LaunchProbeEffect.execute(context.player, game);
          }

          const movement = countOtherPlanetsAndCometsInEarthSector(game);
          if (movement > 0) {
            context.player.gainMove(movement);
          }
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
