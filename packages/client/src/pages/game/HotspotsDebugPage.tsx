import {
  OUMUAMUA_TRACE_SLOT_DEFS,
  OUMUAMUA_TRACE_SLOT_PREFIX,
} from '@seti/common/constant/alienBoardConfig';
import { PLANETARY_PLANETS } from '@seti/common/constant/boardLayout';
import {
  createDefaultSetupConfig,
  type ISolarSystemSetupConfig,
  resolveSetupConfig,
  SECTOR_STAR_CONFIGS,
} from '@seti/common/constant/sectorSetup';
import { ALL_CARDS } from '@seti/common/data';
import { ORGANIZATIONS } from '@seti/common/data/organizations';
import { EAlienType, type IBaseCard } from '@seti/common/types/BaseCard';
import { EAlienIcon, EResource, ESector } from '@seti/common/types/element';
import type { EOrganizationId } from '@seti/common/types/organization';
import {
  getTechId,
  TECH_CATEGORIES,
  TECH_LEVELS,
} from '@seti/common/types/tech';
import { useEffect, useMemo, useState } from 'react';
import { AlienBoardView } from '@/features/board/AlienBoardView';
import { PlanetaryBoardView } from '@/features/board/PlanetaryBoardView';
import { SectorGrid } from '@/features/board/SectorGrid';
import { SolarSystemView } from '@/features/board/SolarSystemView';
import { TechBoardView } from '@/features/board/TechBoardView';
import {
  createSolarHotspotSpaceId,
  loadHotspotOverridesFile,
  saveHotspotOverridesFile,
} from '@/features/hotspots/hotspotOverridesApi';
import { PlayerDashboard } from '@/features/player';
import { OrganizationCard } from '@/features/player/OrganizationCard';
import { RivalPanel } from '@/features/solo/RivalPanel';
import { cn } from '@/lib/cn';
import { useDebugStore } from '@/stores/debugStore';
import type {
  IInputResponse,
  IPlayerInputModel,
  IPublicAlienState,
  IPublicGameState,
  IPublicPlanetaryBoard,
  IPublicPlayerState,
  IPublicRivalState,
  IPublicSector,
  IPublicSolarSystem,
  IPublicSolarSystemAlienToken,
  IPublicSolarSystemSpaceState,
  IPublicTechBoard,
  IPublicTraceSlot,
  TMovementTarget,
} from '@/types/re-exports';
import {
  EMainAction,
  EPhase,
  EPlanet,
  EPlayerInputType,
  ETech,
  ETrace,
} from '@/types/re-exports';

type THotspotsDebugTab =
  | 'solar'
  | 'sectors'
  | 'planet'
  | 'tech'
  | 'player'
  | 'rival'
  | 'aliens'
  | 'corporations';

const PLAYER_ID = 'player-1';
const PLAYER_COLORS = {
  [PLAYER_ID]: '#38bdf8',
  'player-2': '#f97316',
};
const SETUP_CONFIG = createDefaultSetupConfig();
const ALIEN_TYPES = [
  EAlienType.ANOMALIES,
  EAlienType.CENTAURIANS,
  EAlienType.EXERTIANS,
  EAlienType.MASCAMITES,
  EAlienType.OUMUAMUA,
  EAlienType.GLYPHIDS,
  EAlienType.AMOEBA,
  EAlienType.ARKHOS,
] as const;
const ALIEN_LABELS: Record<EAlienType, string> = {
  [EAlienType.ANOMALIES]: 'Anomalies',
  [EAlienType.CENTAURIANS]: 'Centaurians',
  [EAlienType.EXERTIANS]: 'Exertians',
  [EAlienType.MASCAMITES]: 'Mascamites',
  [EAlienType.OUMUAMUA]: 'Oumuamua',
  [EAlienType.AMOEBA]: 'Amoeba',
  [EAlienType.GLYPHIDS]: 'Glyphids',
  [EAlienType.ARKHOS]: 'Arkhos',
  [EAlienType.DUMMY]: 'Dummy',
};
const TABS: Array<{ id: THotspotsDebugTab; label: string }> = [
  { id: 'solar', label: 'Solar System' },
  { id: 'sectors', label: 'Sectors' },
  { id: 'planet', label: 'Planet Board' },
  { id: 'tech', label: 'Tech Board' },
  { id: 'player', label: 'Personal Board' },
  { id: 'rival', label: 'Rival Board' },
  { id: 'aliens', label: 'Aliens' },
  { id: 'corporations', label: 'Corporations' },
];
function hasHotspotDrafts(
  draftOverrides: Record<string, Record<string, unknown>>,
): boolean {
  return Object.values(draftOverrides).some(
    (sceneOverrides) => Object.keys(sceneOverrides).length > 0,
  );
}

