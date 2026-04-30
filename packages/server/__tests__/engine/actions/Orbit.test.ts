import { PLANET_MISSION_CONFIG } from '@seti/common/constant/boardLayout';
import { EMainAction, EPlanet } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { OrbitAction } from '@/engine/actions/Orbit.js';
import { Game } from '@/engine/Game.js';
import {
  resolveAllInputsDefault,
  resolveSetupTucks,
  skipSetupTucks,
} from '../../helpers/TestGameBuilder.js';

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
    resolveSetupTucks(game);
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
    skipSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.MARS, 1);
    player.probesInSpace = 1;
    const handBefore = player.hand.length;

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
    expect(player.resources.data).toBe(1);
    expect(player.hand).toHaveLength(handBefore + 1);
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

    resolveAllInputsDefault(game, player);
    expect(player.tuckedIncomeCards).toHaveLength(1);
  });

  it('only grants +3 VP for the first orbiter on a planet', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-first-bonus-once',
    );
    resolveSetupTucks(game);
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
    resolveAllInputsDefault(game, p1);
    game.processEndTurn(p1.id);

    game.processMainAction(p2.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });
    resolveAllInputsDefault(game, p2);
    game.processEndTurn(p2.id);

    expect(p1.score).toBe(10);
    expect(p2.score).toBe(8);
    expect(
      game.planetaryBoard?.planets.get(EPlanet.VENUS)?.orbitSlots,
    ).toHaveLength(2);
  });

  it('rejects orbit when no own probe is on selected planet', () => {
    const game = Game.create(TEST_PLAYERS, { playerCount: 2 }, 'orbit-invalid');
    resolveSetupTucks(game);
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
    resolveSetupTucks(game);
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

  it('2.2.3 applies configured orbit rewards per planet', () => {
    const cases: Array<{
      planet: EPlanet;
      scoreDelta: number;
      dataDelta: number;
      cardDraws: number;
    }> = [
      { planet: EPlanet.MERCURY, scoreDelta: 5, dataDelta: 2, cardDraws: 1 },
      { planet: EPlanet.VENUS, scoreDelta: 9, dataDelta: 0, cardDraws: 0 },
      { planet: EPlanet.MARS, scoreDelta: 3, dataDelta: 1, cardDraws: 1 },
      { planet: EPlanet.JUPITER, scoreDelta: 9, dataDelta: 0, cardDraws: 0 },
      { planet: EPlanet.SATURN, scoreDelta: 9, dataDelta: 0, cardDraws: 0 },
      { planet: EPlanet.URANUS, scoreDelta: 9, dataDelta: 0, cardDraws: 0 },
      { planet: EPlanet.NEPTUNE, scoreDelta: 9, dataDelta: 0, cardDraws: 0 },
    ];

    for (const { planet, scoreDelta, dataDelta, cardDraws } of cases) {
      const game = Game.create(
        TEST_PLAYERS,
        { playerCount: 2 },
        `orbit-2-2-3-${planet}`,
      );
      resolveSetupTucks(game);
      const player = game.players[0];
      placeProbeOnPlanet(game, player.id, planet, 1);
      player.probesInSpace = 1;

      const creditsBefore = player.resources.credits;
      const energyBefore = player.resources.energy;
      const publicityBefore = player.resources.publicity;
      const dataBefore = player.resources.data;
      const scoreBefore = player.score;
      const handBefore = player.hand.length;
      const tuckedCardsBefore = player.tuckedIncomeCards.length;

      game.processMainAction(player.id, {
        type: EMainAction.ORBIT,
        payload: { planet },
      });

      // Action cost (1 credit + 1 energy) — same for every planet.
      expect(player.resources.credits).toBe(creditsBefore - 1);
      expect(player.resources.energy).toBe(energyBefore - 1);
      expect(player.score).toBe(scoreBefore + scoreDelta);
      expect(player.resources.publicity).toBe(publicityBefore);
      expect(player.resources.data).toBe(dataBefore + dataDelta);
      expect(player.hand).toHaveLength(handBefore + cardDraws);
      expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

      resolveAllInputsDefault(game, player);
      expect(player.tuckedIncomeCards).toHaveLength(tuckedCardsBefore + 1);
      expect(game.planetaryBoard?.planets.get(planet)?.orbitSlots).toEqual([
        { playerId: player.id },
      ]);
      expect(game.planetaryBoard?.planets.get(planet)?.firstOrbitClaimed).toBe(
        true,
      );
    }
  });

  it('2.2.4 orbit tuck reward prompts a selected hand card to become income', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-2-2-4-income-track',
    );
    resolveSetupTucks(game);
    const player = game.players[0];
    placeProbeOnPlanet(game, player.id, EPlanet.VENUS, 1);
    player.probesInSpace = 1;

    const tuckedCardsBefore = player.tuckedIncomeCards.length;
    const handBefore = player.hand.length;

    game.processMainAction(player.id, {
      type: EMainAction.ORBIT,
      payload: { planet: EPlanet.VENUS },
    });

    expect(player.score).toBe(
      1 +
        PLANET_MISSION_CONFIG[EPlanet.VENUS].orbit.rewards[0].amount +
        PLANET_MISSION_CONFIG[EPlanet.VENUS].orbit.firstRewards[0].amount,
    );
    expect(player.waitingFor?.toModel().type).toBe(EPlayerInputType.CARD);

    resolveAllInputsDefault(game, player);

    expect(player.tuckedIncomeCards).toHaveLength(tuckedCardsBefore + 1);
    expect(player.hand.length).toBeLessThanOrEqual(handBefore);
  });

  it('returns false when credits or energy are insufficient even with a valid planet probe', () => {
    const game = Game.create(
      TEST_PLAYERS,
      { playerCount: 2 },
      'orbit-insufficient-resources',
    );
    resolveSetupTucks(game);
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
