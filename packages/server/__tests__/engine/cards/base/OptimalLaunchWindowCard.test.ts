import { EPlanet } from '@seti/common/types/protocol/enums';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';
import { OptimalLaunchWindow } from '@/engine/cards/base/OptimalLaunchWindowCard.js';
import {
  buildTestGame,
  getPlayer,
  requireSolarSystem,
} from '../../../helpers/TestGameBuilder.js';

describe('OptimalLaunchWindow', () => {
  it('removes the handled custom token from behavior', () => {
    const card = new OptimalLaunchWindow();

    expect(card.id).toBe('133');
    expect(card.behavior.launchProbe).toBeUndefined();
    expect(card.behavior.custom).toBeUndefined();
  });

  it('launches a probe and gains movement for each other planet or comet in Earth sector', () => {
    const game = buildTestGame({ initialDiscAngles: [2, 3, 4] });
    const player = getPlayer(game, 'p1');
    const solarSystem = requireSolarSystem(game);
    const earthSectorIndex = solarSystem.getSectorIndexOfPlanet(EPlanet.EARTH);
    if (earthSectorIndex === null) throw new Error('missing Earth sector');
    const expectedMovement = solarSystem
      .getSpacesInSector(earthSectorIndex)
      .flatMap((space) => space.elements)
      .filter(
        (element) =>
          (element.type === ESolarSystemElementType.PLANET &&
            element.planet !== EPlanet.EARTH) ||
          element.type === ESolarSystemElementType.COMET,
      ).length;

    const card = new OptimalLaunchWindow();
    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.probesInSpace).toBe(1);
    expect(player.getMoveStash()).toBe(expectedMovement);
    expect(expectedMovement).toBe(2);
  });

  it('still gains movement when probe launch cannot be resolved', () => {
    const game = buildTestGame({ initialDiscAngles: [2, 3, 4] });
    const player = getPlayer(game, 'p1');
    const solarSystem = requireSolarSystem(game);
    const earthSectorIndex = solarSystem.getSectorIndexOfPlanet(EPlanet.EARTH);
    if (earthSectorIndex === null) throw new Error('missing Earth sector');
    const expectedMovement = solarSystem
      .getSpacesInSector(earthSectorIndex)
      .flatMap((space) => space.elements)
      .filter(
        (element) =>
          (element.type === ESolarSystemElementType.PLANET &&
            element.planet !== EPlanet.EARTH) ||
          element.type === ESolarSystemElementType.COMET,
      ).length;
    player.probesInSpace = player.probeSpaceLimit;

    const card = new OptimalLaunchWindow();
    expect(card.canPlay({ player, game })).toBe(true);

    card.play({ player, game });
    game.deferredActions.drain(game);

    expect(player.probesInSpace).toBe(player.probeSpaceLimit);
    expect(player.getMoveStash()).toBe(expectedMovement);
  });
});
