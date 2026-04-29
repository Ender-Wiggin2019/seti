import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import {
  ESolarSystemElementType,
  type ISolarSystemSpace,
} from '../../board/SolarSystem.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '17';

interface IProbeDataTarget {
  id: string;
  label: string;
  data: number;
}

export class OsirisRexCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          const targets = collectProbeTargets(context);
          if (targets.length === 0) return undefined;

          const resolveTarget = (target: IProbeDataTarget) => {
            if (target.data > 0) {
              context.player.resources.gain({ data: target.data });
            }
            return undefined;
          };

          if (targets.length === 1) {
            return resolveTarget(targets[0]);
          }

          return new SelectOption(
            context.player,
            targets.map((target) => ({
              id: target.id,
              label: target.label,
              onSelect: () => resolveTarget(target),
            })),
            'Choose probe for asteroid survey',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function collectProbeTargets(context: ICardRuntimeContext): IProbeDataTarget[] {
  const solarSystem = context.game.solarSystem;
  if (!solarSystem) return [];

  const targets: IProbeDataTarget[] = [];
  for (const space of solarSystem.spaces) {
    for (const probe of space.occupants) {
      if (probe.playerId !== context.player.id) continue;
      targets.push({
        id: probe.id,
        label: `Probe ${probe.id}`,
        data: asteroidDataForSpace(
          space,
          solarSystem.getAdjacentSpaces(space.id),
        ),
      });
    }
  }
  return targets;
}

function asteroidDataForSpace(
  space: ISolarSystemSpace,
  adjacentSpaces: ISolarSystemSpace[],
): number {
  const currentAsteroid = hasAsteroid(space) ? 2 : 0;
  const adjacentAsteroids = adjacentSpaces.filter((adjacent) =>
    hasAsteroid(adjacent),
  ).length;
  return currentAsteroid + adjacentAsteroids;
}

function hasAsteroid(space: ISolarSystemSpace): boolean {
  return space.elements.some(
    (element) => element.type === ESolarSystemElementType.ASTEROID,
  );
}
