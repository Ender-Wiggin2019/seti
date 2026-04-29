import { EResource } from '@seti/common/types/element';
import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { TrackingAndDataRelaySatellite } from '@/engine/cards/spaceAgency/TrackingAndDataRelaySatelliteCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('TrackingAndDataRelaySatellite', () => {
  it('gains the chosen free-action icon once per shown hand card', () => {
    const game = buildTestGame({ seed: 'sa-2' });
    const player = getPlayer(game, 'p1');
    player.hand = ['SA.1', 'SA.14', 'SA.38'];
    const initialData = player.resources.data;
    const card = new TrackingAndDataRelaySatellite();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_2');
    expect(model?.type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: EResource.DATA,
    });

    expect(player.resources.data).toBe(initialData + 2);
    expect(player.hand).toEqual(['SA.1', 'SA.14', 'SA.38']);
  });
});
