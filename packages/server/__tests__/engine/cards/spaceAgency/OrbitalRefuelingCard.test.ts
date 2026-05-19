import { EPlanet } from '@seti/common/types/protocol/enums';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import { activateMission, triggerOptions } from './SpaceAgencyCardTestUtils.js';

describe('OrbitalRefueling', () => {
  it('full mission triggers only when visiting a planet where the player has an orbiter', () => {
    const game = buildTestGame({ seed: 'sa-21-completion' });
    const { player } = activateMission(game, 'p1', 'SA.21');
    const marsState = game.planetaryBoard?.planets.get(EPlanet.MARS);
    if (!marsState) throw new Error('missing Mars state');
    marsState.orbitSlots.push({ playerId: player.id });
    marsState.firstOrbitClaimed = true;

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.VENUS,
    });
    expect(triggerOptions(game, player.id)).not.toContain('complete-SA.21-0');

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_VISITED_PLANET,
      planet: EPlanet.MARS,
    });
    expect(triggerOptions(game, player.id)).toContain('complete-SA.21-0');
  });
});
