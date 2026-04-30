import { ETrace } from '@seti/common/types/element';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { HayabusaCard } from '@/engine/cards/base/HayabusaCard.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('HayabusaCard (card 18)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new HayabusaCard();

    expect(card.id).toBe('18');
    expect(card.behavior.custom).toBeUndefined();
    expect(card.behavior.markTrace).toBeUndefined();
  });

  it('marks a yellow trace when the player has a probe on asteroids', () => {
    const game = buildTestGame({ seed: 'hayabusa' });
    const player = getPlayer(game, 'p1');
    const solarSystem = requireSolarSystem(game);
    const asteroidSpace = solarSystem.spaces.find((space) =>
      space.elements.some(
        (element) => element.type === ESolarSystemElementType.ASTEROID,
      ),
    );
    if (!asteroidSpace) throw new Error('missing asteroid space');
    solarSystem.placeProbe(player.id, asteroidSpace.id);
    player.probesInSpace = 1;
    const card = new HayabusaCard();

    card.play({ player, game });
    const input = game.deferredActions.drain(game);
    input?.process({
      type: EPlayerInputType.OPTION,
      optionId: 'alien-0-discovery-yellow-trace',
    });

    expect(game.alienState.getPlayerTraceCount(player, ETrace.YELLOW)).toBe(1);
  });
});
