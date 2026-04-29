import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { FocusedResearchCard } from '@/engine/cards/base/FocusedResearchCard.js';
import { createTech } from '@/engine/tech/TechRegistry.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('FocusedResearchCard (card 71)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new FocusedResearchCard();

    expect(card.id).toBe('71');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.rotateSolarSystem).toBeUndefined();
    expect(card.behavior.researchTech).toBeUndefined();
  });

  it('rotates, researches a tech, and scores 2 VP for each tech of that type', () => {
    const game = buildTestGame({ seed: 'focused-research' });
    const player = getPlayer(game, 'p1');
    const solarSystem = requireSolarSystem(game);
    const stack = game.techBoard?.getStack(ETechId.SCAN_EARTH_LOOK);
    if (!stack) throw new Error('missing tech stack');
    stack.firstTakeBonusAvailable = false;
    stack.tiles[0] = {
      tech: createTech(ETechId.SCAN_EARTH_LOOK),
      bonuses: [],
    };
    const scoreBefore = player.score;
    const card = new FocusedResearchCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.SCAN_EARTH_LOOK,
    });

    expect(solarSystem.rotationCounter).toBe(1);
    expect(player.techs).toContain(ETechId.SCAN_EARTH_LOOK);
    expect(player.score).toBe(scoreBefore + 2);
  });
});
