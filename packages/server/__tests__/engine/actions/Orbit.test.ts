import { PLANETARY_PLANETS } from '@seti/common/constant/boardLayout';
import { EResource } from '@seti/common/types/element';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { OrbitAction } from '@/engine/actions/Orbit.js';
import { PLANET_ORBIT_INCOME } from '@/engine/board/PlanetaryBoard.js';
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
    game.processEndTurn(player.id);
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
    const cardIncomeBefore = player.income.tuckedCardIncome[EResource.CARD];

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
    expect(player.income.tuckedCardIncome[EResource.CARD]).toBe(
      cardIncomeBefore + 1,
    );
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
    game.processEndTurn(p1.id);

    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });
    game.processEndTurn(p2.id);

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

  it('2.2.3 first orbit grants +3 VP and a distinct orbit income bonus per planet', () => {
    const nonEarthPlanets: EPlanet[] = [
      EPlanet.MERCURY,
      EPlanet.VENUS,
      EPlanet.MARS,
      EPlanet.JUPITER,
      EPlanet.SATURN,
      EPlanet.URANUS,
      EPlanet.NEPTUNE,
    ];

    for (const planet of nonEarthPlanets) {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        `orbit-2-2-3-${planet}`,
      );
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, planet, 1);
      player.probesInSpace = 1;

      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;
      const publicityBefore = player.resources.publicity;
      const dataBefore = player.resources.data;
      const scoreBefore = player.score;
      const handBefore = [...player.hand];
      const tuckedCardsBefore = [...player.tuckedIncomeCards];
      const incomeResource =
        PLANET_ORBIT_INCOME[planet as (typeof PLANETARY_PLANETS)[number]];
      const incomeBefore = player.income.tuckedCardIncome[incomeResource];

      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet },
      });

      // Action cost (1 credit + 1 energy) — same for every planet.
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore - 1);
      expect(player.score).toBe(scoreBefore + 3);
      expect(player.resources.publicity).toBe(publicityBefore);
      expect(player.resources.data).toBe(dataBefore);
      expect(player.hand).toEqual(handBefore);
      expect(player.tuckedIncomeCards).toEqual(tuckedCardsBefore);
      expect(player.income.tuckedCardIncome[incomeResource]).toBe(
        incomeBefore + 1,
      );
      expect(game.planetaryBoard?.planets.get(planet)?.orbitSlots).toEqual([
        { playerId: player.id },
      ]);
      expect(game.planetaryBoard?.planets.get(planet)?.firstOrbitClaimed).toBe(
        true,
      );
    }
  });

  it('2.2.4 orbit increases tucked income (round payout) without drawing or tucking hand cards', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-2-2-4-income-track',
    );
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
    player.probesInSpace = 1;

    const tuckedCardsBefore = [...player.tuckedIncomeCards];
    const handBefore = [...player.hand];
    const energyIncomeBefore = player.income.tuckedCardIncome[EResource.ENERGY];

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });

    expect(player.tuckedIncomeCards).toEqual(tuckedCardsBefore);
    expect(player.hand).toEqual(handBefore);
    expect(player.income.tuckedCardIncome[EResource.ENERGY]).toBe(
      energyIncomeBefore + 1,
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
