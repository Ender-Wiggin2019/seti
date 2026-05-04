import {
  EFreeAction,
  EMainAction,
  EPhase,
} from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { isMascamitesAlienBoard } from '@/engine/alien/AlienBoard.js';
import {
  applyDeliverSampleScenario,
  applySpendSignalTokenScenario,
} from '@/testing/behaviorFlowScenario.js';
import { buildTestGame } from '../helpers/TestGameBuilder.js';

describe('formal lobby scenario presets', () => {
  it('prepares a real scan pool where spend signal token can be clicked', () => {
    const game = buildTestGame({
      autoResolveSetupTucks: false,
      seed: 'scenario-spend-signal-token',
    });
    const player = game.activePlayer;

    applySpendSignalTokenScenario(game);

    expect(game.phase).toBe(EPhase.AWAIT_MAIN_ACTION);
    expect(player.waitingFor).toBeUndefined();
    expect(player.resources.signalTokens).toBe(1);

    game.processMainAction(player.id, { type: EMainAction.SCAN });
    expect(game.phase).toBe(EPhase.IN_RESOLUTION);
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.OPTION);

    game.processFreeAction(player.id, { type: EFreeAction.SPEND_SIGNAL_TOKEN });
    expect(player.resources.signalTokens).toBe(0);
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);
  });

  it('prepares a real Mascamites sample delivery free action', () => {
    const game = buildTestGame({
      autoResolveSetupTucks: false,
      options: {
        alienModulesEnabled: [false, false, false, true, true],
      },
      seed: 'scenario-deliver-sample',
    });
    const player = game.activePlayer;

    applyDeliverSampleScenario(game);

    const board = game.alienState.getBoardByType(4);
    expect(isMascamitesAlienBoard(board)).toBe(true);
    if (!isMascamitesAlienBoard(board)) {
      throw new Error('expected Mascamites board');
    }
    expect(board.capsules).toHaveLength(1);
    expect(
      player.playedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toContain('ET.1');

    game.processFreeAction(player.id, {
      type: EFreeAction.DELIVER_SAMPLE,
      capsuleId: board.capsules[0].capsuleId,
      cardId: 'ET.1',
    });

    expect(board.capsules).toHaveLength(0);
    expect(board.deliveredSamples).toHaveLength(1);
    expect(
      player.completedMissions.map((card) =>
        typeof card === 'string' ? card : card.id,
      ),
    ).toContain('ET.1');
    expect(
      board.slots.some((slot) =>
        slot.slotId.includes('mascamites-sample-blue'),
      ),
    ).toBe(true);
  });
});
