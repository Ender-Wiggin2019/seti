import {
  ESectorPosition,
  ESectorTileId,
  type ISolarSystemSetupConfig,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import { ALL_CARDS } from '@seti/common/data';
import { ETech } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { useMemo, useState } from 'react';
import {
  GameContextValueProvider,
  type IGameContext,
} from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';
import {
  EGameEventType,
  EPhase,
  type IPublicGameState,
  type IPublicSolarSystemDiscState,
} from '@/types/re-exports';

type TDebugScenario = 'my-turn' | 'opponent-turn' | 'spectator' | 'game-over';

function createAdjacencyMap(): Record<string, string[]> {
  const adjacencyMap: Record<string, string[]> = {};
  for (let index = 0; index < 32; index += 1) {
    const ringStart = Math.floor(index / 8) * 8;
    const indexInRing = index % 8;
    const leftIndex = ringStart + ((indexInRing + 7) % 8);
    const rightIndex = ringStart + ((indexInRing + 1) % 8);
    const neighbors = [`space-${leftIndex}`, `space-${rightIndex}`];
    if (index >= 8) neighbors.push(`space-${index - 8}`);
    if (index < 24) neighbors.push(`space-${index + 8}`);
    adjacencyMap[`space-${index}`] = neighbors;
  }
  return adjacencyMap;
}

function createDebugSetupConfig(
  discAngles: [number, number, number],
): ISolarSystemSetupConfig {
  return {
    tilePlacements: [
      {
        tileId: ESectorTileId.TILE_1,
        position: ESectorPosition.NORTH,
        sectorIds: ['sector-0', 'sector-1'],
      },
      {
        tileId: ESectorTileId.TILE_2,
        position: ESectorPosition.WEST,
        sectorIds: ['sector-2', 'sector-3'],
      },
      {
        tileId: ESectorTileId.TILE_3,
        position: ESectorPosition.EAST,
        sectorIds: ['sector-4', 'sector-5'],
      },
      {
        tileId: ESectorTileId.TILE_4,
        position: ESectorPosition.SOUTH,
        sectorIds: ['sector-6', 'sector-7'],
      },
    ],
    initialDiscAngles: discAngles,
  };
}

function createSectorsFromSetup(setupConfig: ISolarSystemSetupConfig) {
  return setupConfig.tilePlacements.flatMap((placement) => {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    return tileDef.sectors.map((sectorOnTile, idx) => ({
      sectorId: placement.sectorIds[idx],
      color: sectorOnTile.color,
      dataSlots:
        idx === 0 ? ['player-1', null, null] : ['player-2', 'player-3', null],
      markerSlots: [] as { playerId: string; timestamp: number }[],
      completed: placement.tileId === ESectorTileId.TILE_3 && idx === 1,
    }));
  });
}

function createDebugGameState(
  scenario: TDebugScenario,
  discAngles: [number, number, number],
): IPublicGameState {
  const setupConfig = createDebugSetupConfig(discAngles);

  const discs: IPublicSolarSystemDiscState[] = [
    { discIndex: 0, angle: discAngles[0] % 8 },
    { discIndex: 1, angle: discAngles[1] % 8 },
    { discIndex: 2, angle: discAngles[2] % 8 },
    { discIndex: 3, angle: 0 },
  ];

  return {
    gameId: `debug-${scenario}`,
    round: 3,
    phase:
      scenario === 'game-over' ? EPhase.GAME_OVER : EPhase.AWAIT_MAIN_ACTION,
    currentPlayerId: scenario === 'opponent-turn' ? 'player-2' : 'player-1',
    startPlayerId: 'player-1',
    players: [
      {
        playerId: 'player-1',
        playerName: 'Commander Ada',
        seatIndex: 0,
        color: 'red',
        score: 24,
        handSize: 5,
        resources: { credit: 26, energy: 6, data: 3, publicity: 2 },
        traces: {},
        computer: {
          topSlots: [null, null, null],
          bottomSlots: [null, null, null],
        },
        dataPoolCount: 4,
        dataPoolMax: 6,
        pieces: { probes: 2, orbiters: 1, landers: 1, signalMarkers: 5 },
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.SCAN_EARTH_LOOK],
        passed: false,
        movementPoints: 2,
        dataStashCount: 1,
        probesInSpace: 2,
        probeSpaceLimit: 2,
      },
      {
        playerId: 'player-2',
        playerName: 'Pilot Lin',
        seatIndex: 1,
        color: 'blue',
        score: 20,
        handSize: 4,
        resources: { credit: 16, energy: 4, data: 5, publicity: 1 },
        traces: {},
        computer: {
          topSlots: [null, null, null],
          bottomSlots: [null, null, null],
        },
        dataPoolCount: 3,
        dataPoolMax: 6,
        pieces: { probes: 2, orbiters: 2, landers: 1, signalMarkers: 6 },
        techs: [ETechId.COMPUTER_VP_CREDIT],
        passed: scenario === 'game-over',
        movementPoints: 1,
        dataStashCount: 0,
        probesInSpace: 1,
        probeSpaceLimit: 1,
      },
      {
        playerId: 'player-3',
        playerName: 'Analyst Rhea',
        seatIndex: 2,
        color: 'green',
        score: 17,
        handSize: 3,
        resources: { credit: 11, energy: 5, data: 1, publicity: 4 },
        traces: {},
        computer: {
          topSlots: [null, null, null],
          bottomSlots: [null, null, null],
        },
        dataPoolCount: 5,
        dataPoolMax: 6,
        pieces: { probes: 1, orbiters: 1, landers: 2, signalMarkers: 4 },
        techs: [ETechId.SCAN_POP_SIGNAL],
        passed: false,
        movementPoints: 3,
        dataStashCount: 2,
        probesInSpace: 1,
        probeSpaceLimit: 1,
      },
    ],
    solarSystem: {
      spaces: Array.from({ length: 32 }, (_, index) => `space-${index}`),
      adjacency: createAdjacencyMap(),
      probes: [
        { playerId: 'player-1', spaceId: 'space-0' },
        { playerId: 'player-1', spaceId: 'space-9' },
        { playerId: 'player-2', spaceId: 'space-13' },
        { playerId: 'player-3', spaceId: 'space-21' },
      ],
      discs,
    },
    sectors: createSectorsFromSetup(setupConfig),
    solarSystemSetup: setupConfig,
    planetaryBoard: { planets: {} },
    techBoard: {
      stacks: [ETech.PROBE, ETech.SCAN, ETech.COMPUTER].flatMap((tech) =>
        [0, 1, 2, 3].map((level) => ({
          tech,
          level,
          remainingTiles: level === 0 ? 2 : 4,
          firstTakeBonusAvailable: level !== 0,
        })),
      ),
    },
    cardRow: ALL_CARDS.slice(0, 3),
    endOfRoundStacks: [ALL_CARDS.slice(3, 5), ALL_CARDS.slice(5, 7), [], []],
    currentEndOfRoundStackIndex: 1,
    aliens: [],
    recentEvents: [],
  };
}

