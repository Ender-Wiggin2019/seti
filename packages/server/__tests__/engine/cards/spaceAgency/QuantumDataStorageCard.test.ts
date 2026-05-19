import { EComputerRow } from '@/engine/player/Computer.js';
import { scoreEndGameCard } from '@/engine/scoring/GoldScoringTile.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';
import { clearDataPool } from './SpaceAgencyCardTestUtils.js';

describe('QuantumDataStorage', () => {
  it('scores only data remaining in the data pool', () => {
    const game = buildTestGame({ seed: 'sa-8-completion' });
    const player = getPlayer(game, 'p1');
    clearDataPool(player);
    player.dataPool.add(2);
    player.computer.placeData({ row: EComputerRow.TOP, index: 0 });

    expect(scoreEndGameCard('SA.8', player, game)).toBe(6);
  });
});
