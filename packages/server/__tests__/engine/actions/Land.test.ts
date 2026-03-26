import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { ETechId } from '@seti/common/types/tech';
import { Game } from '@/engine/Game.js';

const TEST_PLAYERS = [
  { id: 'p1', name: 'Alice', color: 'red', seatIndex: 0 },
  { id: 'p2', name: 'Bob', color: 'blue', seatIndex: 1 },
] as const;

function placeProbeOnPlanet(
  game: Game,
  playerId: string,
  planet: EPlanet,
  count: number,
): void {
  const targetSpace = game.solarSystem?.getSpacesOnPlanet(planet)[0];
  if (!targetSpace || game.solarSystem === null) {
    throw new Error('Expected a planet space in solar system');
  }

  for (let index = 0; index < count; index += 1) {
    game.solarSystem.placeProbe(playerId, targetSpace.id);
  }
}

describe('Land action', () => {
  it('lands on a planet, spends energy, gains center VP and first data bonus', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-main-action',
    );
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS },
    });

    expect(player.resources.energy).toBe(0);
    expect(player.resources.data).toBe(1);
    expect(player.probesInSpace).toBe(0);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.landingSlots,
    ).toEqual([{ playerId: player.id }]);
    expect(player.score).toBe(5);
  });

  it('uses reduced landing cost when any orbiter is already present', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-reduced-cost',
    );
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.SATURN, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.SATURN, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.processMainAction(p1.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.SATURN },
    });
    game.processMainAction(p2.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.SATURN },
    });

    expect(p2.resources.energy).toBe(1);
  });

  it('enforces moon unlock and single occupancy through Land action', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-moon-rules',
    );
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.MARS, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.MARS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    expect(() =>
      game.processMainAction(p1.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.MARS, isMoon: true },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );

    game.planetaryBoard?.unlockMoon(EPlanet.MARS);
    game.processMainAction(p1.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(p1.id);
    expect(() =>
      game.processMainAction(p2.id, {
        type: EMainAction.LAND,
        payload: { planet: EPlanet.MARS, isMoon: true },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('applies rover discount tech to reduce landing energy cost by 1', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-probe-tech-2',
    );
    const player = game.players[0];
    player.techs.push(ETechId.PROBE_ROVER_DISCOUNT);
    placeProbeOnPlanet(game, player.id, EPlanet.MERCURY, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MERCURY },
    });

    expect(player.resources.energy).toBe(1);
  });

  it('allows landing on moon with probe moon tech even when moon is locked', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'land-probe-tech-3',
    );
    const player = game.players[0];
    player.techs.push(ETechId.PROBE_MOON);
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.LAND,
      payload: { planet: EPlanet.MARS, isMoon: true },
    });

    expect(
      game.planetaryBoard?.planets.get(EPlanet.MARS)?.moonOccupant?.playerId,
    ).toBe(player.id);
  });
});
