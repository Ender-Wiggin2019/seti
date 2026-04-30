import { buildMissionDefWithEventMatchers } from '@/engine/missions/buildMissionDef.js';
import {
  EMissionEventType,
  type IMissionDef,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

function createAsteroidsVisitMatcher(): (event: IMissionEvent) => boolean {
  const consumedEvents = new WeakSet<object>();
  return (event: IMissionEvent): boolean => {
    if (event.type !== EMissionEventType.PROBE_VISITED_ASTEROIDS) {
      return false;
    }
    if (consumedEvents.has(event as object)) {
      return false;
    }
    consumedEvents.add(event as object);
    return true;
  };
}

/**
 * Card No.129 — Asteroids Research.
 * FULL_MISSION: each asteroid visit completes at most one branch.
 */
export class AsteroidsResearch extends MissionCard {
  public constructor() {
    super(loadCardData('129'));
  }

  public override getMissionDef(): IMissionDef {
    const consumePerBranch = createAsteroidsVisitMatcher();
    return buildMissionDefWithEventMatchers('129', [
      consumePerBranch,
      consumePerBranch,
      consumePerBranch,
    ]);
  }
}
