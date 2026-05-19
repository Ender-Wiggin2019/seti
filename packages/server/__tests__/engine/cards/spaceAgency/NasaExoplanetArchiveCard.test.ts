import { EComputerRow } from '@/engine/player/Computer.js';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  clearDataPool,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('NasaExoplanetArchive', () => {
  it('quick mission requires twelve data in pool plus computer, excluding stash', () => {
    const game = buildTestGame({ seed: 'sa-35-completion' });
    const { player } = activateMission(game, 'p1', 'SA.35');
    clearDataPool(player);
    player.dataPool.add(6);
    player.data.addToStash(6);
    expect(quickMissionIds(game, 'p1')).not.toContain('SA.35-0');

    for (let index = 0; index < 6; index += 1) {
      player.computer.placeData({ row: EComputerRow.TOP, index });
    }
    expect(quickMissionIds(game, 'p1')).toContain('SA.35-0');
  });
});
