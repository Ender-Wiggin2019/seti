import { EPlanet } from '@seti/common/types/protocol/enums';
import { EMissionEventType } from '@/engine/missions/IMission.js';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import { activateMission, triggerOptions } from './SpaceAgencyCardTestUtils.js';

describe('NeutralBuoyancyTraining', () => {
  it('full mission triggers on launch and on orbit-or-land actions', () => {
    const game = buildTestGame({ seed: 'sa-23-completion' });
    const { player } = activateMission(game, 'p1', 'SA.23');

    game.missionTracker.recordEvent({ type: EMissionEventType.PROBE_LAUNCHED });
    expect(triggerOptions(game, player.id)).toContain('complete-SA.23-0');

    game.missionTracker.recordEvent({
      type: EMissionEventType.PROBE_ORBITED,
      planet: EPlanet.MARS,
    });
    expect(triggerOptions(game, player.id)).toContain('complete-SA.23-1');
  });
});