function createPlayer(
  overrides?: Partial<IPublicPlayerState>,
): IPublicPlayerState {
  return {
    playerId: PLAYER_ID,
    playerName: 'Hotspot Pilot',
    seatIndex: 0,
    color: 'blue',
    score: 12,
    handSize: 5,
    pendingSetupTucks: 0,
    resources: {
      [EResource.CREDIT]: 8,
      [EResource.ENERGY]: 5,
      [EResource.DATA]: 2,
      [EResource.PUBLICITY]: 4,
      [EResource.SIGNAL_TOKEN]: 1,
    },
    traces: {
      [ETrace.PINK]: 1,
      [ETrace.YELLOW]: 1,
      [ETrace.BLUE]: 1,
    },
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
    dataPoolCount: 2,
    dataPoolMax: 6,
    pieces: { probes: 2, orbiters: 2, landers: 2, signalMarkers: 8 },
    techs: [],
    passed: false,
    movementPoints: 2,
    dataStashCount: 0,
    probesInSpace: 1,
    probeSpaceLimit: 2,
    completableMissionBranches: [],
    completedMissionCount: 0,
    endGameCardCount: 0,
    creditIncome: 2,
    energyIncome: 1,
    cardIncome: 1,
    ...overrides,
  };
}

function createSpaceState(
  spaceId: string,
  index: number,
): IPublicSolarSystemSpaceState {
  const ringIndex = (Math.floor(index / 8) + 1) as 1 | 2 | 3 | 4;
  const sectorIndex = index % 8;
  return {
    spaceId,
    ringIndex,
    indexInRing: sectorIndex * ringIndex,
    sectorIndex,
    cellInSector: 0,
    hasPublicityIcon: index % 5 === 0,
    elementTypes: ['EMPTY'],
    elements: [{ type: 'EMPTY' }],
  };
}

function createSectorSpaceIds(
  spaceStates: Record<string, IPublicSolarSystemSpaceState>,
): Record<number, string[]> {
  return Object.values(spaceStates).reduce<Record<number, string[]>>(
    (acc, state) => {
      acc[state.sectorIndex] = [
        ...(acc[state.sectorIndex] ?? []),
        state.spaceId,
      ];
      return acc;
    },
    {},
  );
}

function createProbeSpaceById(
  probes: IPublicSolarSystem['probes'],
): Record<string, string> {
  return Object.fromEntries(
    probes
      .filter((probe) => probe.probeId !== undefined)
      .map((probe) => [probe.probeId as string, probe.spaceId]),
  );
}

function createAnomalyTokens(): IPublicSolarSystemAlienToken[] {
  return [
    {
      tokenId: 'debug-anomaly-blue-data',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 0,
      traceColor: ETrace.BLUE,
      rewards: [{ type: 'DATA', amount: 1 }],
    },
    {
      tokenId: 'debug-anomaly-blue-energy',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 1,
      traceColor: ETrace.BLUE,
      rewards: [{ type: 'ENERGY', amount: 1 }],
    },
    {
      tokenId: 'debug-anomaly-pink-credit',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 2,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'CREDIT', amount: 1 }],
    },
    {
      tokenId: 'debug-anomaly-pink-vp',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 3,
      traceColor: ETrace.PINK,
      rewards: [{ type: 'VP', amount: 1 }],
    },
    {
      tokenId: 'debug-anomaly-yellow-card',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 4,
      traceColor: ETrace.YELLOW,
      rewards: [{ type: 'CARD_ANY', amount: 1 }],
    },
    {
      tokenId: 'debug-anomaly-yellow-publicity',
      alienType: EAlienType.ANOMALIES,
      sectorIndex: 5,
      traceColor: ETrace.YELLOW,
      rewards: [{ type: 'PUBLICITY', amount: 1 }],
    },
  ];
}

function createSolarSystem(): IPublicSolarSystem {
  const spaces = Array.from({ length: 32 }, (_, i) =>
    createSolarHotspotSpaceId(i),
  );
  const spaceStates = Object.fromEntries(
    spaces.map((spaceId, index) => [spaceId, createSpaceState(spaceId, index)]),
  );
  const probes: IPublicSolarSystem['probes'] = [
    {
      playerId: PLAYER_ID,
      spaceId: createSolarHotspotSpaceId(0),
      probeId: 'probe-hotspot',
    },
  ];
  const movementTarget: TMovementTarget = {
    type: 'probe',
    id: 'probe-hotspot',
  };

  return {
    spaces,
    adjacency: {
      [createSolarHotspotSpaceId(0)]: [
        createSolarHotspotSpaceId(1),
        createSolarHotspotSpaceId(8),
      ],
      [createSolarHotspotSpaceId(1)]: [
        createSolarHotspotSpaceId(0),
        createSolarHotspotSpaceId(2),
      ],
      [createSolarHotspotSpaceId(8)]: [
        createSolarHotspotSpaceId(0),
        createSolarHotspotSpaceId(16),
      ],
    },
    probes,
    movablePieces: [
      {
        pieceId: 'probe-hotspot',
        pieceType: 'probe',
        playerId: PLAYER_ID,
        spaceId: createSolarHotspotSpaceId(0),
        movementTarget,
      },
    ],
    discs: [
      { discIndex: 0, angle: 0 },
      { discIndex: 1, angle: 1 },
      { discIndex: 2, angle: 2 },
      { discIndex: 3, angle: 0 },
    ],
    nextRotateRing: 1,
    spaceStates,
    planetSpaceIds: {
      [EPlanet.EARTH]: createSolarHotspotSpaceId(0),
      [EPlanet.MARS]: createSolarHotspotSpaceId(8),
    },
    sectorSpaceIds: createSectorSpaceIds(spaceStates),
    probeSpaceById: createProbeSpaceById(probes),
    alienTokens: createAnomalyTokens(),
  };
}

