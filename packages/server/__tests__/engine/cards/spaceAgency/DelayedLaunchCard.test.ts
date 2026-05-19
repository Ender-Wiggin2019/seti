import { EMainAction } from '@seti/common/types/protocol/enums';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { buildTestGame } from '../../../helpers/TestGameBuilder.js';
import { activateMission } from './SpaceAgencyCardTestUtils.js';

describe('DelayedLaunch', () => {
  it('full mission triggers on pass even when the launch reward cannot add another probe', () => {
    const game = buildTestGame({ seed: 'sa-33-completion' });
    const { player } = activateMission(game, 'p1', 'SA.33');
    game.endOfRoundStacks.forEach((stack) => {
      stack.length = 0;
    });
    player.hand = [];
    player.probesInSpace = player.probeSpaceLimit;
    const probesBefore = player.probesInSpace;

    game.processMainAction(player.id, { type: EMainAction.PASS });
    const model = player.waitingFor?.toModel() as
      | ISelectOptionInputModel
      | undefined;
    expect(model?.options.map((option) => option.id)).toContain(
      'complete-SA.33-0',
    );
    player.waitingFor?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'complete-SA.33-0',
    });

    expect(
      player.completedMissions.some((card) =>
        typeof card === 'string' ? card === 'SA.33' : card.id === 'SA.33',
      ),
    ).toBe(true);
    expect(player.probesInSpace).toBe(probesBefore);
  });
});
