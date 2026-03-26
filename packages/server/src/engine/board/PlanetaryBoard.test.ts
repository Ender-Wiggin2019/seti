import { EPlanet } from '@seti/common/types/protocol/enums';
import { PlanetaryBoard } from './PlanetaryBoard.js';

describe('PlanetaryBoard', () => {
  it('orbit places orbiter and grants first-orbit +3 VP once', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, 'player-a', 1);
    board.setProbeCount(EPlanet.VENUS, 'player-b', 1);

    const firstOrbit = board.orbit(EPlanet.VENUS, 'player-a');
    const secondOrbit = board.orbit(EPlanet.VENUS, 'player-b');

    expect(firstOrbit.vpGained).toBe(3);
    expect(secondOrbit.vpGained).toBe(0);
    expect(board.planets.get(EPlanet.VENUS)?.orbitSlots).toEqual([
      { playerId: 'player-a' },
      { playerId: 'player-b' },
    ]);
    expect(board.planets.get(EPlanet.VENUS)?.firstOrbitClaimed).toBe(true);
  });

  it('land places lander and returns center reward + first data bonus', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.JUPITER, 'player-a', 1);

    const result = board.land(EPlanet.JUPITER, 'player-a');

    expect(result.centerReward.vpGained).toBeGreaterThan(0);
    expect(result.centerReward.lifeTraceGained).toBe(1);
    expect(result.firstLandDataGained).toBe(1);
    expect(board.planets.get(EPlanet.JUPITER)?.landingSlots).toEqual([
      { playerId: 'player-a' },
    ]);
  });

  it('landing cost drops from 3 to 2 when planet has any orbiter', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.SATURN, 'player-a', 1);
    board.setProbeCount(EPlanet.SATURN, 'player-b', 1);

    expect(board.getLandingCost(EPlanet.SATURN, 'player-a')).toBe(3);
    board.orbit(EPlanet.SATURN, 'player-b');
    expect(board.getLandingCost(EPlanet.SATURN, 'player-a')).toBe(2);
  });

  it('mars has two first-land data bonuses', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.MARS, 'player-a', 1);
    board.setProbeCount(EPlanet.MARS, 'player-b', 1);
    board.setProbeCount(EPlanet.MARS, 'player-c', 1);

    const first = board.land(EPlanet.MARS, 'player-a');
    const second = board.land(EPlanet.MARS, 'player-b');
    const third = board.land(EPlanet.MARS, 'player-c');

    expect(first.firstLandDataGained).toBe(1);
    expect(second.firstLandDataGained).toBe(1);
    expect(third.firstLandDataGained).toBe(0);
  });

  it('cannot land on moon when moon is locked', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.MARS, 'player-a', 1);

    expect(
      board.canLand(EPlanet.MARS, 'player-a', { isMoon: true, energy: 3 }),
    ).toBe(false);
  });

  it('moon unlock enables landing and enforces single occupancy', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.MARS, 'player-a', 1);
    board.setProbeCount(EPlanet.MARS, 'player-b', 1);
    board.unlockMoon(EPlanet.MARS);

    expect(
      board.canLand(EPlanet.MARS, 'player-a', { isMoon: true, energy: 3 }),
    ).toBe(true);
    const firstMoonLanding = board.land(EPlanet.MARS, 'player-a', {
      isMoon: true,
    });
    expect(firstMoonLanding.isMoon).toBe(true);
    expect(board.planets.get(EPlanet.MARS)?.moonOccupant?.playerId).toBe(
      'player-a',
    );

    expect(
      board.canLand(EPlanet.MARS, 'player-b', { isMoon: true, energy: 3 }),
    ).toBe(false);
    expect(() =>
      board.land(EPlanet.MARS, 'player-b', { isMoon: true }),
    ).toThrow();
  });

  it('supports multi-player interleaving of orbit and land actions', () => {
    const board = new PlanetaryBoard();
    board.setProbeCount(EPlanet.VENUS, 'player-a', 1);
    board.setProbeCount(EPlanet.VENUS, 'player-b', 1);

    expect(board.canOrbit(EPlanet.VENUS, 'player-a')).toBe(true);
    expect(board.canLand(EPlanet.VENUS, 'player-a', { energy: 3 })).toBe(true);

    board.orbit(EPlanet.VENUS, 'player-a');
    const playerBLanding = board.land(EPlanet.VENUS, 'player-b');

    expect(playerBLanding.landingCost).toBe(2);
    expect(board.planets.get(EPlanet.VENUS)?.orbitSlots).toHaveLength(1);
    expect(board.planets.get(EPlanet.VENUS)?.landingSlots).toHaveLength(1);
    expect(board.planets.get(EPlanet.VENUS)?.landingSlots[0]?.playerId).toBe(
      'player-b',
    );
  });
});
