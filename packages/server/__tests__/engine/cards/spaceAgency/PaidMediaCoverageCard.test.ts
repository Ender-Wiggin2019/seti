import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { PaidMediaCoverage } from '@/engine/cards/spaceAgency/PaidMediaCoverageCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('PaidMediaCoverage', () => {
  it('spends selected credits for 2 VP and 2 publicity each', () => {
    const game = buildTestGame({ seed: 'sa-17' });
    const player = getPlayer(game, 'p1');
    player.resources.spend({ credits: player.resources.credits });
    player.resources.gain({ credits: 3 });
    player.publicity = 1;
    const initialScore = player.score;
    const card = new PaidMediaCoverage();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_17');
    expect(model?.type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'spend-2-credit',
    });

    expect(player.resources.credits).toBe(1);
    expect(player.score).toBe(initialScore + 4);
    expect(player.publicity).toBe(5);
  });
});
