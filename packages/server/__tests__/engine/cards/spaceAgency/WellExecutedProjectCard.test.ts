import {
  EPlayerInputType,
  type ISelectCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { WellExecutedProject } from '@/engine/cards/spaceAgency/WellExecutedProjectCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('WellExecutedProject', () => {
  it('discards a non-alien card and gains its free-action corner three times', () => {
    const game = buildTestGame({ seed: 'sa-20' });
    const player = getPlayer(game, 'p1');
    player.hand = ['SA.10', 'ET.11'];
    const initialMove = player.getMoveStash();
    const card = new WellExecutedProject();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectCardInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_20');
    expect(model?.type).toBe(EPlayerInputType.CARD);
    expect(model?.cards.map((item) => item.id)).toEqual(['SA.10']);

    input?.process({
      type: EPlayerInputType.CARD,
      cardIds: ['SA.10'],
    });

    expect(player.hand).toEqual(['ET.11']);
    expect(player.getMoveStash()).toBe(initialMove + 3);
  });
});
