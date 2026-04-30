import {
  EPlayerInputType,
  type ISelectCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { AbandonedMission } from '@/engine/cards/spaceAgency/AbandonedMissionCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('AbandonedMission', () => {
  it('returns an unfinished mission to hand, clears its mission state, and gains data', () => {
    const game = buildTestGame({ seed: 'sa-29' });
    const player = getPlayer(game, 'p1');
    player.playedMissions = ['106'];
    game.missionTracker.registerMissionFromCard('106', player.id);
    const missionState = game.missionTracker.getMissionState(player.id, '106');
    if (!missionState) throw new Error('mission was not registered');
    missionState.branchStates[0].completed = true;
    const beforeData = player.resources.data;
    const card = new AbandonedMission();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectCardInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_29');
    expect(model?.type).toBe(EPlayerInputType.CARD);
    expect(model?.cards.map((item) => item.id)).toEqual(['106']);

    input?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['106'],
    });

    expect(player.playedMissions).toEqual([]);
    expect(player.hand).toContain('106');
    expect(
      game.missionTracker.getMissionState(player.id, '106'),
    ).toBeUndefined();
    expect(player.resources.data).toBe(beforeData + 2);
  });
});
