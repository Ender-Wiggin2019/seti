import { describe, expect, it } from 'vitest';
import {
  canLandOnMoon,
  canLandOnPlanet,
  canOrbitPlanet,
  getFirstLandBonusRemaining,
  getLandingCost,
  isFirstOrbitAvailable,
} from '@/rules/planet';
import { EResource } from '@/types/element';
import { EPhase } from '@/types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetState,
  IPublicPlayerState,
} from '@/types/protocol/gameState';

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
    tracesByAlien: {},
    computer: {
      columns: [
        {
          topFilled: false,
          topReward: null,
          techId: null,
          hasBottomSlot: false,
          bottomFilled: false,
          bottomReward: null,
          techSlotAvailable: true,
        },
      ],
    },
    dataPoolCount: 0,
    dataPoolMax: 0,
    pieces: { probes: 0, orbiters: 0, landers: 0, signalMarkers: 0 },
    techs: [],
    passed: false,
    movementPoints: 0,
    dataStashCount: 0,
    probesInSpace: 0,
    probeSpaceLimit: 1,
    completedMissionCount: 0,
    endGameCardCount: 0,
    creditIncome: 4,
    energyIncome: 3,
    cardIncome: 0,
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
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
  };
}

describe('planet rules', () => {
  it('getLandingCost returns 3 by default, 2 with any orbiter', () => {
    const defaultCost = getLandingCost(createPlanetState(), 'player-a');
    const reducedCost = getLandingCost(
      createPlanetState({ orbitSlots: [{ playerId: 'player-b' }] }),
      'player-a',
    );
    expect(defaultCost).toBe(3);
    expect(reducedCost).toBe(2);
  });

  it('canOrbitPlanet requires player probe on planet space', () => {
    const player = createPlayerState();
    const planet = createPlanetState({ planetSpaceId: 'planet-space-1' });
    const gameState = createGameState(player.playerId, 'planet-space-1');
    expect(canOrbitPlanet(planet, player, gameState)).toBe(true);

    const noProbeState = createGameState(player.playerId, 'another-space');
    expect(canOrbitPlanet(planet, player, noProbeState)).toBe(false);
  });

  it('canLandOnPlanet checks probe presence and energy against landing cost', () => {
    const player = createPlayerState();
    const planet = createPlanetState({
      orbitSlots: [{ playerId: 'player-b' }],
      planetSpaceId: 'planet-space-1',
    });
    const gameState = createGameState(player.playerId, 'planet-space-1');
    expect(canLandOnPlanet(planet, player, gameState)).toBe(true);

    const lowEnergy = createPlayerState({
      resources: {
        [EResource.CREDIT]: 0,
        [EResource.ENERGY]: 1,
        [EResource.DATA]: 0,
        [EResource.PUBLICITY]: 0,
      },
    });
    expect(canLandOnPlanet(planet, lowEnergy, gameState)).toBe(false);
  });

  it('canLandOnMoon requires unlocked moon and empty occupancy', () => {
    expect(canLandOnMoon(createPlanetState())).toBe(false);
    expect(canLandOnMoon(createPlanetState({ moonUnlocked: true }))).toBe(true);
    expect(
      canLandOnMoon(
        createPlanetState({
          moonUnlocked: true,
          moonOccupant: { playerId: 'player-a' },
        }),
      ),
    ).toBe(false);
  });

  it('first orbit and first land bonus helpers are computed correctly', () => {
    expect(isFirstOrbitAvailable(createPlanetState())).toBe(true);
    expect(
      isFirstOrbitAvailable(createPlanetState({ firstOrbitClaimed: true })),
    ).toBe(false);
    expect(
      getFirstLandBonusRemaining(
        createPlanetState({ firstLandDataBonusTaken: [true, false, false] }),
      ),
    ).toBe(2);
  });
});
