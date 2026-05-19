import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('AstronautTrainingExperience', () => {
  it('quick mission checks current publicity after the main effect resolves', () => {
    const game = buildTestGame({ seed: 'sa-16-completion' });
    const { player } = activateMission(game, 'p1', 'SA.16');
    player.resources.setPublicity(0);
    expect(quickMissionIds(game, 'p1')).toContain('SA.16-0');

    player.resources.setPublicity(4);
    expect(quickMissionIds(game, 'p1')).not.toContain('SA.16-0');
  });
});
