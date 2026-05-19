import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('LofarArray', () => {
  it('quick mission requires every sector to have own signal or own fulfillment', () => {
    const game = buildTestGame({ seed: 'sa-42-completion' });
    activateMission(game, 'p1', 'SA.42');
    game.sectors.forEach((sector, index) => {
      if (index % 2 === 0) {
        sector.markSignal('p1');
      } else {
        sector.sectorWinners.push('p1');
      }
    });

    expect(quickMissionIds(game, 'p1')).toContain('SA.42-0');
  });
});
