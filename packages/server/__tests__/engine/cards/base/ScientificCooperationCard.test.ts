import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { ScientificCooperationCard } from '@/engine/cards/base/ScientificCooperationCard.js';
import { createTech } from '@/engine/tech/TechRegistry.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('ScientificCooperationCard (card 72)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new ScientificCooperationCard();

    expect(card.id).toBe('72');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.rotateSolarSystem).toBeUndefined();
    expect(card.behavior.researchTech).toBeUndefined();
  });

  it('gains 2 publicity after taking a tech another player already has', () => {
    const game = buildTestGame({ seed: 'scientific-cooperation' });
    const player = getPlayer(game, 'p1');
    const other = getPlayer(game, 'p2');
    const solarSystem = requireSolarSystem(game);
    game.techBoard?.take(other.id, ETechId.PROBE_DOUBLE_PROBE);
    other.gainTech(ETechId.PROBE_DOUBLE_PROBE);
    const stack = game.techBoard?.getStack(ETechId.PROBE_DOUBLE_PROBE);
    if (!stack) throw new Error('missing tech stack');
    stack.tiles[0] = {
      tech: createTech(ETechId.PROBE_DOUBLE_PROBE),
      bonuses: [],
    };
    const publicityBefore = player.resources.publicity;
    const card = new ScientificCooperationCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_DOUBLE_PROBE,
    });

    expect(solarSystem.rotationCounter).toBe(1);
    expect(player.techs).toContain(ETechId.PROBE_DOUBLE_PROBE);
    expect(player.resources.publicity).toBe(publicityBefore + 2);
  });
});
