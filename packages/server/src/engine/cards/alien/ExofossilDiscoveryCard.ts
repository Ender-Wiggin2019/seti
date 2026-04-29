import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { OumuamuaAlienPlugin } from '@/engine/alien/plugins/OumuamuaAlienPlugin.js';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'ET.23';
const HANDLED_CUSTOM_ID = 'desc.et-23';

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => id !== HANDLED_CUSTOM_ID);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class ExofossilDiscovery extends MissionCard {
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
          const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
          if (!(plugin instanceof OumuamuaAlienPlugin)) return undefined;
          const state = plugin.getRuntimeState(game);
          if (!state?.meta) return undefined;

          const sectorIndex = game.solarSystem?.getSectorIndexOfPlanet(
            EPlanet.OUMUAMUA,
          );
          if (sectorIndex === undefined || sectorIndex === null) {
            return undefined;
          }

          return MarkSectorSignalEffect.markByIndexWithAlternatives(
            context.player,
            game,
            sectorIndex,
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
