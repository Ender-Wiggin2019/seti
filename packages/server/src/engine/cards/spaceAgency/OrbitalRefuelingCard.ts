import type { IGame } from '@/engine/IGame.js';
import { buildMissionDefWithEventMatchers } from '@/engine/missions/buildMissionDef.js';
import {
  EMissionEventType,
  type IMissionDef,
  type IMissionEvent,
} from '@/engine/missions/IMission.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { MissionCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'SA.21';

function matchesVisitToOwnOrbiterPlanet(
  event: IMissionEvent,
  player: IPlayer,
  game: IGame,
): boolean {
  if (event.type !== EMissionEventType.PROBE_VISITED_PLANET) {
    return false;
  }
  const state = game.planetaryBoard?.planets.get(event.planet);
  return state?.orbitSlots.some((slot) => slot.playerId === player.id) ?? false;
}

export class OrbitalRefueling extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override getMissionDef(): IMissionDef {
    return buildMissionDefWithEventMatchers(CARD_ID, [
      matchesVisitToOwnOrbiterPlanet,
      matchesVisitToOwnOrbiterPlanet,
    ]);
  }
}
