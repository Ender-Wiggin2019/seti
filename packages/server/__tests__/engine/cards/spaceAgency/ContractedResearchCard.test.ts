import {
  EPlayerInputType,
  type ISelectOptionInputModel,
} from '@seti/common/types/protocol/playerInput';
import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { ContractedResearch } from '@/engine/cards/spaceAgency/ContractedResearchCard.js';
import { ResearchTechEffect } from '@/engine/effects/tech/ResearchTechEffect.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('ContractedResearch', () => {
  it('sets publicity to zero and offers only tech already researched by another player', () => {
    const game = buildTestGame({ seed: 'sa-18' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    const techId = ETechId.SCAN_POP_SIGNAL;
    const otherTechId = ETechId.PROBE_DOUBLE_PROBE;
    ResearchTechEffect.acquireTech(other, game, techId);
    ResearchTechEffect.acquireTech(other, game, otherTechId);
    const stack = game.techBoard?.getStack(techId);
    if (!stack?.tiles[0]) throw new Error('missing researched tech stack');
    stack.tiles[0].bonus = { type: ETechBonusType.ENERGY };
    player.resources.setPublicity(7);
    const card = new ContractedResearch();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectOptionInputModel | undefined;

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_18');
    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_18_2');
    expect(player.resources.publicity).toBe(0);
    expect(model?.type).toBe(EPlayerInputType.OPTION);
    expect(model?.options.map((option) => option.id)).toContain(techId);
    expect(model?.options.map((option) => option.id)).not.toContain(
      ETechId.PROBE_ASTEROID,
    );

    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: techId,
    });

    expect(player.techs).toContain(techId);
  });
});
