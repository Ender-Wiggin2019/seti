import { EPlanet } from '@seti/common/types/protocol/enums';
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

const CARD_ID = 'SA.12';
const HANDLED_CUSTOM_ID = 'sa.desc.card_12';

export class TwoPlanetFlyby extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const tracker = game.missionTracker as unknown as {
        turnEventHistory?: IMissionEvent[];
      };
      const planets = new Set<EPlanet>();
      for (const event of tracker.turnEventHistory ?? []) {
        if (
          event.type === EMissionEventType.PROBE_VISITED_PLANET &&
          event.planet !== EPlanet.EARTH
        ) {
          planets.add(event.planet);
        }
      }
      if (planets.size >= 2) {
        context.player.score += 3;
      }
      return undefined;
    });
    return undefined;
  }
}