function createSectors(setupConfig: ISolarSystemSetupConfig): IPublicSector[] {
  return resolveSetupConfig(setupConfig).flatMap((placement) =>
    placement.sectors.map((sector, index) => {
      const sectorId = placement.sectorIds[index];
      const starConfig = SECTOR_STAR_CONFIGS[sector.starName];
      return {
        sectorId,
        name: sector.starName,
        color: sector.color,
        signals: [
          { type: 'data' as const },
          { type: 'player' as const, playerId: PLAYER_ID },
          { type: 'data' as const },
        ],
        dataCapability: starConfig.dataSlotCapacity,
        dataSlotCapacity: starConfig.dataSlotCapacity,
        firstWinnerBonus: starConfig.firstWinBonus,
        otherWinnerBonus: starConfig.repeatWinBonus,
        sectorWinners: [],
        completed: false,
      };
    }),
  );
}

function createPlanetState() {
  return {
    orbitSlots: [],
    landingSlots: [],
    firstOrbitClaimed: false,
    firstLandDataBonusTaken: [],
    moonOccupants: [],
  };
}

function createPlanetaryBoard(): IPublicPlanetaryBoard {
  return {
    planets: Object.fromEntries(
      PLANETARY_PLANETS.map((planet) => [planet, createPlanetState()]),
    ),
  };
}

function createTechBoard(): IPublicTechBoard {
  return {
    stacks: TECH_CATEGORIES.flatMap((tech) =>
      TECH_LEVELS.map((level) => ({
        tech,
        level,
        remainingTiles: level === 0 ? 2 : 4,
        firstTakeBonusAvailable: level > 0,
      })),
    ),
  };
}

function createTraceSlot(
  slotId: string,
  traceColor: ETrace,
  overrides?: Partial<IPublicTraceSlot>,
): IPublicTraceSlot {
  return {
    slotId,
    traceColor,
    occupants: [],
    maxOccupants: 1,
    rewards: [{ type: 'VP', amount: 1 }],
    isDiscovery: false,
    ...overrides,
  };
}

function createOccupiedTraceSlot(
  slotId: string,
  traceColor: ETrace,
  overrides?: Partial<IPublicTraceSlot>,
): IPublicTraceSlot {
  return {
    ...createTraceSlot(slotId, traceColor),
    occupants: [{ source: { playerId: PLAYER_ID }, traceColor }],
    ...overrides,
  };
}

function createAnomalyColumnSlots(traceColor: ETrace): IPublicTraceSlot[] {
  return [0, 1, 2, 3, 4].map((tier) =>
    createOccupiedTraceSlot(`anomaly-${traceColor}-${tier}`, traceColor, {
      occupants:
        tier === 0 ? [{ source: { playerId: PLAYER_ID }, traceColor }] : [],
      maxOccupants: tier === 4 ? -1 : 1,
    }),
  );
}

function createTraceSlots(
  prefix: string,
  traceColor: ETrace,
  rewardsBySlot: ReadonlyArray<IPublicTraceSlot['rewards']>,
): IPublicTraceSlot[] {
  return rewardsBySlot.map((rewards, index) =>
    createTraceSlot(`${prefix}-${traceColor}-${index}`, traceColor, {
      rewards,
      occupants:
        index === 0 ? [{ source: { playerId: PLAYER_ID }, traceColor }] : [],
    }),
  );
}

function createOumuamuaTraceSlots(alienIndex: number): IPublicTraceSlot[] {
  return [ETrace.PINK, ETrace.YELLOW, ETrace.BLUE].flatMap((traceColor) =>
    OUMUAMUA_TRACE_SLOT_DEFS.map((def, index) =>
      createTraceSlot(
        `alien-${alienIndex}-${OUMUAMUA_TRACE_SLOT_PREFIX}|${traceColor}|${def.tierFromBottom}|${def.exofossilCost}`,
        traceColor,
        {
          maxOccupants: def.maxOccupants,
          rewards: def.rewards.map((reward) => ({ ...reward })),
          occupants:
            index === 0
              ? [{ source: { playerId: PLAYER_ID }, traceColor }]
              : [],
        },
      ),
    ),
  );
}

function findAlienCard(alienType: EAlienType): IBaseCard {
  return ALL_CARDS.find((card) => card.alien === alienType) ?? ALL_CARDS[0];
}

