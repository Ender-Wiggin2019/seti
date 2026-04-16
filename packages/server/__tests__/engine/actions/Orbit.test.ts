import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { OrbitAction } from '@/engine/actions/Orbit.js';
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

describe('Orbit action', () => {
  it('does not allow orbiting while the only probe is still on Earth', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-earth-boundary',
    );
    const player = game.players[0];

    game.processMainAction(player.id, { type: EMainAction.LAUNCH_PROBE });
    game.setActivePlayer(player.id);

    expect(OrbitAction.canExecute(player, game, EPlanet.EARTH)).toBe(false);
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.EARTH },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('spends resources, moves probe from space, and grants first orbit bonus', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-main-action',
    );
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.MARS },
    });

    expect(player.resources.credits).toBe(3);
    expect(player.resources.energy).toBe(2);
    expect(player.probesInSpace).toBe(0);
    expect(
      game.solarSystem?.getSpacesOnPlanet(EPlanet.MARS)[0]?.occupants,
    ).toHaveLength(0);
    expect(game.planetaryBoard?.planets.get(EPlanet.MARS)?.orbitSlots).toEqual([
      { playerId: player.id },
    ]);
    expect(player.score).toBe(4);
  });

  it('only grants +3 VP for the first orbiter on a planet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-first-bonus-once',
    );
    const p1 = game.players[0];
    const p2 = game.players[1];
    placeProbeOnPlanet(game, p1.id, EPlanet.VENUS, 1);
    placeProbeOnPlanet(game, p2.id, EPlanet.VENUS, 1);
    p1.probesInSpace = 1;
    p2.probesInSpace = 1;

    game.processMainAction(p1.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });

    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });

    expect(p1.score).toBe(4);
    expect(p2.score).toBe(2);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.VENUS)?.orbitSlots,
    ).toHaveLength(2);
  });

  it('rejects orbit when no own probe is on selected planet', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'orbit-invalid');
    const player = game.players[0];

    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.JUPITER },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.INVALID_ACTION,
      }),
    );
  });

  it('rejects orbit attempts from a non-active player even with a valid probe', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-not-your-turn',
    );
    const player = game.players[1];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(true);
    expect(() =>
      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet: EPlanet.MARS },
      }),
    ).toThrowError(
      expect.objectContaining({
        code: EErrorCode.NOT_YOUR_TURN,
      }),
    );
  });

  it('returns false when credits or energy are insufficient even with a valid planet probe', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-insufficient-resources',
    );
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;

    player.resources.spend({ credits: 4 });
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);

    player.resources.gain({ credits: 1 });
    player.resources.spend({ energy: 3 });
    expect(OrbitAction.canExecute(player, game, EPlanet.MARS)).toBe(false);
  });
});
