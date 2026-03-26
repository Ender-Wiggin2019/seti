import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canLandOnMoon,
  canLandOnPlanet,
  canOrbitPlanet,
  getFirstLandBonusRemaining,
  getLandingCost,
  isFirstOrbitAvailable,
} from '@seti/common/rules/planet';
import { EResource } from '@seti/common/types/element';
import { EPhase } from '@seti/common/types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetState,
  IPublicPlayerState,
} from '@seti/common/types/protocol/gameState';

function createPlayerState(
  overrides?: Partial<IPublicPlayerState>,
): IPublicPlayerState {
  return {
    playerId: 'player-a',
    playerName: 'Player A',
    seatIndex: 0,
    color: 'red',
    score: 0,
    handSize: 0,
    resources: {
      [EResource.CREDIT]: 0,
      [EResource.ENERGY]: 3,
      [EResource.DATA]: 0,
      [EResource.PUBLICITY]: 0,
    },
    traces: {},
    computer: { topSlots: [null], bottomSlots: [null] },
    dataPoolCount: 0,
    dataPoolMax: 0,
    pieces: { probes: 0, orbiters: 0, landers: 0, signalMarkers: 0 },
    techs: [],
    passed: false,
    ...overrides,
  };
}

function createPlanetState(
  overrides?: Partial<IPublicPlanetState>,
): IPublicPlanetState {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: [false],
    moonOccupant: null,
    moonUnlocked: false,
    planetSpaceId: 'planet-space-1',
    ...overrides,
  };
}

function createGameState(playerId: string, spaceId: string): IPublicGameState {
  return {
    gameId: 'game-1',
    round: 1,
    phase: EPhase.AWAIT_MAIN_ACTION,
    currentPlayerId: playerId,
    startPlayerId: playerId,
    players: [],
    solarSystem: {
      spaces: [spaceId],
      adjacency: {},
      probes: [{ playerId, spaceId }],
      discs: [],
    },
    sectors: [],
    planetaryBoard: { planets: {} },
    techBoard: { stacks: [] },
    cardRow: [],
    aliens: [],
    recentEvents: [],
  };
}

describe('planet rules', () => {
  it('getLandingCost returns 3 by default, 2 with any orbiter', () => {
    const defaultCost = getLandingCost(createPlanetState(), 'player-a');
    const reducedCost = getLandingCost(
      createPlanetState({ orbitSlots: [{ playerId: 'player-b' }] }),
      'player-a',
    );
    assert.equal(defaultCost, 3);
    assert.equal(reducedCost, 2);
  });

  it('canOrbitPlanet requires player probe on planet space', () => {
    const player = createPlayerState();
    const planet = createPlanetState({ planetSpaceId: 'planet-space-1' });
    const gameState = createGameState(player.playerId, 'planet-space-1');
    assert.equal(canOrbitPlanet(planet, player, gameState), true);

    const noProbeState = createGameState(player.playerId, 'another-space');
    assert.equal(canOrbitPlanet(planet, player, noProbeState), false);
  });

  it('canLandOnPlanet checks probe presence and energy against landing cost', () => {
    const player = createPlayerState();
    const planet = createPlanetState({
      orbitSlots: [{ playerId: 'player-b' }],
      planetSpaceId: 'planet-space-1',
    });
    const gameState = createGameState(player.playerId, 'planet-space-1');
    assert.equal(canLandOnPlanet(planet, player, gameState), true);

    const lowEnergy = createPlayerState({
      resources: {
        [EResource.CREDIT]: 0,
        [EResource.ENERGY]: 1,
        [EResource.DATA]: 0,
        [EResource.PUBLICITY]: 0,
      },
    });
    assert.equal(canLandOnPlanet(planet, lowEnergy, gameState), false);
  });

  it('canLandOnMoon requires unlocked moon and empty occupancy', () => {
    assert.equal(canLandOnMoon(createPlanetState()), false);
    assert.equal(
      canLandOnMoon(createPlanetState({ moonUnlocked: true })),
      true,
    );
    assert.equal(
      canLandOnMoon(
        createPlanetState({
          moonUnlocked: true,
          moonOccupant: { playerId: 'player-a' },
        }),
      ),
      false,
    );
  });

  it('first orbit and first land bonus helpers are computed correctly', () => {
    assert.equal(isFirstOrbitAvailable(createPlanetState()), true);
    assert.equal(
      isFirstOrbitAvailable(createPlanetState({ firstOrbitClaimed: true })),
      false,
    );
    assert.equal(
      getFirstLandBonusRemaining(
        createPlanetState({ firstLandDataBonusTaken: [true, false, false] }),
      ),
      2,
    );
  });
});