export function GameDebugPage(): React.JSX.Element {
  const [scenario, setScenario] = useState<TDebugScenario>('my-turn');
  const [discAngles, setDiscAngles] = useState<[number, number, number]>([
    15, 35, 60,
  ]);

  const rotateRing = (ring: 1 | 2 | 3): void => {
    setDiscAngles((prev) => {
      const next: [number, number, number] = [...prev];
      if (ring === 1) {
        next[0] += 1;
      } else if (ring === 2) {
        next[0] += 1;
        next[1] += 1;
      } else {
        next[0] += 1;
        next[1] += 1;
        next[2] += 1;
      }
      return next;
    });
  };

  const gameState = useMemo(
    () => createDebugGameState(scenario, discAngles),
    [scenario, discAngles],
  );
  const isSpectator = scenario === 'spectator';
  const myPlayerId = isSpectator ? 'spectator-0' : 'player-1';
  const contextValue = useMemo<IGameContext>(
    () => ({
      gameState,
      pendingInput: null,
      isConnected: true,
      isMyTurn: gameState.currentPlayerId === myPlayerId,
      isSpectator,
      myPlayerId,
      events: [{ type: EGameEventType.ROUND_END, round: 2 }],
      sendAction: () => undefined,
      sendFreeAction: () => undefined,
      sendInput: () => undefined,
      requestUndo: () => undefined,
    }),
    [gameState, isSpectator, myPlayerId],
  );

  return (
    <GameContextValueProvider value={contextValue}>
      <div className='fixed right-3 top-3 z-50 flex items-center gap-2 rounded border border-surface-700/70 bg-surface-900/90 p-2 text-xs backdrop-blur'>
        <span className='font-mono text-text-500'>Debug</span>
        <select
          value={scenario}
          onChange={(event) =>
            setScenario(event.target.value as TDebugScenario)
          }
          className='rounded border border-surface-700 bg-surface-800 px-2 py-1 text-text-100'
        >
          <option value='my-turn'>My Turn</option>
          <option value='opponent-turn'>Opponent Turn</option>
          <option value='spectator'>Spectator</option>
          <option value='game-over'>Game Over</option>
        </select>

        <div className='flex items-center gap-1 border-l border-surface-700 pl-2'>
          <button
            type='button'
            onClick={() => rotateRing(1)}
            className='rounded border border-amber-700/60 bg-amber-900/40 px-2 py-1 text-amber-200 transition-colors hover:bg-amber-800/50'
            title='Ring 1 only rotates'
          >
            R1
          </button>
          <button
            type='button'
            onClick={() => rotateRing(2)}
            className='rounded border border-sky-700/60 bg-sky-900/40 px-2 py-1 text-sky-200 transition-colors hover:bg-sky-800/50'
            title='Ring 2 carries Ring 1'
          >
            R2
          </button>
          <button
            type='button'
            onClick={() => rotateRing(3)}
            className='rounded border border-emerald-700/60 bg-emerald-900/40 px-2 py-1 text-emerald-200 transition-colors hover:bg-emerald-800/50'
            title='Ring 3 carries Ring 2 and Ring 1'
          >
            R3
          </button>
        </div>

        <span className='font-mono text-[10px] text-text-500'>
          [{discAngles.map((a) => a % 8).join(', ')}]
        </span>
      </div>
      <GameLayout />
    </GameContextValueProvider>
  );
}
