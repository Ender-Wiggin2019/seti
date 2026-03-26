import { ALL_CARDS } from '@seti/common/data';
import { ESector, ETech } from '@seti/common/types/element';
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

function createDebugGameState(
  scenario: TDebugScenario,
  rotationStep: number,
): IPublicGameState {
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
      discs: [
        { discIndex: 0, angle: (15 + rotationStep) % 8 },
        { discIndex: 1, angle: (35 + rotationStep) % 8 },
        { discIndex: 2, angle: (60 + rotationStep) % 8 },
        { discIndex: 3, angle: 0 },
      ],
    },
    sectors: [ESector.RED, ESector.YELLOW, ESector.BLUE, ESector.BLACK].flatMap(
      (color, index) => [
        {
          sectorId: `sector-${index * 2}`,
          color,
          dataSlots: ['player-1', null, null],
          markerSlots: [],
          completed: false,
        },
        {
          sectorId: `sector-${index * 2 + 1}`,
          color,
          dataSlots: ['player-2', 'player-3', null],
          markerSlots: [],
          completed: index === 2,
        },
      ],
    ),
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
  const [rotationStep, setRotationStep] = useState(0);
  const gameState = useMemo(
    () => createDebugGameState(scenario, rotationStep),
    [scenario, rotationStep],
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
        <button
          type='button'
          onClick={() => setRotationStep((prev) => prev + 1)}
          className='rounded border border-surface-700 bg-surface-800 px-2 py-1 text-text-100 transition-colors hover:bg-surface-700'
        >
          Rotate +45°
        </button>
      </div>
      <GameLayout />
    </GameContextValueProvider>
  );
}
