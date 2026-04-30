import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { IterativeEngineering } from '@/engine/cards/spaceAgency/IterativeEngineeringCard.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('IterativeEngineering', () => {
  it('researches a tech and repeats only the printed tile bonus', () => {
    const game = buildTestGame({ seed: 'sa-15' });
    const player = getPlayer(game, 'p1');
    const stack = game.techBoard?.getStack(ETechId.PROBE_ASTEROID);
    if (!stack?.tiles[0]) throw new Error('missing tech stack');
    stack.tiles[0].bonus = { type: ETechBonusType.ENERGY };
    const beforeEnergy = player.resources.energy;
    const card = new IterativeEngineering();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_15');
    expect(card.behavior.researchTech).toBeUndefined();
    expect(model?.type).toBe(EPlayerInputType.OPTION);

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_ASTEROID,
    });

    expect(player.techs).toContain(ETechId.PROBE_ASTEROID);
    expect(player.resources.energy).toBe(beforeEnergy + 2);
  });
});
