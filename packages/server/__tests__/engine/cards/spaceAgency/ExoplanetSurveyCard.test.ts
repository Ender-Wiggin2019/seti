import { ESector } from '@seti/common/types/element';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import {
  activateMission,
  quickMissionIds,
} from './SpaceAgencyCardTestUtils.js';

describe('ExoplanetSurvey', () => {
  it('quick mission requires own signals in red, yellow, blue, and black sectors', () => {
    const game = buildTestGame({ seed: 'sa-41-completion' });
    activateMission(game, 'p1', 'SA.41');
    for (const color of [
      ESector.RED,
      ESector.YELLOW,
      ESector.BLUE,
      ESector.BLACK,
    ]) {
      const sector = game.sectors.find((item) => item.color === color);
      if (!sector) throw new Error(`missing ${color} sector`);
      sector.markSignal('p1');
    }

    expect(quickMissionIds(game, 'p1')).toContain('SA.41-0');
  });
});
