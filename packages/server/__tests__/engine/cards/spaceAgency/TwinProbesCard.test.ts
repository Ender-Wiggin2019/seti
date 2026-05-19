import { EPlanet } from '@seti/common/types/protocol/enums';
import {
  buildTestGame,
  placeProbeOnPlanet,
} from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('TwinProbes', () => {
  it('quick mission requires probes at two different non-Earth planets in space', () => {
    const game = buildTestGame({ seed: 'sa-7-completion' });
    activateMission(game, 'p1', 'SA.7');
    expect(quickMissionIds(game, 'p1')).not.toContain('SA.7-0');

    placeProbeOnPlanet(game, 'p1', EPlanet.MARS);
    placeProbeOnPlanet(game, 'p1', EPlanet.VENUS);

    expect(quickMissionIds(game, 'p1')).toContain('SA.7-0');
  });
});
