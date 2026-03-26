import { EResource, ESector } from '@seti/common/types/element';
import { EPhase } from '@seti/common/types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetaryBoard,
  IPublicPlayerState,
  IPublicSector,
  IPublicSolarSystem,
  IPublicTechBoard,
} from '@seti/common/types/protocol/gameState';

export function createMockPlayerState(
  overrides?: Partial<IPublicPlayerState>,
): IPublicPlayerState {
  return {
    playerId: 'player-1',
    playerName: 'Commander',
    seatIndex: 0,
    color: 'red',
    score: 0,
    handSize: 5,
    resources: {
      [EResource.CREDIT]: 10,
      [EResource.ENERGY]: 5,
      [EResource.DATA]: 0,
      [EResource.PUBLICITY]: 3,
    },
    traces: {},
    computer: { topSlots: [null, null, null], bottomSlots: [null, null, null] },
    dataPoolCount: 0,
    dataPoolMax: 6,
    pieces: { probes: 3, orbiters: 2, landers: 2, signalMarkers: 8 },
    techs: [],
    passed: false,
    ...overrides,
  };
}

export function createMockSolarSystem(): IPublicSolarSystem {
  return {
    spaces: Array.from({ length: 32 }, (_, i) => `space-${i}`),
    adjacency: {},
    probes: [],
    discs: [
      { discIndex: 0, angle: 0 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
      { discIndex: 3, angle: 0 },
    ],
  };
}

export function createMockSectors(): IPublicSector[] {
  const colors = [
    ESector.RED,
    ESector.YELLOW,
    ESector.BLUE,
    ESector.BLACK,
    ESector.RED,
    ESector.YELLOW,
    ESector.BLUE,
    ESector.BLACK,
  ];
  return colors.map((color, i) => ({
    sectorId: `sector-${i}`,
    color,
    dataSlots: [null, null, null],
    markers: [],
    completed: false,
  }));
}

export function createMockPlanetaryBoard(): IPublicPlanetaryBoard {
  return { planets: {} };
}

export function createMockTechBoard(): IPublicTechBoard {
  return { stacks: [] };
}

export function createMockGameState(
  overrides?: Partial<IPublicGameState>,
): IPublicGameState {
  return {
    gameId: 'game-test-1',
    round: 1,
    phase: EPhase.AWAIT_MAIN_ACTION,
    currentPlayerId: 'player-1',
    startPlayerId: 'player-1',
    players: [
      createMockPlayerState({ playerId: 'player-1', playerName: 'Commander' }),
      createMockPlayerState({
        playerId: 'player-2',
        playerName: 'Pilot',
        seatIndex: 1,
        color: 'blue',
      }),
    ],
    solarSystem: createMockSolarSystem(),
    sectors: createMockSectors(),
    planetaryBoard: createMockPlanetaryBoard(),
    techBoard: createMockTechBoard(),
    cardRow: [],
    aliens: [],
    recentEvents: [],
    ...overrides,
  };
}
