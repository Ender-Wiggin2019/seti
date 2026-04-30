import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { OsirisRexCard } from '@/engine/cards/base/OsirisRexCard.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('OsirisRexCard (card 17)', () => {
  it('loads expected metadata without exposing desc custom token', () => {
    const card = new OsirisRexCard();

    expect(card.id).toBe('17');
    expect(card.behavior.custom).toBeUndefined();
  });

  it('gains data for a chosen probe on and adjacent to asteroids', () => {
    const game = buildTestGame({ seed: 'osiris-rex' });
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
    const adjacentAsteroids = solarSystem
      .getAdjacentSpaces(asteroidSpace.id)
      .filter((space) =>
        space.elements.some(
          (element) => element.type === ESolarSystemElementType.ASTEROID,
        ),
      ).length;
    const card = new OsirisRexCard();

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.resources.data).toBe(2 + adjacentAsteroids);
  });
});
