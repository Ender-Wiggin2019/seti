import {
  ALL_SECTOR_TILE_IDS,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import { EResource, ESector } from '@seti/common/types/element';
import { EPhase } from '@seti/common/types/protocol/enums';
import type {
  IPublicGameState,
  IPublicPlanetaryBoard,
  IPublicPlayerState,
  IPublicSector,
  IPublicSolarSystem,
  IPublicSolarSystemSpaceState,
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
    pendingSetupTucks: 0,
    organizationIds: [],
    resources: {
      [EResource.CREDIT]: 10,
      [EResource.ENERGY]: 5,
      [EResource.DATA]: 0,
      [EResource.PUBLICITY]: 3,
      [EResource.SIGNAL_TOKEN]: 0,
    },
    traces: {},
    tracesByAlien: {},
    computer: {
      columns: Array.from({ length: 6 }, () => ({
        topFilled: false,
        topReward: null,
        techId: null,
        hasBottomSlot: false,
        bottomFilled: false,
        bottomReward: null,
        techSlotAvailable: true,
      })),
    },
    dataPoolCount: 0,
    dataPoolMax: 6,
    pieces: { probes: 3, orbiters: 2, landers: 2, signalMarkers: 8 },
    techs: [],
    passed: false,
    movementPoints: 1,
    dataStashCount: 0,
    probesInSpace: 1,
    probeSpaceLimit: 1,
    completableMissionBranches: [],
    completedMissionCount: 0,
    endGameCardCount: 0,
    creditIncome: 0,
    energyIncome: 0,
    cardIncome: 0,
    ...overrides,
  };
}

function createMockSolarSystemSpaceState(
  spaceId: string,
  index: number,
): IPublicSolarSystemSpaceState {
  const ringIndex = (Math.floor(index / 8) + 1) as 1 | 2 | 3 | 4;
  const sectorIndex = index % 8;
  const cellInSector = 0;

  return {
    spaceId,
    ringIndex,
    indexInRing: sectorIndex * ringIndex + cellInSector,
    sectorIndex,
    cellInSector,
    hasPublicityIcon: false,
    elementTypes: ['EMPTY'],
    elements: [{ type: 'EMPTY' }],
  };
}

function createMockSolarSystemSpaceStates(
  spaces: string[],
): Record<string, IPublicSolarSystemSpaceState> {
  return Object.fromEntries(
    spaces.map((spaceId, index) => [
      spaceId,
      createMockSolarSystemSpaceState(spaceId, index),
    ]),
  );
}

export function createMockSolarSystem(): IPublicSolarSystem {
  const spaces = Array.from({ length: 32 }, (_, i) => `space-${i}`);

  return {
    spaces,
    adjacency: {},
    probes: [],
    discs: [
      { discIndex: 0, angle: 0 },
      { discIndex: 1, angle: 0 },
      { discIndex: 2, angle: 0 },
      { discIndex: 3, angle: 0 },
    ],
    alienTokens: [],
    spaceStates: createMockSolarSystemSpaceStates(spaces),
    planetSpaceIds: {},
    sectorSpaceIds: Object.fromEntries(
      Array.from({ length: 8 }, (_, sectorIndex) => [
        sectorIndex,
        spaces.filter((_, index) => index % 8 === sectorIndex),
      ]),
    ),
    probeSpaceById: {},
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
  return colors.map((color, i) => {
    const tileDefinition =
      SECTOR_TILE_DEFINITIONS[ALL_SECTOR_TILE_IDS[Math.floor(i / 2)]];
    const sectorOnTile = tileDefinition.sectors[i % 2];
    const starConfig = SECTOR_STAR_CONFIGS[sectorOnTile.starName];

    return {
      sectorId: `sector-${i}`,
      name: sectorOnTile.starName,
      color,
      signals: [
        { type: 'data' as const },
        { type: 'data' as const },
        { type: 'data' as const },
      ],
      dataCapability: 3,
      dataSlotCapacity: 3,
      firstWinnerBonus: starConfig.firstWinBonus,
      otherWinnerBonus: starConfig.repeatWinBonus,
      sectorWinners: [] as string[],
      completed: false,
    };
  });
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
    mainDeck: { drawPileSize: 20, discardPileSize: 0 },
    cardRow: [],
    endOfRoundStacks: [[], [], [], []],
    currentEndOfRoundStackIndex: 0,
    aliens: [],
    recentEvents: [],
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
    ...overrides,
    roundIndex: overrides?.roundIndex ?? 1,
    maxRounds: overrides?.maxRounds ?? 5,
    undoAllowed: overrides?.undoAllowed ?? false,
    canUndo: overrides?.canUndo ?? false,
    turnIndex: overrides?.turnIndex ?? 0,
  };
}