function createAlienState(
  alienType: EAlienType,
  alienIndex: number,
): IPublicAlienState {
  const faceUpCard = findAlienCard(alienType);
  return {
    alienIndex,
    alienType,
    discovered: true,
    discovery: {
      zones: [createTraceSlot(`discovery-${alienIndex}`, ETrace.PINK)],
      overflowZones: [],
    },
    cardZone: {
      faceUpCardId: faceUpCard.id,
      drawPileSize: 7,
      discardPileSize: alienIndex % 2,
    },
    board: createAlienBoard(alienType, alienIndex),
  };
}

function createAlienBoard(
  alienType: EAlienType,
  alienIndex: number,
): NonNullable<IPublicAlienState['board']> {
  switch (alienType) {
    case EAlienType.ANOMALIES:
      return {
        type: 'anomalies',
        traceBoard: {
          columns: {
            [ETrace.PINK]: createAnomalyColumnSlots(ETrace.PINK),
            [ETrace.YELLOW]: createAnomalyColumnSlots(ETrace.YELLOW),
            [ETrace.BLUE]: createAnomalyColumnSlots(ETrace.BLUE),
          },
        },
      };
    case EAlienType.CENTAURIANS:
      return {
        type: 'centaurians',
        messageMilestones: [],
        pendingMessagesByPlayer: {},
        rewardSlots: [],
        traceSlots: [
          createOccupiedTraceSlot(
            `centaurians-${alienIndex}-pink`,
            ETrace.PINK,
          ),
          createOccupiedTraceSlot(
            `centaurians-${alienIndex}-yellow`,
            ETrace.YELLOW,
          ),
          createOccupiedTraceSlot(
            `centaurians-${alienIndex}-blue`,
            ETrace.BLUE,
          ),
        ],
      };
    case EAlienType.EXERTIANS:
      return {
        type: 'exertians',
        faceDownCards: [],
        milestones: [],
        traceSlots: [
          ...createTraceSlots(`exertians-${alienIndex}`, ETrace.PINK, [
            [
              { type: 'VP', amount: 9 },
              { type: 'CREDIT', amount: 1 },
            ],
            [
              { type: 'VP', amount: 7 },
              { type: 'CREDIT', amount: 1 },
            ],
            [
              { type: 'VP', amount: 5 },
              { type: 'CREDIT', amount: 1 },
            ],
            [
              { type: 'VP', amount: 4 },
              { type: 'CREDIT', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
          ]),
          ...createTraceSlots(`exertians-${alienIndex}`, ETrace.YELLOW, [
            [
              { type: 'VP', amount: 6 },
              { type: 'ENERGY', amount: 1 },
              { type: 'CARD', amount: 1 },
            ],
            [
              { type: 'VP', amount: 4 },
              { type: 'ENERGY', amount: 1 },
              { type: 'CARD', amount: 1 },
            ],
            [
              { type: 'VP', amount: 2 },
              { type: 'ENERGY', amount: 1 },
              { type: 'CARD', amount: 1 },
            ],
            [
              { type: 'VP', amount: 1 },
              { type: 'ENERGY', amount: 1 },
              { type: 'CARD', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
          ]),
          ...createTraceSlots(`exertians-${alienIndex}`, ETrace.BLUE, [
            [
              { type: 'VP', amount: 6 },
              { type: 'DATA', amount: 1 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 4 },
              { type: 'DATA', amount: 1 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 2 },
              { type: 'DATA', amount: 1 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 1 },
              { type: 'DATA', amount: 1 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
          ]),
        ],
      };
    case EAlienType.MASCAMITES:
      return {
        type: 'mascamites',
        samplePools: { [EPlanet.JUPITER]: 1, [EPlanet.SATURN]: 1 },
        publicSamples: [],
        capsules: [],
        deliveredSamples: [],
        traceSlots: [
          ...createTraceSlots(`mascamites-${alienIndex}`, ETrace.PINK, [
            [
              { type: 'VP', amount: 5 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [{ type: 'VP', amount: 5 }],
            [{ type: 'VP', amount: 4 }],
          ]),
          ...createTraceSlots(`mascamites-${alienIndex}`, ETrace.YELLOW, [
            [
              { type: 'VP', amount: 5 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [{ type: 'VP', amount: 5 }],
            [{ type: 'VP', amount: 4 }],
          ]),
          ...createTraceSlots(`mascamites-${alienIndex}`, ETrace.BLUE, [
            [
              { type: 'VP', amount: 5 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [
              { type: 'VP', amount: 3 },
              { type: 'PUBLICITY', amount: 1 },
            ],
            [{ type: 'VP', amount: 7 }],
            [
              { type: 'VP', amount: 3 },
              { type: 'CARD_ANY', amount: 1 },
            ],
            [{ type: 'DATA', amount: 2 }],
            [{ type: 'PUBLICITY', amount: 3 }],
            [{ type: 'CARD', amount: 2 }],
            [{ type: 'ENERGY', amount: 2 }],
            [{ type: 'CREDIT', amount: 2 }],
          ]),
        ],
      };
    case EAlienType.OUMUAMUA:
      return {
        type: 'oumuamua',
        tile: {
          spaceId: createSolarHotspotSpaceId(8),
          sectorId: 'sector-1',
          dataRemaining: 3,
          markerPlayerIds: [PLAYER_ID],
        },
        traceSlots: createOumuamuaTraceSlots(alienIndex),
      };
    case EAlienType.GLYPHIDS:
      return {
        type: 'glyphids',
        glyphTokenBankSize: 33,
        glyphRows: { [PLAYER_ID]: [[EAlienIcon.GLYPH_RED]] },
        boardTokens: [{ position: 0, glyph: EAlienIcon.GLYPH_YELLOW }],
        placedTokens: [],
        translationRows: [
          {
            rowId: 'glyphids-translation-level-1',
            level: 1,
            glyphs: [EAlienIcon.GLYPH_GREEN, null, null, null],
            side: 1,
          },
        ],
        traceSlots: [
          createOccupiedTraceSlot(`glyphids-${alienIndex}-pink`, ETrace.PINK),
        ],
      };
    case EAlienType.AMOEBA:
      return {
        type: 'amoeba',
        organelles: [
          {
            tokenId: 'amoeba-organelle-hotspot',
            color: EAlienIcon.ORGANELLE_RED,
            position: 8,
          },
        ],
        traceSlots: [
          createOccupiedTraceSlot(`amoeba-${alienIndex}-pink`, ETrace.PINK),
        ],
      };
    case EAlienType.ARKHOS:
      return {
        type: 'arkhos',
        explorationDeckSize: 5,
        explorationReserveSize: 4,
        explorationDiscardSize: 0,
        securityCardsByPlayer: {},
        accessByPlayer: {},
        resolvedExplorationRewards: [],
        traceSlots: [
          createOccupiedTraceSlot(`arkhos-${alienIndex}-pink`, ETrace.PINK),
        ],
      };
    default:
      return {
        type: 'generic',
        slots: [
          createOccupiedTraceSlot(`generic-${alienIndex}-pink`, ETrace.PINK),
          createTraceSlot(`generic-${alienIndex}-yellow`, ETrace.YELLOW),
          createTraceSlot(`generic-${alienIndex}-blue`, ETrace.BLUE),
        ],
      };
  }
}

function createRival(): IPublicRivalState {
  return {
    rivalPlayerId: 'rival',
    difficulty: 3,
    progress: 5,
    progressSlot: 5,
    boardConfigId: 'rival-board-2',
    techIds: [
      getTechId(ETech.PROBE, 0),
      getTechId(ETech.SCAN, 1),
      getTechId(ETech.COMPUTER, 2),
    ],
    computer: {
      filledSlots: Array.from({ length: 12 }, (_, index) => index < 3),
      slotRewards: Array.from({ length: 12 }, () => null),
      dataPool: 2,
    },
    actionDeck: {
      drawPileSize: 8,
      discardPileSize: 2,
      advancedReserveSize: 4,
      removedCardIds: [],
      currentCardId: 'S.1',
    },
    revealedObjectiveIds: [],
    completedObjectiveIds: [],
    objectiveTaskMarkers: {},
  };
}

function createGameState(): IPublicGameState {
  const player = createPlayer();
  const solarSystem = createSolarSystem();
  const sectors = createSectors(SETUP_CONFIG);
  const planetaryBoard = createPlanetaryBoard();
  const techBoard = createTechBoard();
  const aliens = ALIEN_TYPES.map((alienType, index) =>
    createAlienState(alienType, index),
  );

  return {
    gameId: 'hotspots-debug',
    round: 1,
    roundIndex: 1,
    maxRounds: 5,
    phase: EPhase.AWAIT_MAIN_ACTION,
    currentPlayerId: PLAYER_ID,
    startPlayerId: PLAYER_ID,
    players: [player],
    solarSystem,
    sectors,
    solarSystemSetup: SETUP_CONFIG,
    planetaryBoard,
    techBoard,
    mainDeck: { drawPileSize: 32, discardPileSize: 4 },
    cardRow: ALL_CARDS.slice(0, 5),
    endOfRoundStacks: [[], [], [], []],
    currentEndOfRoundStackIndex: 0,
    aliens,
    recentEvents: [],
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
    rival: createRival(),
    undoAllowed: false,
    canUndo: false,
    turnIndex: 0,
  };
}

function createSectorInput(): IPlayerInputModel {
  return {
    inputId: 'hotspot-sector',
    type: EPlayerInputType.SECTOR,
    title: 'Choose a sector',
    options: [ESector.RED, ESector.YELLOW, ESector.BLUE, ESector.BLACK],
  };
}

function createPlanetInput(): IPlayerInputModel {
  return {
    inputId: 'hotspot-planet',
    type: EPlayerInputType.PLANET,
    title: 'Choose a planet',
    options: [...PLANETARY_PLANETS],
  };
}

function createTechInput(): IPlayerInputModel {
  return {
    inputId: 'hotspot-tech',
    type: EPlayerInputType.TECH,
    title: 'Choose tech',
    options: [ETech.PROBE, ETech.SCAN, ETech.COMPUTER],
  };
}

function noopInputResponse(_response: IInputResponse): void {
  // Intentionally empty: the page calibrates UI hit areas, not game flow.
}

function renderPanel(tab: THotspotsDebugTab, gameState: IPublicGameState) {
  const player = gameState.players[0];

  switch (tab) {
    case 'solar':
      return (
        <section data-testid='hotspots-debug-panel-solar'>
          <SolarSystemView
            solarSystem={gameState.solarSystem}
            sectors={gameState.sectors}
            setupConfig={SETUP_CONFIG}
            pendingInput={null}
            playerColors={PLAYER_COLORS}
            myPlayerId={PLAYER_ID}
            movementPoints={2}
            moveModeActive
            allowMoveAnyProbe
            onMoveProbe={() => undefined}
            onRespondInput={noopInputResponse}
          />
        </section>
      );
    case 'sectors':
      return (
        <section
          className='relative mx-auto h-[620px] w-full max-w-[620px]'
          data-testid='hotspots-debug-panel-sectors'
        >
          <SectorGrid
            sectors={gameState.sectors}
            setupConfig={SETUP_CONFIG}
            playerColors={PLAYER_COLORS}
            pendingInput={createSectorInput()}
            boardScale={0.82}
            onSelectSector={() => undefined}
            onSelectSectorId={() => undefined}
          />
        </section>
      );
    case 'planet':
      return (
        <section data-testid='hotspots-debug-panel-planet'>
          <PlanetaryBoardView
            planetaryBoard={gameState.planetaryBoard}
            gameState={gameState}
            myPlayerId={PLAYER_ID}
            pendingInput={createPlanetInput()}
            playerColors={PLAYER_COLORS}
            onSelectMainActionPlanet={() => undefined}
            onRespondInput={noopInputResponse}
          />
        </section>
      );
    case 'tech':
      return (
        <section data-testid='hotspots-debug-panel-tech'>
          <TechBoardView
            techBoard={gameState.techBoard}
            players={gameState.players}
            pendingInput={createTechInput()}
            playerColors={PLAYER_COLORS}
            myPlayerId={PLAYER_ID}
            onSubmit={noopInputResponse}
          />
        </section>
      );
    case 'player':
      return (
        <section data-testid='hotspots-debug-panel-player'>
          <PlayerDashboard
            player={player}
            pendingInput={null}
            onFreeAction={() => undefined}
            income={{ credit: 2, energy: 1, card: 1 }}
            techs={player.techs}
          />
        </section>
      );
    case 'rival':
      return (
        <section data-testid='hotspots-debug-panel-rival'>
          <RivalPanel rival={gameState.rival as IPublicRivalState} />
        </section>
      );
    case 'aliens':
      return (
        <section
          className='space-y-4'
          data-testid='hotspots-debug-panel-aliens'
        >
          {ALIEN_TYPES.map((alienType) => (
            <h3 key={alienType} className='sr-only'>
              {ALIEN_LABELS[alienType]}
            </h3>
          ))}
          {gameState.aliens
            .reduce<IPublicAlienState[][]>((rows, alien, index) => {
              if (index % 2 === 0) rows.push([alien]);
              else rows[rows.length - 1].push(alien);
              return rows;
            }, [])
            .map((aliens) => (
              <AlienBoardView
                key={aliens.map((alien) => alien.alienIndex).join('-')}
                aliens={aliens}
                playerColors={PLAYER_COLORS}
                planetaryBoard={gameState.planetaryBoard}
                gameState={gameState}
                myPlayerId={PLAYER_ID}
                planetActionMode={EMainAction.ORBIT}
                onSelectMainActionPlanet={() => undefined}
                onCardInspect={() => undefined}
              />
            ))}
        </section>
      );
    case 'corporations':
      return (
        <section
          className='flex flex-wrap items-start gap-3'
          data-testid='hotspots-debug-panel-corporations'
        >
          {ORGANIZATIONS.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organizationId={organization.id}
              available
              used
              state={player.organizationState?.[organization.id]}
              onUse={(_organizationId: EOrganizationId) => undefined}
            />
          ))}
        </section>
      );
  }
}

export function HotspotsDebugPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<THotspotsDebugTab>('solar');
  const [hotspotPersistenceError, setHotspotPersistenceError] = useState('');
  const solarRingIndices = [1, 2, 3, 4] as const;
  const [solarRingOffsets, setSolarRingOffsets] = useState<
    Record<(typeof solarRingIndices)[number], number>
  >({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const gameState = useMemo(createGameState, []);
  const textMode = useDebugStore((state) => state.textMode);
  const setTextMode = useDebugStore((state) => state.setTextMode);
  const hotspotDebug = useDebugStore((state) => state.hotspotDebug);
  const setHotspotDebug = useDebugStore((state) => state.setHotspotDebug);
  const showInteractiveHotspots = useDebugStore(
    (state) => state.showInteractiveHotspots,
  );
  const setShowInteractiveHotspots = useDebugStore(
    (state) => state.setShowInteractiveHotspots,
  );
  const showAnchorHotspots = useDebugStore((state) => state.showAnchorHotspots);
  const setShowAnchorHotspots = useDebugStore(
    (state) => state.setShowAnchorHotspots,
  );
  const hasUnsavedHotspots = useDebugStore((state) =>
    hasHotspotDrafts(state.hotspotDraftOverrides),
  );
  const saveHotspotOverrides = useDebugStore(
    (state) => state.saveHotspotOverrides,
  );
  const previewHotspotOverrides = useDebugStore(
    (state) => state.previewHotspotOverrides,
  );
  const setHotspotOverrides = useDebugStore(
    (state) => state.setHotspotOverrides,
  );
  const resetHotspotOverrides = useDebugStore(
    (state) => state.resetHotspotOverrides,
  );
  const setHotspotDraftOverride = useDebugStore(
    (state) => state.setHotspotDraftOverride,
  );
  useEffect(() => {
    setHotspotDebug(true);
  }, [setHotspotDebug]);

  useEffect(() => {
    setSolarRingOffsets({ 1: 0, 2: 0, 3: 0, 4: 0 });
  }, [textMode]);

  useEffect(() => {
    let active = true;
    loadHotspotOverridesFile()
      .then((overrides) => {
        if (active) setHotspotOverrides(overrides);
      })
      .catch((error) => {
        if (active) {
          setHotspotPersistenceError(
            error instanceof Error ? error.message : 'Failed to load hotspots',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [setHotspotOverrides]);

  async function handleSaveHotspots(): Promise<void> {
    const nextOverrides = previewHotspotOverrides();
    try {
      await saveHotspotOverridesFile(nextOverrides);
      saveHotspotOverrides();
      setSolarRingOffsets({ 1: 0, 2: 0, 3: 0, 4: 0 });
      setHotspotPersistenceError('');
    } catch (error) {
      setHotspotPersistenceError(
        error instanceof Error ? error.message : 'Failed to save hotspots',
      );
    }
  }

  function applySolarRingSlider(
    ringIndex: 1 | 2 | 3 | 4,
    nextOffset: number,
  ): void {
    if (!Number.isFinite(nextOffset)) return;
    const currentOffset = solarRingOffsets[ringIndex] ?? 0;
    const deltaPx = nextOffset - currentOffset;
    setSolarRingOffsets((current) => ({ ...current, [ringIndex]: nextOffset }));
    if (deltaPx === 0) return;

    const variant = textMode ? 'text' : 'image';
    const storageSceneId = `solar-system:${variant}`;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        `[data-hotspot-scene="solar-system"][data-hotspot-role="interactive"][data-hotspot-variant="${variant}"]`,
      ),
    );
    const centerPx = 380;
    const baseSizePx = 760;
    const hotspotIds = gameState.solarSystem.spaces.filter((spaceId) => {
      const state = gameState.solarSystem.spaceStates[spaceId];
      return state?.ringIndex === ringIndex && state.cellInSector === 0;
    });

    for (const hotspotId of hotspotIds) {
      const element = elements.find(
        (candidate) => candidate.dataset.hotspotId === hotspotId,
      );
      if (!element) continue;
      const leftPct = Number.parseFloat(element.style.left);
      const topPct = Number.parseFloat(element.style.top);
      const widthPct = Number.parseFloat(element.style.width);
      const heightPct = Number.parseFloat(element.style.height);
      if (
        !Number.isFinite(leftPct) ||
        !Number.isFinite(topPct) ||
        !Number.isFinite(widthPct) ||
        !Number.isFinite(heightPct)
      ) {
        continue;
      }
      const x = (leftPct / 100) * baseSizePx;
      const y = (topPct / 100) * baseSizePx;
      const dx = x - centerPx;
      const dy = y - centerPx;
      const radius = Math.hypot(dx, dy);
      if (radius <= 0) continue;
      const scale = Math.max(0, radius + deltaPx) / radius;
      setHotspotDraftOverride(storageSceneId, hotspotId, {
        x: centerPx + dx * scale,
        y: centerPx + dy * scale,
        width: (widthPct / 100) * baseSizePx,
        height: (heightPct / 100) * baseSizePx,
      });
    }
  }

  return (
    <main
      className='min-h-screen bg-background-950 px-4 py-4 text-text-100 sm:px-6'
      data-testid='hotspots-debug-page'
    >
      <header className='mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-surface-700/50 pb-3'>
        <div>
          <p className='micro-label'>UI Calibration</p>
          <h1 className='font-display text-2xl font-bold uppercase tracking-wide'>
            Hotspot Debug
          </h1>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <div
            aria-label='Board render mode'
            className='flex overflow-hidden rounded border border-surface-700/60'
            role='group'
          >
            <button
              type='button'
              aria-pressed={!textMode}
              onClick={() => setTextMode(false)}
              className={cn(
                'px-2 py-1 font-mono text-[10px] uppercase transition-colors',
                !textMode
                  ? 'bg-accent-500/20 text-accent-100'
                  : 'bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
              )}
            >
              Image Mode
            </button>
            <button
              type='button'
              aria-pressed={textMode}
              onClick={() => setTextMode(true)}
              className={cn(
                'border-l border-surface-700/60 px-2 py-1 font-mono text-[10px] uppercase transition-colors',
                textMode
                  ? 'bg-accent-500/20 text-accent-100'
                  : 'bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
              )}
            >
              Text Mode
            </button>
          </div>
          <button
            type='button'
            aria-pressed={hotspotDebug}
            onClick={() => setHotspotDebug(!hotspotDebug)}
            className={cn(
              'rounded border px-2 py-1 font-mono text-[10px] uppercase transition-colors',
              hotspotDebug
                ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-100'
                : 'border-surface-700/60 bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
            )}
          >
            Hotspots {hotspotDebug ? 'On' : 'Off'}
          </button>
          <button
            type='button'
            aria-pressed={showInteractiveHotspots}
            onClick={() => setShowInteractiveHotspots(!showInteractiveHotspots)}
            className={cn(
              'rounded border px-2 py-1 font-mono text-[10px] uppercase transition-colors',
              showInteractiveHotspots
                ? 'border-sky-400/70 bg-sky-500/20 text-sky-100'
                : 'border-surface-700/60 bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
            )}
          >
            Interactive {showInteractiveHotspots ? 'On' : 'Off'}
          </button>
          <button
            type='button'
            aria-pressed={showAnchorHotspots}
            onClick={() => setShowAnchorHotspots(!showAnchorHotspots)}
            className={cn(
              'rounded border px-2 py-1 font-mono text-[10px] uppercase transition-colors',
              showAnchorHotspots
                ? 'border-amber-400/70 bg-amber-500/20 text-amber-100'
                : 'border-surface-700/60 bg-surface-800/60 text-text-300 hover:bg-surface-700/70',
            )}
          >
            Anchors {showAnchorHotspots ? 'On' : 'Off'}
          </button>
          <button
            type='button'
            disabled={!hasUnsavedHotspots}
            onClick={() => {
              void handleSaveHotspots();
            }}
            className={cn(
              'rounded border px-2 py-1 font-mono text-[10px] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-45',
              hasUnsavedHotspots
                ? 'border-green-400/70 bg-green-500/20 text-green-100 hover:bg-green-500/30'
                : 'border-surface-700/60 bg-surface-800/60 text-text-500',
            )}
          >
            Save Hotspots
          </button>
          <button
            type='button'
            onClick={() => {
              resetHotspotOverrides();
              setSolarRingOffsets({ 1: 0, 2: 0, 3: 0, 4: 0 });
            }}
            className='rounded border border-surface-700/60 bg-surface-800/60 px-2 py-1 font-mono text-[10px] uppercase text-text-300 transition-colors hover:bg-surface-700/70'
          >
            Reset Hotspots
          </button>
        </div>
      </header>

      {hotspotPersistenceError ? (
        <p className='mb-3 rounded border border-red-400/60 bg-red-500/15 px-3 py-2 text-sm text-red-100'>
          {hotspotPersistenceError}
        </p>
      ) : null}

      <nav
        aria-label='Hotspot debug components'
        className='mb-4 flex gap-2 overflow-x-auto border-b border-surface-800/80 pb-2'
        role='tablist'
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={activeTab === tab.id}
            aria-controls={`hotspots-debug-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 rounded border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors',
              activeTab === tab.id
                ? 'border-accent-400/80 bg-accent-500/15 text-accent-100'
                : 'border-surface-700/60 bg-surface-900/60 text-text-400 hover:border-surface-500 hover:text-text-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'solar' ? (
        <section
          aria-label='Solar ring radial controls'
          className='mb-4 grid gap-2 rounded-md border border-surface-800/70 bg-surface-900/60 px-3 py-3 sm:grid-cols-2 xl:grid-cols-4'
        >
          {solarRingIndices.map((ringIndex) => (
            <label
              key={`solar-ring-slider-${ringIndex}`}
              className='grid gap-1 rounded border border-surface-800/70 bg-surface-950/35 px-2 py-2'
            >
              <span className='flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-300'>
                <span>Ring {ringIndex}</span>
                <span className='text-text-100'>
                  {solarRingOffsets[ringIndex]}px
                </span>
              </span>
              <input
                type='range'
                aria-label={`Ring ${ringIndex} radial offset`}
                min={-80}
                max={80}
                step={1}
                value={solarRingOffsets[ringIndex]}
                onChange={(event) =>
                  applySolarRingSlider(
                    ringIndex,
                    Number.parseFloat(event.currentTarget.value),
                  )
                }
                className='h-6 w-full accent-cyan-400'
              />
            </label>
          ))}
        </section>
      ) : null}

      <div className='min-w-0 overflow-x-auto pb-8'>
        {renderPanel(activeTab, gameState)}
      </div>
    </main>
  );
}
