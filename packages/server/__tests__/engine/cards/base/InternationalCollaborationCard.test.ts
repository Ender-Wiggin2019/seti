import { ETechBonusType, ETechId } from '@seti/common/types/tech';
import { InternationalCollaborationCard } from '@/engine/cards/base/InternationalCollaborationCard.js';
import { createTech } from '@/engine/tech/TechRegistry.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('InternationalCollaborationCard (card 81)', () => {
  it('loads expected metadata without exposing desc custom tokens', () => {
    const card = new InternationalCollaborationCard();

    expect(card.id).toBe('81');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.researchTech).toBeUndefined();
  });

  it('takes a tech another player has without rotation or printed tile bonus', () => {
    const game = buildTestGame({ seed: 'international-collaboration' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    const solarSystem = requireSolarSystem(game);
    game.techBoard?.take(other.id, ETechId.SCAN_POP_SIGNAL);
    other.gainTech(ETechId.SCAN_POP_SIGNAL);
    const stack = game.techBoard?.getStack(ETechId.SCAN_POP_SIGNAL);
    if (!stack) throw new Error('missing tech stack');
    stack.tiles[0] = {
      tech: createTech(ETechId.SCAN_POP_SIGNAL),
      bonus: { type: ETechBonusType.ENERGY },
      bonuses: [{ type: ETechBonusType.ENERGY }],
    };
    const energyBefore = player.resources.energy;
    const scoreBefore = player.score;
    const card = new InternationalCollaborationCard();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(solarSystem.rotationCounter).toBe(0);
    expect(player.techs).toContain(ETechId.SCAN_POP_SIGNAL);
    expect(player.resources.energy).toBe(energyBefore);
    expect(player.score).toBe(scoreBefore);
  });
});
