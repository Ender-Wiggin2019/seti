import { EResource } from '@seti/common/types/element';
import {
  EPlayerInputType,
  type ISelectCardInputModel,
} from '@seti/common/types/protocol/playerInput';
import { Restructuring } from '@/engine/cards/spaceAgency/RestructuringCard.js';
import { EMissionType } from '@/engine/missions/IMission.js';
import { buildTestGame, getPlayer } from '../../../helpers/TestGameBuilder.js';

describe('Restructuring', () => {
  it('discards any number of hand cards and gains resources from their income corners', () => {
    const game = buildTestGame({ seed: 'sa-28' });
    const player = getPlayer(game, 'p1');
    player.hand = ['SA.5', 'SA.29', 'SA.6'];
    const beforeCredits = player.resources.credits;
    const beforeEnergy = player.resources.energy;
    const card = new Restructuring();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    const model = input?.toModel() as ISelectCardInputModel | undefined;
    const selected = (model?.cards ?? [])
      .filter(
        (item) => item.id.startsWith('SA.5') || item.id.startsWith('SA.29'),
      )
      .map((item) => item.id);

    expect(card.behavior.custom ?? []).not.toContain('sa.desc.card_28');
    expect(model?.type).toBe(EPlayerInputType.CARD);
    expect(model?.minSelections).toBe(0);

    input?.process({
      type: EPlayerInputType.CARD,
      cardIds: selected,
    });

    expect(player.hand).toEqual(['SA.6']);
    expect(player.resources.credits).toBe(beforeCredits + 1);
    expect(player.resources.energy).toBe(beforeEnergy + 1);
  });

  it('keeps the quick mission and checks for no credits, no energy, and no hand cards', () => {
    const game = buildTestGame({ seed: 'sa-28-mission' });
    const player = getPlayer(game, 'p1');
    const card = new Restructuring();
    const mission = card.getMissionDef();

    player.hand = [];
    player.resources.spend({
      credits: player.resources.credits,
      energy: player.resources.energy,
    });

    expect(card.kind).toBe('MISSION');
    expect(card.income).toBe(EResource.CREDIT);
    expect(mission.type).toBe(EMissionType.QUICK);
    expect(mission.branches[0]?.checkCondition?.(player, game)).toBe(true);

    player.resources.gain({ credits: 1 });
    expect(mission.branches[0]?.checkCondition?.(player, game)).toBe(false);
  });
});
