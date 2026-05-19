import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('PsycheProbe', () => {
  it('quick mission requires an own probe on asteroids', () => {
    const game = buildTestGame({ seed: 'sa-11-completion' });
    activateMission(game, 'p1', 'SA.11');
    const asteroidSpace = game.solarSystem?.spaces.find((space) =>
      space.elements.some(
        (element) => element.type === ESolarSystemElementType.ASTEROID,
      ),
    );
    if (!asteroidSpace) throw new Error('missing asteroid space');

    game.solarSystem?.placeProbe('p1', asteroidSpace.id);

    expect(quickMissionIds(game, 'p1')).toContain('SA.11-0');
  });
});
