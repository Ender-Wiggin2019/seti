import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ETechId } from '@seti/common/types/tech';
import { EuclidTelescopeConstructionCard } from '@/engine/cards/base/EuclidTelescopeConstructionCard.js';
import { EServerCardKind } from '@/engine/cards/ICard.js';
import { createTech } from '@/engine/tech/TechRegistry.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('EuclidTelescopeConstructionCard (card 126)', () => {
  it('loads expected metadata without exposing OR custom token', () => {
    const card = new EuclidTelescopeConstructionCard();

    expect(card.id).toBe('126');
    expect(card.kind).toBe(EServerCardKind.END_GAME);
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.rotateSolarSystem).toBeUndefined();
    expect(card.behavior.researchTech).toBeUndefined();
  });

  it('chooses either probe or scan tech and rotates only once for the chosen branch', () => {
    const game = buildTestGame({ seed: 'euclid-telescope-construction' });
    const player = getPlayer(game, 'p1');
    const solarSystem = requireSolarSystem(game);
    const stack = game.techBoard?.getStack(ETechId.PROBE_DOUBLE_PROBE);
    if (!stack) throw new Error('missing tech stack');
    stack.firstTakeBonusAvailable = false;
    stack.tiles[0] = {
      tech: createTech(ETechId.PROBE_DOUBLE_PROBE),
      bonuses: [],
    };
    const card = new EuclidTelescopeConstructionCard();

    card.play({ player, game });
    const branchInput = game.deferredActions.drain(game);
    const techInput = branchInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'research-probe-tech',
    });
    techInput?.process({
      type: EPlayerInputType.OPTION,
      optionId: ETechId.PROBE_DOUBLE_PROBE,
    });

    expect(solarSystem.rotationCounter).toBe(1);
    expect(player.techs).toContain(ETechId.PROBE_DOUBLE_PROBE);
  });
});
