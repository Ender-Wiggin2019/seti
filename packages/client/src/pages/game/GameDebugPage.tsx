import {
  GAME_DEBUG_DEFAULTS,
  GAME_DEBUG_RANGES,
} from '@seti/common/constant/debugGame';
import {
  createDefaultSolarSystemWheels,
  ESectorPosition,
  ESectorTileId,
  type EStarName,
  type ISolarSystemSetupConfig,
  type ISolarSystemWheelCell,
  type ISolarSystemWheelRuntimeElement,
  SECTOR_STAR_CONFIGS,
  SECTOR_TILE_DEFINITIONS,
  type TSolarSystemWheelIndex,
  type TSolarSystemWheels,
} from '@seti/common/constant/sectorSetup';
import { ALL_CARDS } from '@seti/common/data';
import { findPlanetSpaceId } from '@seti/common/rules/solarSystem';
import type { IBaseCard } from '@seti/common/types/BaseCard';
import { ESector, ETech } from '@seti/common/types/element';
import { ETechId } from '@seti/common/types/tech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TProbeInsetPxByRing } from '@/features/board/SolarSystemView';
import { useServerDebugSession } from '@/hooks/useServerDebugSession';
import {
  GameContextValueProvider,
  type IGameContext,
} from '@/pages/game/GameContext';
import { GameLayout } from '@/pages/game/GameLayout';
import {
  EFreeAction,
  EGameEventType,
  EMainAction,
  EPhase,
  EPlanet,
  EPlayerInputType,
  type IFreeActionRequest,
  type IInputResponse,
  type IMainActionRequest,
  type IPlayerInputModel,
  type IPublicGameState,
  type IPublicSolarSystemDiscState,
  type IPublicSolarSystemSpaceState,
} from '@/types/re-exports';

type TDebugScenario = 'my-turn' | 'opponent-turn' | 'spectator' | 'game-over';
type TDebugSourceMode = 'local' | 'server';
type TCardInputDebugMode =
  | 'none'
  | 'hand-select'
  | 'row-select'
  | 'end-of-round';

type TDiscAngles = [number, number, number];
const PUSHED_PROBE_DELAY_RESET_BASE_MS = 1100;

// ── Scan debug state machine ───────────────────────────────────────────
type TScanPhase =
  | { step: 'idle' }
  | { step: 'pool'; remaining: Set<string> }
  | { step: 'card-row'; remaining: Set<string> }
  | { step: 'hand'; remaining: Set<string> }
  | { step: 'earth-adjacent'; remaining: Set<string> }
  | { step: 'energy'; remaining: Set<string> }
  | {
      step: 'color-pick';
      remaining: Set<string>;
      color: ESector;
      sectorIds: string[];
    };

const SCAN_IDLE: TScanPhase = { step: 'idle' };
const ALL_SCAN_SUB_ACTIONS = [
  'mark-earth',
  'mark-card-row',
  'mark-mercury',
  'mark-hand',
  'energy-launch-or-move',
];

const DEBUG_STAR_COLOR_MAP: Readonly<Record<string, ESector>> = {
  procyon: ESector.BLUE,
  vega: ESector.BLACK,
  'sirius-a': ESector.BLUE,
  'barnards-star': ESector.RED,
  'kepler-22': ESector.YELLOW,
  'proxima-centauri': ESector.RED,
  '61-virginis': ESector.YELLOW,
  'beta-pictoris': ESector.BLACK,
};

function markSignalOnSectors(
  sectors: IPublicGameState['sectors'],
  sectorId: string,
  playerId: string,
): IPublicGameState['sectors'] {
  return sectors.map((s) => {
    if (s.sectorId !== sectorId) return s;
    const signals = [...s.signals];
    const leftmostDataIdx = signals.findIndex((sig) => sig.type === 'data');
    if (leftmostDataIdx < 0) {
      return s;
    }
    signals[leftmostDataIdx] = { type: 'player', playerId };
    return { ...s, signals };
  });
}

function getSectorIdByPlanet(
  gameState: IPublicGameState,
  planet: EPlanet,
): string | null {
  const spaceStates = gameState.solarSystem.spaceStates;
  if (!spaceStates) {
    return null;
  }

  for (const space of Object.values(spaceStates)) {
    const hasPlanet = (space.elements ?? []).some(
      (element) => 'planet' in element && element.planet === planet,
    );
    if (!hasPlanet) {
      continue;
    }
    const idx = ((space.indexInRing % 8) + 8) % 8;
    return `sector-${idx}`;
  }
  return null;
}

function findSectorsByColor(
  sectors: IPublicGameState['sectors'],
  color: ESector,
): string[] {
  return sectors.filter((s) => s.color === color).map((s) => s.sectorId);
}

function buildScanPoolInput(
  remaining: Set<string>,
  cardRowLength: number,
  handLength: number,
): IPlayerInputModel {
  const options: Array<{ id: string; label: string }> = [];
  if (remaining.has('mark-earth'))
    options.push({ id: 'mark-earth', label: 'Mark Earth' });
  if (remaining.has('mark-card-row') && cardRowLength > 0)
    options.push({ id: 'mark-card-row', label: 'Mark Card Row' });
  if (remaining.has('mark-mercury'))
    options.push({ id: 'mark-mercury', label: 'Mark Mercury (1 publicity)' });
  if (remaining.has('mark-hand') && handLength > 0)
    options.push({ id: 'mark-hand', label: 'Mark Hand Signal' });
  if (remaining.has('energy-launch-or-move'))
    options.push({
      id: 'energy-launch-or-move',
      label: 'Energy Launch or Move',
    });
  options.push({ id: 'done', label: 'Done (end scan)' });
  return {
    inputId: 'scan-pool',
    type: EPlayerInputType.OPTION,
    title: 'Scan: choose sub-action',
    options,
  };
}

function buildCardSelectInput(
  source: 'row' | 'hand',
  cards: IBaseCard[],
): IPlayerInputModel {
  return {
    inputId: `scan-${source}`,
    type: EPlayerInputType.CARD,
    title:
      source === 'row'
        ? 'Select a card from the card row'
        : 'Select a hand card to discard for signal',
    cards,
    minSelections: 1,
    maxSelections: 1,
  };
}

function buildColorPickInput(
  color: ESector,
  sectorIds: string[],
): IPlayerInputModel {
  return {
    inputId: 'scan-color-pick',
    type: EPlayerInputType.OPTION,
    title: `Choose ${color} sector to mark signal`,
    options: sectorIds.map((id) => ({ id, label: `Sector ${id}` })),
  };
}

function buildEnergyInput(): IPlayerInputModel {
  return {
    inputId: 'scan-energy',
    type: EPlayerInputType.OPTION,
    title: 'Select Scan Energy Launch effect',
    options: [
      { id: 'launch', label: 'Pay 1 energy to launch a probe' },
      { id: 'move', label: 'Gain 1 movement' },
    ],
  };
}

const WHEEL_ORDER: ReadonlyArray<TSolarSystemWheelIndex> = [1, 2, 3, 4];

function cloneWheels(wheels: TSolarSystemWheels): TSolarSystemWheels {
  return {
    1: wheels[1].map((row) =>
      row.map((slot) => ({
        cell: { ...slot.cell },
        elements: slot.elements.map((element) => ({ ...element })),
      })),
    ) as TSolarSystemWheels[1],
    2: wheels[2].map((row) =>
      row.map((slot) => ({
        cell: { ...slot.cell },
        elements: slot.elements.map((element) => ({ ...element })),
      })),
    ) as TSolarSystemWheels[2],
    3: wheels[3].map((row) =>
      row.map((slot) => ({
        cell: { ...slot.cell },
        elements: slot.elements.map((element) => ({ ...element })),
      })),
    ) as TSolarSystemWheels[3],
    4: wheels[4].map((row) =>
      row.map((slot) => ({
        cell: { ...slot.cell },
        elements: slot.elements.map((element) => ({ ...element })),
      })),
    ) as TSolarSystemWheels[4],
  };
}

function normalizeSlotIndex(index: number): number {
  return ((index % 8) + 8) % 8;
}

function getWheelAngle(
  wheel: TSolarSystemWheelIndex,
  discAngles: TDiscAngles,
): number {
  if (wheel === 4) {
    return 0;
  }
  return discAngles[wheel - 1] ?? 0;
}

function getLocalIndexFromBoardIndex(
  boardIndex: number,
  wheel: TSolarSystemWheelIndex,
  discAngles: TDiscAngles,
): number {
  return normalizeSlotIndex(boardIndex + getWheelAngle(wheel, discAngles));
}

function getBoardIndexFromLocalIndex(
  localIndex: number,
  wheel: TSolarSystemWheelIndex,
  discAngles: TDiscAngles,
): number {
  return normalizeSlotIndex(localIndex - getWheelAngle(wheel, discAngles));
}

function cellAtBoard(
  wheels: TSolarSystemWheels,
  wheel: TSolarSystemWheelIndex,
  band: number,
  boardIndex: number,
  discAngles: TDiscAngles,
): ISolarSystemWheelCell {
  const localIndex = getLocalIndexFromBoardIndex(boardIndex, wheel, discAngles);
  return wheels[wheel][band][localIndex];
}

function isOpaqueCell(cell: ISolarSystemWheelCell): boolean {
  return cell.cell.type !== 'NULL';
}

function resolveTopVisibleCell(
  wheels: TSolarSystemWheels,
  band: number,
  boardIndex: number,
  discAngles: TDiscAngles,
): { wheel: TSolarSystemWheelIndex; cell: ISolarSystemWheelCell } | null {
  for (const wheel of WHEEL_ORDER) {
    const cell = cellAtBoard(wheels, wheel, band, boardIndex, discAngles);
    if (isOpaqueCell(cell)) {
      return { wheel, cell };
    }
  }
  return null;
}

function isCoveredByUpperWheel(
  wheels: TSolarSystemWheels,
  lowerWheel: TSolarSystemWheelIndex,
  band: number,
  boardIndex: number,
  discAngles: TDiscAngles,
): boolean {
  for (const wheel of WHEEL_ORDER) {
    if (wheel >= lowerWheel) {
      break;
    }
    if (
      isOpaqueCell(cellAtBoard(wheels, wheel, band, boardIndex, discAngles))
    ) {
      return true;
    }
  }
  return false;
}

function createDefaultDebugWheels(): TSolarSystemWheels {
  const wheels = cloneWheels(createDefaultSolarSystemWheels());
  wheels[3][0][1].elements.push({
    type: 'PROBE',
    playerId: 'player-1',
    probeId: 'p1-a',
  });
  wheels[2][1][4].elements.push({
    type: 'PROBE',
    playerId: 'player-2',
    probeId: 'p2-a',
  });
  wheels[4][2][5].elements.push({
    type: 'PROBE',
    playerId: 'player-3',
    probeId: 'p3-a',
  });
  wheels[4][3][0].elements.push({
    type: 'PROBE',
    playerId: 'player-1',
    probeId: 'p1-b',
  });
  return wheels;
}

function movedWheelsForRotation(ring: 1 | 2 | 3): Set<TSolarSystemWheelIndex> {
  if (ring === 1) {
    return new Set([1]);
  }
  if (ring === 2) {
    return new Set([1, 2]);
  }
  return new Set([1, 2, 3]);
}

function nextDiscAnglesForRotation(
  current: TDiscAngles,
  ring: 1 | 2 | 3,
): TDiscAngles {
  const next: TDiscAngles = [...current];
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
}

function applyCoveragePushAfterRotation(
  wheels: TSolarSystemWheels,
  prevAngles: TDiscAngles,
  nextAngles: TDiscAngles,
  rotatedRing: 1 | 2 | 3,
): { wheels: TSolarSystemWheels; pushedProbeIds: string[] } {
  const nextWheels = cloneWheels(wheels);
  const movedWheels = movedWheelsForRotation(rotatedRing);
  const pushedProbeIds = new Set<string>();
  const rotatedDiscDelta =
    nextAngles[rotatedRing - 1] - prevAngles[rotatedRing - 1];
  const pushStep = rotatedDiscDelta >= 0 ? -1 : 1;

  for (const wheel of WHEEL_ORDER) {
    if (movedWheels.has(wheel)) {
      continue;
    }

    for (let band = 0; band < 4; band += 1) {
      for (let localIndex = 0; localIndex < 8; localIndex += 1) {
        const sourceCell = nextWheels[wheel][band][localIndex];
        if (sourceCell.elements.length === 0) {
          continue;
        }

        const boardIndex = getBoardIndexFromLocalIndex(
          localIndex,
          wheel,
          prevAngles,
        );
        const wasCovered = isCoveredByUpperWheel(
          nextWheels,
          wheel,
          band,
          boardIndex,
          prevAngles,
        );
        const nowCovered = isCoveredByUpperWheel(
          nextWheels,
          wheel,
          band,
          boardIndex,
          nextAngles,
        );

        if (wasCovered || !nowCovered) {
          continue;
        }

        const targetBoardIndex = normalizeSlotIndex(boardIndex + pushStep);
        const target = resolveTopVisibleCell(
          nextWheels,
          band,
          targetBoardIndex,
          nextAngles,
        );
        if (!target) {
          continue;
        }

        for (const element of sourceCell.elements) {
          if (element.type === 'PROBE' && typeof element.probeId === 'string') {
            pushedProbeIds.add(element.probeId);
          }
        }

        target.cell.elements.push(...sourceCell.elements);
        sourceCell.elements = [];
      }
    }
  }

  return { wheels: nextWheels, pushedProbeIds: [...pushedProbeIds] };
}

function getBoardCoordFromSpaceId(
  spaceId: string,
): { band: number; boardIndex: number } | null {
  const numeric = Number(spaceId.replace('space-', ''));
  if (!Number.isInteger(numeric) || numeric < 0 || numeric >= 32) {
    return null;
  }
  return { band: Math.floor(numeric / 8), boardIndex: numeric % 8 };
}

function moveVisibleProbe(
  wheels: TSolarSystemWheels,
  discAngles: TDiscAngles,
  fromSpaceId: string,
  toSpaceId: string,
  playerId?: string,
): TSolarSystemWheels {
  const from = getBoardCoordFromSpaceId(fromSpaceId);
  const to = getBoardCoordFromSpaceId(toSpaceId);
  if (!from || !to) {
    return wheels;
  }

  const nextWheels = cloneWheels(wheels);
  const fromTop = resolveTopVisibleCell(
    nextWheels,
    from.band,
    from.boardIndex,
    discAngles,
  );
  if (!fromTop) {
    return wheels;
  }

  const probeIndex = fromTop.cell.elements.findIndex((element) => {
    if (element.type !== 'PROBE') {
      return false;
    }
    if (typeof playerId !== 'string') {
      return true;
    }
    return element.playerId === playerId;
  });
  if (probeIndex === -1) {
    return wheels;
  }

  const [probeElement] = fromTop.cell.elements.splice(probeIndex, 1);
  const toTop = resolveTopVisibleCell(
    nextWheels,
    to.band,
    to.boardIndex,
    discAngles,
  );
  if (!toTop) {
    fromTop.cell.elements.splice(probeIndex, 0, probeElement);
    return wheels;
  }

  toTop.cell.elements.push(probeElement as ISolarSystemWheelRuntimeElement);
  return nextWheels;
}

function findVisiblePlanetBoardCoord(
  wheels: TSolarSystemWheels,
  discAngles: TDiscAngles,
  planet: EPlanet,
): { band: number; boardIndex: number } | null {
  for (let band = 0; band < 4; band += 1) {
    for (let boardIndex = 0; boardIndex < 8; boardIndex += 1) {
      const top = resolveTopVisibleCell(wheels, band, boardIndex, discAngles);
      if (!top) {
        continue;
      }
      const cell = top.cell.cell;
      if (
        cell.type === 'EARTH' ||
        (cell.type === 'PLANET' && cell.planet === planet)
      ) {
        return { band, boardIndex };
      }
    }
  }

  return null;
}

function placeProbeOnPlanet(
  wheels: TSolarSystemWheels,
  discAngles: TDiscAngles,
  planet: EPlanet,
  playerId: string,
  probeId: string,
): TSolarSystemWheels {
  const targetCoord = findVisiblePlanetBoardCoord(wheels, discAngles, planet);
  if (!targetCoord) {
    return wheels;
  }

  const nextWheels = cloneWheels(wheels);
  const top = resolveTopVisibleCell(
    nextWheels,
    targetCoord.band,
    targetCoord.boardIndex,
    discAngles,
  );
  if (!top) {
    return wheels;
  }

  top.cell.elements.push({ type: 'PROBE', playerId, probeId });
  return nextWheels;
}

function createDebugSpaceStates(
  wheels: TSolarSystemWheels,
  discAngles: TDiscAngles,
): Record<string, IPublicSolarSystemSpaceState> {
  const states: Record<string, IPublicSolarSystemSpaceState> = {};

  for (let band = 0; band < 4; band += 1) {
    for (let boardIndex = 0; boardIndex < 8; boardIndex += 1) {
      // boardIndex is the visual position (0-7 on screen).
      // physicalIndex is the fixed indexInRing used by SolarSystemView for positioning.
      const ring = (band + 1) as TSolarSystemWheelIndex;
      const physicalIndex = normalizeSlotIndex(
        boardIndex + getWheelAngle(ring, discAngles),
      );
      const spaceId = `space-${band * 8 + boardIndex}`;
      // resolveTopVisibleCell expects a boardIndex
      const top = resolveTopVisibleCell(wheels, band, boardIndex, discAngles);
      const mapCell = top?.cell.cell;

      states[spaceId] = {
        spaceId,
        ringIndex: band + 1,
        indexInRing: physicalIndex,
        hasPublicityIcon: mapCell?.hasPublicityIcon ?? false,
        elementTypes: [mapCell?.type ?? 'NULL'],
        elements: [
          mapCell?.planet
            ? { type: mapCell.type, planet: mapCell.planet }
            : { type: mapCell?.type ?? 'NULL' },
        ],
      };
    }
  }

  return states;
}

function extractVisibleProbes(
  wheels: TSolarSystemWheels,
  discAngles: TDiscAngles,
  probeTransitionDelayById: Record<string, number>,
): IPublicGameState['solarSystem']['probes'] {
  const probes: IPublicGameState['solarSystem']['probes'] = [];

  for (let band = 0; band < 4; band += 1) {
    for (let indexInRing = 0; indexInRing < 8; indexInRing += 1) {
      const top = resolveTopVisibleCell(wheels, band, indexInRing, discAngles);
      if (!top) {
        continue;
      }

      const spaceId = `space-${band * 8 + indexInRing}`;
      for (const element of top.cell.elements) {
        if (element.type !== 'PROBE' || typeof element.playerId !== 'string') {
          continue;
        }
        probes.push({
          playerId: element.playerId,
          spaceId,
          probeId:
            typeof element.probeId === 'string' ? element.probeId : undefined,
          transitionDelayMs:
            typeof element.probeId === 'string'
              ? probeTransitionDelayById[element.probeId]
              : undefined,
        });
      }
    }
  }

  return probes;
}

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
  discAngles: TDiscAngles,
  wheels: TSolarSystemWheels,
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
    wheels: cloneWheels(wheels),
  };
}

function createSectorsFromSetup(setupConfig: ISolarSystemSetupConfig) {
  return setupConfig.tilePlacements.flatMap((placement) => {
    const tileDef = SECTOR_TILE_DEFINITIONS[placement.tileId];
    return tileDef.sectors.map((sectorOnTile, idx) => {
      const starConfig =
        SECTOR_STAR_CONFIGS[sectorOnTile.starName as EStarName];
      const capacity = starConfig?.dataSlotCapacity ?? 5;
      const color =
        DEBUG_STAR_COLOR_MAP[sectorOnTile.starName] ?? sectorOnTile.color;
      return {
        sectorId: placement.sectorIds[idx],
        color,
        signals: Array.from({ length: capacity }, () => ({
          type: 'data' as const,
        })),
        dataSlotCapacity: capacity,
        sectorWinners: [] as string[],
        completed: false,
      };
    });
  });
}

function sliceDebugCards(start: number, count: number) {
  return Array.from({ length: count }, (_, idx) => {
    const cardIndex = (start + idx) % ALL_CARDS.length;
    return ALL_CARDS[cardIndex];
  });
}

function createDebugGameState(
  scenario: TDebugScenario,
  discAngles: TDiscAngles,
  wheels: TSolarSystemWheels,
  probeTransitionDelayById: Record<string, number>,
  cardRowStartIndex: number,
  handStartIndex: number,
  sectorOverrides?: IPublicGameState['sectors'],
): IPublicGameState {
  const setupConfig = createDebugSetupConfig(discAngles, wheels);
  const cardRow = sliceDebugCards(cardRowStartIndex, 3);
  const myHand = sliceDebugCards(handStartIndex, 5);
  const roundStacks = [
    sliceDebugCards(cardRowStartIndex + 3, 2),
    sliceDebugCards(cardRowStartIndex + 5, 2),
    sliceDebugCards(cardRowStartIndex + 7, 2),
    sliceDebugCards(cardRowStartIndex + 9, 2),
  ];

  const discs: IPublicSolarSystemDiscState[] = [
    { discIndex: 0, angle: discAngles[0] },
    { discIndex: 1, angle: discAngles[1] },
    { discIndex: 2, angle: discAngles[2] },
    { discIndex: 3, angle: 0 },
  ];

  const spaceStates = createDebugSpaceStates(wheels, discAngles);
  const probes = extractVisibleProbes(
    wheels,
    discAngles,
    probeTransitionDelayById,
  );

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
        handSize: myHand.length,
        hand: myHand,
        resources: { credit: 26, energy: 6, data: 3, publicity: 2 },
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
        dataPoolCount: 4,
        dataPoolMax: 6,
        pieces: { probes: 2, orbiters: 1, landers: 1, signalMarkers: 5 },
        techs: [ETechId.PROBE_DOUBLE_PROBE, ETechId.SCAN_EARTH_LOOK],
        passed: false,
        movementPoints: 2,
        dataStashCount: 1,
        probesInSpace: 2,
        probeSpaceLimit: 2,
        completedMissionCount: 1,
        endGameCardCount: 1,
        creditIncome: 4,
        energyIncome: 3,
        cardIncome: 1,
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
        dataPoolCount: 3,
        dataPoolMax: 6,
        pieces: { probes: 2, orbiters: 2, landers: 1, signalMarkers: 6 },
        techs: [ETechId.COMPUTER_VP_CREDIT],
        passed: scenario === 'game-over',
        movementPoints: 1,
        dataStashCount: 0,
        probesInSpace: 1,
        probeSpaceLimit: 1,
        completedMissionCount: 0,
        endGameCardCount: 0,
        creditIncome: 4,
        energyIncome: 3,
        cardIncome: 0,
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
        dataPoolCount: 5,
        dataPoolMax: 6,
        pieces: { probes: 1, orbiters: 1, landers: 2, signalMarkers: 4 },
        techs: [ETechId.SCAN_POP_SIGNAL],
        passed: false,
        movementPoints: 3,
        dataStashCount: 2,
        probesInSpace: 1,
        probeSpaceLimit: 1,
        completedMissionCount: 2,
        endGameCardCount: 1,
        creditIncome: 4,
        energyIncome: 3,
        cardIncome: 0,
      },
    ],
    solarSystem: {
      spaces: Array.from({ length: 32 }, (_, index) => `space-${index}`),
      adjacency: createAdjacencyMap(),
      probes,
      discs,
      spaceStates,
    },
    sectors: sectorOverrides ?? createSectorsFromSetup(setupConfig),
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
    cardRow,
    endOfRoundStacks: roundStacks,
    currentEndOfRoundStackIndex: 1,
    aliens: [],
    recentEvents: [],
    milestones: { goldMilestones: [], neutralMilestones: [] },
    goldScoringTiles: [],
    undoAllowed: false,
    canUndo: false,
    turnIndex: 0,
  };
}

export function GameDebugPage(): React.JSX.Element {
  const [scenario, setScenario] = useState<TDebugScenario>('my-turn');
  const [sourceMode, setSourceMode] = useState<TDebugSourceMode>('server');
  const [discAngles, setDiscAngles] = useState<TDiscAngles>([7, 3, 4]);
  const [debugWheels, setDebugWheels] = useState<TSolarSystemWheels>(
    createDefaultDebugWheels,
  );
  const [cardRowStartIndex, setCardRowStartIndex] = useState(0);
  const [handStartIndex, setHandStartIndex] = useState(18);
  const [cardInputMode, setCardInputMode] =
    useState<TCardInputDebugMode>('none');
  const [nextRotateRing, setNextRotateRing] = useState<1 | 2 | 3>(1);
  const [pushedProbeDelayMsByRing, setPushedProbeDelayMsByRing] = useState<
    Record<1 | 2 | 3, number>
  >({
    1: GAME_DEBUG_DEFAULTS.pushedProbeDelayMsByRing[1],
    2: GAME_DEBUG_DEFAULTS.pushedProbeDelayMsByRing[2],
    3: GAME_DEBUG_DEFAULTS.pushedProbeDelayMsByRing[3],
  });
  const [probeTransitionDelayById, setProbeTransitionDelayById] = useState<
    Record<string, number>
  >({});
  const [probeInsetPxByRing, setProbeInsetPxByRing] =
    useState<TProbeInsetPxByRing>({
      1: GAME_DEBUG_DEFAULTS.probeInsetPxByRing[1],
      2: GAME_DEBUG_DEFAULTS.probeInsetPxByRing[2],
      3: GAME_DEBUG_DEFAULTS.probeInsetPxByRing[3],
      4: GAME_DEBUG_DEFAULTS.probeInsetPxByRing[4],
    });

  const [sigRot0, setSigRot0] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigRot0,
  );
  const [sigX0, setSigX0] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigX0,
  );
  const [sigY0, setSigY0] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigY0,
  );
  const [sigRot1, setSigRot1] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigRot1,
  );
  const [sigX1, setSigX1] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigX1,
  );
  const [sigY1, setSigY1] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sigY1,
  );
  const [sectorDataSize, setSectorDataSize] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.sectorDataSize,
  );
  const [circleX0, setCircleX0] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.circleX0,
  );
  const [circleY0, setCircleY0] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.circleY0,
  );
  const [circleX1, setCircleX1] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.circleX1,
  );
  const [circleY1, setCircleY1] = useState<number>(
    GAME_DEBUG_DEFAULTS.sectorSignal.circleY1,
  );

  const [scanPhase, setScanPhase] = useState<TScanPhase>(SCAN_IDLE);
  const [debugSectors, setDebugSectors] = useState<
    IPublicGameState['sectors'] | null
  >(null);

  const clearProbeDelayTimerRef = useRef<number | null>(null);
  const debugProbeSeqRef = useRef(100);

  const launchDebugProbeToEarth = useCallback(
    (playerId: string) => {
      const probeId = `dbg-probe-${debugProbeSeqRef.current}`;
      debugProbeSeqRef.current += 1;
      setDebugWheels((prev) =>
        placeProbeOnPlanet(prev, discAngles, EPlanet.EARTH, playerId, probeId),
      );
    },
    [discAngles],
  );

  const rotateRing = (ring: 1 | 2 | 3): void => {
    setDiscAngles((prev) => {
      const next = nextDiscAnglesForRotation(prev, ring);
      setDebugWheels((prevWheels) => {
        const result = applyCoveragePushAfterRotation(
          prevWheels,
          prev,
          next,
          ring,
        );

        if (result.pushedProbeIds.length > 0) {
          const delayMs = pushedProbeDelayMsByRing[ring] ?? 0;
          const nextDelayById: Record<string, number> = {};
          for (const probeId of result.pushedProbeIds) {
            nextDelayById[probeId] = delayMs;
          }
          setProbeTransitionDelayById(nextDelayById);

          if (clearProbeDelayTimerRef.current !== null) {
            window.clearTimeout(clearProbeDelayTimerRef.current);
          }
          clearProbeDelayTimerRef.current = window.setTimeout(() => {
            setProbeTransitionDelayById({});
            clearProbeDelayTimerRef.current = null;
          }, delayMs + PUSHED_PROBE_DELAY_RESET_BASE_MS);
        }

        return result.wheels;
      });
      return next;
    });
  };

  const gameState = useMemo(
    () =>
      createDebugGameState(
        scenario,
        discAngles,
        debugWheels,
        probeTransitionDelayById,
        cardRowStartIndex,
        handStartIndex,
        debugSectors ?? undefined,
      ),
    [
      scenario,
      discAngles,
      debugWheels,
      probeTransitionDelayById,
      cardRowStartIndex,
      handStartIndex,
      debugSectors,
    ],
  );

  useEffect(() => {
    setDebugWheels(createDefaultDebugWheels());
    setProbeTransitionDelayById({});
    setDebugSectors(null);
    setScanPhase(SCAN_IDLE);
  }, [scenario]);

  useEffect(() => {
    return () => {
      if (clearProbeDelayTimerRef.current !== null) {
        window.clearTimeout(clearProbeDelayTimerRef.current);
      }
    };
  }, []);

  const startScan = useCallback(() => {
    const setupConfig = createDebugSetupConfig(discAngles, debugWheels);
    setDebugSectors((prev) => prev ?? createSectorsFromSetup(setupConfig));
    setScanPhase({
      step: 'pool',
      remaining: new Set(ALL_SCAN_SUB_ACTIONS),
    });
    setCardInputMode('none');
  }, [discAngles, debugWheels]);

  const goBackToPool = useCallback((remaining: Set<string>) => {
    if (remaining.size === 0) {
      setScanPhase(SCAN_IDLE);
    } else {
      setScanPhase({ step: 'pool', remaining });
    }
  }, []);

  const markAndReturn = useCallback(
    (sectorId: string, remaining: Set<string>) => {
      setDebugSectors((prev) => {
        if (!prev) return prev;
        return markSignalOnSectors(prev, sectorId, 'player-1');
      });
      goBackToPool(remaining);
    },
    [goBackToPool],
  );

  const markByCardColor = useCallback(
    (card: IBaseCard, remaining: Set<string>) => {
      const color = card.sector;
      if (!color) {
        goBackToPool(remaining);
        return;
      }
      const matching = findSectorsByColor(
        debugSectors ?? gameState.sectors,
        color,
      );
      if (matching.length === 0) {
        goBackToPool(remaining);
      } else if (matching.length === 1) {
        markAndReturn(matching[0], remaining);
      } else {
        setScanPhase({
          step: 'color-pick',
          remaining,
          color,
          sectorIds: matching,
        });
      }
    },
    [debugSectors, gameState.sectors, goBackToPool, markAndReturn],
  );

  const handleScanInput = useCallback(
    (response: IInputResponse) => {
      if (
        scanPhase.step === 'pool' &&
        response.type === EPlayerInputType.OPTION
      ) {
        const optionId = (response as { optionId: string }).optionId;
        const next = new Set(scanPhase.remaining);
        next.delete(optionId);

        switch (optionId) {
          case 'mark-earth':
            markAndReturn(
              getSectorIdByPlanet(gameState, EPlanet.EARTH) ?? 'sector-0',
              next,
            );
            break;
          case 'mark-mercury':
            markAndReturn(
              getSectorIdByPlanet(gameState, EPlanet.MERCURY) ?? 'sector-2',
              next,
            );
            break;
          case 'mark-card-row':
            setScanPhase({ step: 'card-row', remaining: next });
            break;
          case 'mark-hand':
            setScanPhase({ step: 'hand', remaining: next });
            break;
          case 'energy-launch-or-move':
            setScanPhase({ step: 'energy', remaining: next });
            break;
          case 'done':
          default:
            setScanPhase(SCAN_IDLE);
            break;
        }
        return;
      }

      if (
        scanPhase.step === 'card-row' &&
        response.type === EPlayerInputType.CARD
      ) {
        const cardIds = (response as { cardIds: string[] }).cardIds;
        const card = gameState.cardRow.find((c) => c.id === cardIds[0]);
        if (card) {
          markByCardColor(card, scanPhase.remaining);
        } else {
          goBackToPool(scanPhase.remaining);
        }
        return;
      }

      if (
        scanPhase.step === 'hand' &&
        response.type === EPlayerInputType.CARD
      ) {
        const cardIds = (response as { cardIds: string[] }).cardIds;
        const hand = gameState.players[0]?.hand ?? [];
        const rawId = cardIds[0]?.split('@')[0];
        const card = hand.find((c) => c.id === rawId);
        if (card) {
          markByCardColor(card, scanPhase.remaining);
        } else {
          goBackToPool(scanPhase.remaining);
        }
        return;
      }

      if (
        scanPhase.step === 'color-pick' &&
        response.type === EPlayerInputType.OPTION
      ) {
        const sectorId = (response as { optionId: string }).optionId;
        markAndReturn(sectorId, scanPhase.remaining);
        return;
      }

      if (
        scanPhase.step === 'energy' &&
        response.type === EPlayerInputType.OPTION
      ) {
        const optionId = (response as { optionId: string }).optionId;
        if (optionId === 'launch') {
          launchDebugProbeToEarth('player-1');
        }
        goBackToPool(scanPhase.remaining);
        return;
      }
    },
    [
      scanPhase,
      gameState,
      markAndReturn,
      markByCardColor,
      goBackToPool,
      launchDebugProbeToEarth,
    ],
  );

  const scanPlanetHintSectorIds = useMemo(() => {
    if (scanPhase.step === 'idle') {
      return [] as string[];
    }
    const earth = getSectorIdByPlanet(gameState, EPlanet.EARTH);
    const mercury = getSectorIdByPlanet(gameState, EPlanet.MERCURY);
    return [...new Set([earth, mercury].filter((id): id is string => !!id))];
  }, [scanPhase.step, gameState]);

  const pendingInput = useMemo<
    (IPlayerInputModel & { debugSectorHighlights?: string[] }) | null
  >(() => {
    if (scanPhase.step === 'pool') {
      const handLen = gameState.players[0]?.hand?.length ?? 0;
      const model = buildScanPoolInput(
        scanPhase.remaining,
        gameState.cardRow.length,
        handLen,
      );
      return {
        ...model,
        debugSectorHighlights: scanPlanetHintSectorIds,
      };
    }
    if (scanPhase.step === 'card-row') {
      const model = buildCardSelectInput('row', gameState.cardRow);
      return {
        ...model,
        debugSectorHighlights: scanPlanetHintSectorIds,
      };
    }
    if (scanPhase.step === 'hand') {
      const model = buildCardSelectInput(
        'hand',
        gameState.players[0]?.hand ?? [],
      );
      return {
        ...model,
        debugSectorHighlights: scanPlanetHintSectorIds,
      };
    }
    if (scanPhase.step === 'color-pick') {
      const model = buildColorPickInput(scanPhase.color, scanPhase.sectorIds);
      return {
        ...model,
        debugSectorHighlights: scanPlanetHintSectorIds,
      };
    }
    if (scanPhase.step === 'energy') {
      const model = buildEnergyInput();
      return {
        ...model,
        debugSectorHighlights: scanPlanetHintSectorIds,
      };
    }

    if (cardInputMode === 'hand-select') {
      const handCards = gameState.players[0]?.hand ?? [];
      return {
        inputId: 'debug-hand-select',
        type: EPlayerInputType.CARD,
        title: 'Debug Hand Select',
        cards: handCards,
        minSelections: 1,
        maxSelections: Math.min(2, handCards.length || 1),
      };
    }

    if (cardInputMode === 'row-select') {
      return {
        inputId: 'debug-row-select',
        type: EPlayerInputType.CARD,
        title: 'Debug Card Row Select',
        cards: gameState.cardRow,
        minSelections: 1,
        maxSelections: 1,
      };
    }

    if (cardInputMode === 'end-of-round') {
      const stackIndex = gameState.currentEndOfRoundStackIndex ?? 0;
      const cards = gameState.endOfRoundStacks?.[stackIndex] ?? [];
      return {
        inputId: 'debug-end-of-round',
        type: EPlayerInputType.END_OF_ROUND,
        title: 'Debug End Of Round',
        cards,
      };
    }

    return null;
  }, [scanPhase, cardInputMode, gameState, scanPlanetHintSectorIds]);

  const handleDebugInput = useCallback(
    (response: IInputResponse): void => {
      if (scanPhase.step !== 'idle') {
        handleScanInput(response);
        return;
      }
    },
    [scanPhase, handleScanInput],
  );

  const isServerMode = sourceMode === 'server';
  const isSpectator = !isServerMode && scenario === 'spectator';
  const myPlayerId = isSpectator ? 'spectator-0' : 'player-1';

  const handleDebugAction = useCallback(
    (action: IMainActionRequest) => {
      if (action.type !== EMainAction.LAUNCH_PROBE || isSpectator) {
        return;
      }
      launchDebugProbeToEarth(myPlayerId);
    },
    [isSpectator, launchDebugProbeToEarth, myPlayerId],
  );

  const handleDebugFreeAction = useCallback(
    (action: IFreeActionRequest) => {
      if (action.type === EFreeAction.MOVEMENT) {
        if (action.path.length < 2) {
          return;
        }

        setDebugWheels((prev) => {
          let wheels = prev;
          for (let i = 0; i < action.path.length - 1; i += 1) {
            const fromSpaceId = action.path[i];
            const toSpaceId = action.path[i + 1];
            if (!fromSpaceId || !toSpaceId) {
              return prev;
            }
            const reachableSpaces =
              gameState.solarSystem.adjacency[fromSpaceId] ?? [];
            if (!reachableSpaces.includes(toSpaceId)) {
              return prev;
            }

            const movedMine = moveVisibleProbe(
              wheels,
              discAngles,
              fromSpaceId,
              toSpaceId,
              myPlayerId,
            );
            wheels =
              movedMine !== wheels
                ? movedMine
                : moveVisibleProbe(wheels, discAngles, fromSpaceId, toSpaceId);
          }
          return wheels;
        });
        return;
      }

      if (action.type !== EFreeAction.BUY_CARD) {
        return;
      }

      if (action.fromDeck) {
        setHandStartIndex((prev) => (prev + 1) % ALL_CARDS.length);
        return;
      }

      if (action.cardId) {
        setCardRowStartIndex((prev) => (prev + 1) % ALL_CARDS.length);
        setHandStartIndex((prev) => (prev + 1) % ALL_CARDS.length);
      }
    },
    [discAngles, gameState.solarSystem.adjacency, myPlayerId],
  );

  const rotateByRuleOrder = (): void => {
    if (isServerMode && serverSession) {
      void serverSession.solarRotate(nextRotateRing - 1);
    } else {
      rotateRing(nextRotateRing);
    }
    setNextRotateRing((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
  };

  // ── Server-mode data source ────────────────────────────────────────────
  const serverSession = useServerDebugSession(isServerMode);

  const effectiveGameState = useMemo<IPublicGameState>(() => {
    if (isServerMode && serverSession?.gameState) {
      return serverSession.gameState;
    }
    return gameState;
  }, [isServerMode, serverSession?.gameState, gameState]);

  const effectiveMyPlayerId =
    isServerMode && serverSession?.viewerId
      ? serverSession.viewerId
      : myPlayerId;

  const handleAction: IGameContext['sendAction'] = useCallback(
    (action) => {
      if (isServerMode && serverSession) {
        // Sandbox: LAUNCH_PROBE maps to the direct place-probe endpoint so
        // it works regardless of the server-side turn/resources state.
        if (action.type === EMainAction.LAUNCH_PROBE) {
          const earthSpaceId = findPlanetSpaceId(
            effectiveGameState.solarSystem,
            EPlanet.EARTH,
          );
          if (earthSpaceId) {
            void serverSession.placeProbeOn(earthSpaceId);
            return;
          }
        }
        void serverSession.sendMainAction(action);
        return;
      }
      handleDebugAction(action);
    },
    [
      isServerMode,
      serverSession,
      effectiveGameState.solarSystem,
      handleDebugAction,
    ],
  );

  const handleFreeAction: IGameContext['sendFreeAction'] = useCallback(
    (action) => {
      if (isServerMode && serverSession) {
        if (action.type === EFreeAction.MOVEMENT) {
          // Resolve the probe currently sitting on the path's first space so
          // we can drive the direct move-probe sandbox endpoint.
          const fromSpaceId = action.path[0];
          const probe = effectiveGameState.solarSystem.probes.find(
            (p) =>
              p.spaceId === fromSpaceId && p.playerId === effectiveMyPlayerId,
          );
          if (!probe?.probeId) {
            void serverSession.sendFreeAction(action);
            return;
          }
          const probeId = probe.probeId;
          void (async () => {
            for (let i = 0; i < action.path.length - 1; i += 1) {
              const nextSpaceId = action.path[i + 1];
              if (!nextSpaceId) {
                return;
              }
              await serverSession.moveProbeTo(probeId, nextSpaceId);
            }
          })();
          return;
        }
        void serverSession.sendFreeAction(action);
        return;
      }
      handleDebugFreeAction(action);
    },
    [
      isServerMode,
      serverSession,
      effectiveGameState.solarSystem,
      effectiveMyPlayerId,
      handleDebugFreeAction,
    ],
  );

  const handleInput: IGameContext['sendInput'] = useCallback(
    (response) => {
      if (isServerMode && serverSession) {
        void serverSession.sendInput(response);
        return;
      }
      handleDebugInput(response);
    },
    [isServerMode, serverSession, handleDebugInput],
  );

  const handleEndTurn: IGameContext['sendEndTurn'] = useCallback(() => {
    if (isServerMode && serverSession) {
      void serverSession.sendEndTurn();
    }
  }, [isServerMode, serverSession]);

  const effectivePendingInput = isServerMode
    ? (serverSession?.pendingInput ?? null)
    : pendingInput;

  const contextValue = useMemo<IGameContext>(
    () => ({
      gameState: effectiveGameState,
      pendingInput: effectivePendingInput,
      isConnected: isServerMode ? !!serverSession?.gameState : true,
      isMyTurn: effectiveGameState.currentPlayerId === effectiveMyPlayerId,
      isSpectator,
      myPlayerId: effectiveMyPlayerId,
      events: [{ type: EGameEventType.ROUND_END, round: 2 }],
      sendAction: handleAction,
      sendFreeAction: handleFreeAction,
      sendEndTurn: handleEndTurn,
      sendInput: handleInput,
      requestUndo: () => undefined,
    }),
    [
      effectiveGameState,
      effectivePendingInput,
      isServerMode,
      serverSession?.gameState,
      effectiveMyPlayerId,
      isSpectator,
      handleAction,
      handleFreeAction,
      handleEndTurn,
      handleInput,
    ],
  );

  const sectorDebugVars = {
    '--sector-sig-rot-0': `${sigRot0}deg`,
    '--sector-sig-x-0': `${sigX0}px`,
    '--sector-sig-y-0': `${sigY0}px`,
    '--sector-sig-rot-1': `${sigRot1}deg`,
    '--sector-sig-x-1': `${sigX1}px`,
    '--sector-sig-y-1': `${sigY1}px`,
    '--sector-data-size': `${sectorDataSize}px`,
    '--sector-circle-x-0': `${circleX0}px`,
    '--sector-circle-y-0': `${circleY0}px`,
    '--sector-circle-x-1': `${circleX1}px`,
    '--sector-circle-y-1': `${circleY1}px`,
    '--sector-circle-size': '24px',
  } as React.CSSProperties;

  return (
    <GameContextValueProvider value={contextValue}>
      <div className='fixed right-3 top-3 z-50 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-end gap-2 rounded border border-surface-700/70 bg-surface-900/90 p-2 text-xs backdrop-blur'>
        <span className='font-mono text-text-500'>Debug</span>
        <Select
          value={sourceMode}
          onValueChange={(value) => setSourceMode(value as TDebugSourceMode)}
        >
          <SelectTrigger
            className='h-8 w-[140px] text-xs'
            title='Where game state comes from'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='local'>Source: Local</SelectItem>
            <SelectItem value='server'>Source: Server</SelectItem>
          </SelectContent>
        </Select>
        {sourceMode === 'server' && (
          <span className='font-mono text-[10px] text-text-400'>
            {serverSession?.isCreating
              ? 'Creating…'
              : serverSession?.gameId
                ? `Game ${serverSession.gameId.slice(0, 8)}`
                : 'idle'}
            {serverSession?.errorMessage ? (
              <span className='ml-1 text-rose-300'>
                · {serverSession.errorMessage}
              </span>
            ) : null}
          </span>
        )}
        {sourceMode === 'server' && (
          <button
            type='button'
            onClick={() => void serverSession?.createSession()}
            disabled={!serverSession || serverSession.isCreating}
            className='rounded border border-surface-700/60 bg-surface-800/60 px-2 py-1 text-text-200 transition-colors hover:bg-surface-700/70 disabled:opacity-50'
          >
            New Server Game
          </button>
        )}
        {!isServerMode && (
          <Select
            value={scenario}
            onValueChange={(value) => setScenario(value as TDebugScenario)}
          >
            <SelectTrigger className='h-8 w-[150px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='my-turn'>My Turn</SelectItem>
              <SelectItem value='opponent-turn'>Opponent Turn</SelectItem>
              <SelectItem value='spectator'>Spectator</SelectItem>
              <SelectItem value='game-over'>Game Over</SelectItem>
            </SelectContent>
          </Select>
        )}

        {!isServerMode && (
          <Select
            value={cardInputMode}
            onValueChange={(value) =>
              setCardInputMode(value as TCardInputDebugMode)
            }
          >
            <SelectTrigger className='h-8 w-[170px] text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>No Input</SelectItem>
              <SelectItem value='hand-select'>Input: Hand Cards</SelectItem>
              <SelectItem value='row-select'>Input: Card Row</SelectItem>
              <SelectItem value='end-of-round'>Input: End Of Round</SelectItem>
            </SelectContent>
          </Select>
        )}

        {!isServerMode && (
          <div className='flex items-center gap-1 border-l border-surface-700 pl-2'>
            <button
              type='button'
              onClick={() =>
                setCardRowStartIndex((prev) => (prev + 3) % ALL_CARDS.length)
              }
              className='rounded border border-surface-700/60 bg-surface-800/60 px-2 py-1 text-text-200 transition-colors hover:bg-surface-700/70'
            >
              Next Row
            </button>
            <button
              type='button'
              onClick={() =>
                setHandStartIndex((prev) => (prev + 2) % ALL_CARDS.length)
              }
              className='rounded border border-surface-700/60 bg-surface-800/60 px-2 py-1 text-text-200 transition-colors hover:bg-surface-700/70'
            >
              Next Hand
            </button>
            {scanPhase.step === 'idle' ? (
              <button
                type='button'
                onClick={startScan}
                className='rounded border border-teal-500/60 bg-teal-500/15 px-2 py-1 text-teal-200 transition-colors hover:bg-teal-500/25'
              >
                Start Scan
              </button>
            ) : (
              <button
                type='button'
                onClick={() => setScanPhase(SCAN_IDLE)}
                className='rounded border border-rose-500/60 bg-rose-500/15 px-2 py-1 text-rose-200 transition-colors hover:bg-rose-500/25'
              >
                Cancel Scan ({scanPhase.step})
              </button>
            )}
          </div>
        )}

        <div className='flex items-center gap-1 border-l border-surface-700 pl-2'>
          <button
            type='button'
            onClick={rotateByRuleOrder}
            className='rounded border border-accent-500/60 bg-accent-500/15 px-2 py-1 text-accent-200 transition-colors hover:bg-accent-500/25'
            title='Rotate based on game rule order: ring 1 -> ring 2 -> ring 3'
          >
            Rotate (R{nextRotateRing})
          </button>
          <button
            type='button'
            onClick={() =>
              sourceMode === 'server' && serverSession
                ? void serverSession.solarRotate(0)
                : rotateRing(1)
            }
            className='rounded border border-amber-700/60 bg-amber-900/40 px-2 py-1 text-amber-200 transition-colors hover:bg-amber-800/50'
            title='Ring 1 only rotates'
          >
            Rotate R1
          </button>
          <button
            type='button'
            onClick={() =>
              sourceMode === 'server' && serverSession
                ? void serverSession.solarRotate(1)
                : rotateRing(2)
            }
            className='rounded border border-sky-700/60 bg-sky-900/40 px-2 py-1 text-sky-200 transition-colors hover:bg-sky-800/50'
            title='Ring 2 carries Ring 1'
          >
            Rotate R2
          </button>
          <button
            type='button'
            onClick={() =>
              sourceMode === 'server' && serverSession
                ? void serverSession.solarRotate(2)
                : rotateRing(3)
            }
            className='rounded border border-emerald-700/60 bg-emerald-900/40 px-2 py-1 text-emerald-200 transition-colors hover:bg-emerald-800/50'
            title='Ring 3 carries Ring 2 and Ring 1'
          >
            Rotate R3
          </button>
        </div>

        <div className='flex items-center gap-2 border-l border-surface-700 pl-2'>
          {([1, 2, 3] as const).map((ring) => (
            <label
              key={`push-delay-ring-${ring}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
              title={`Delay for pushed probes when rotating ring ${ring}`}
            >
              D{ring}
              <input
                type='range'
                min={GAME_DEBUG_RANGES.pushedProbeDelayMs.min}
                max={GAME_DEBUG_RANGES.pushedProbeDelayMs.max}
                step={GAME_DEBUG_RANGES.pushedProbeDelayMs.step}
                value={pushedProbeDelayMsByRing[ring]}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setPushedProbeDelayMsByRing((prev) => ({
                    ...prev,
                    [ring]: nextValue,
                  }));
                }}
                className='w-16 accent-accent-500'
              />
              <span className='w-8 text-right text-text-500'>
                {pushedProbeDelayMsByRing[ring]}
              </span>
            </label>
          ))}

          {([1, 2, 3, 4] as const).map((ring) => (
            <label
              key={`probe-inset-ring-${ring}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
              title={`Probe inset for wheel ${ring}`}
            >
              R{ring}
              <input
                type='range'
                min={GAME_DEBUG_RANGES.probeInsetPx.min}
                max={GAME_DEBUG_RANGES.probeInsetPx.max}
                step={GAME_DEBUG_RANGES.probeInsetPx.step}
                value={probeInsetPxByRing[ring]}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setProbeInsetPxByRing((prev) => ({
                    ...prev,
                    [ring]: nextValue,
                  }));
                }}
                className='w-16 accent-accent-500'
              />
              <span className='w-6 text-right text-text-500'>
                {probeInsetPxByRing[ring]}
              </span>
            </label>
          ))}
        </div>

        <div className='flex w-full flex-wrap items-center gap-2 border-t border-surface-700 pt-2'>
          <span className='font-mono text-text-500'>Sig0</span>
          {(
            [
              [
                'Rot',
                GAME_DEBUG_RANGES.rotation.min,
                GAME_DEBUG_RANGES.rotation.max,
                sigRot0,
                setSigRot0,
              ],
              [
                'X',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                sigX0,
                setSigX0,
              ],
              [
                'Y',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                sigY0,
                setSigY0,
              ],
            ] as const
          ).map(([label, min, max, val, set]) => (
            <label
              key={`sig0-${label}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
            >
              {label}
              <input
                type='range'
                min={min}
                max={max}
                step={1}
                value={val}
                onChange={(e) =>
                  (set as (v: number) => void)(Number(e.target.value))
                }
                className='w-14 accent-accent-500'
              />
              <span className='w-8 text-right text-text-500'>{val}</span>
            </label>
          ))}

          <span className='ml-1 font-mono text-text-500'>Sig1</span>
          {(
            [
              [
                'Rot',
                GAME_DEBUG_RANGES.rotation.min,
                GAME_DEBUG_RANGES.rotation.max,
                sigRot1,
                setSigRot1,
              ],
              [
                'X',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                sigX1,
                setSigX1,
              ],
              [
                'Y',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                sigY1,
                setSigY1,
              ],
            ] as const
          ).map(([label, min, max, val, set]) => (
            <label
              key={`sig1-${label}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
            >
              {label}
              <input
                type='range'
                min={min}
                max={max}
                step={1}
                value={val}
                onChange={(e) =>
                  (set as (v: number) => void)(Number(e.target.value))
                }
                className='w-14 accent-accent-500'
              />
              <span className='w-8 text-right text-text-500'>{val}</span>
            </label>
          ))}

          <span className='ml-1 font-mono text-text-500'>Dot</span>
          <label className='flex items-center gap-1 font-mono text-[10px] text-text-300'>
            <input
              type='range'
              min={GAME_DEBUG_RANGES.sectorDataSize.min}
              max={GAME_DEBUG_RANGES.sectorDataSize.max}
              step={GAME_DEBUG_RANGES.sectorDataSize.step}
              value={sectorDataSize}
              onChange={(e) => setSectorDataSize(Number(e.target.value))}
              className='w-16 accent-accent-500'
            />
            <span className='w-6 text-right text-text-500'>
              {sectorDataSize}
            </span>
          </label>
        </div>

        <div className='flex w-full flex-wrap items-center gap-2 border-t border-surface-700/50 pt-1'>
          <span className='font-mono text-text-500'>Circle0</span>
          {(
            [
              [
                'X',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                circleX0,
                setCircleX0,
              ],
              [
                'Y',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                circleY0,
                setCircleY0,
              ],
            ] as const
          ).map(([label, min, max, val, set]) => (
            <label
              key={`c0-${label}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
            >
              {label}
              <input
                type='range'
                min={min}
                max={max}
                step={1}
                value={val}
                onChange={(e) =>
                  (set as (v: number) => void)(Number(e.target.value))
                }
                className='w-14 accent-accent-500'
              />
              <span className='w-8 text-right text-text-500'>{val}</span>
            </label>
          ))}

          <span className='ml-1 font-mono text-text-500'>Circle1</span>
          {(
            [
              [
                'X',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                circleX1,
                setCircleX1,
              ],
              [
                'Y',
                GAME_DEBUG_RANGES.offset.min,
                GAME_DEBUG_RANGES.offset.max,
                circleY1,
                setCircleY1,
              ],
            ] as const
          ).map(([label, min, max, val, set]) => (
            <label
              key={`c1-${label}`}
              className='flex items-center gap-1 font-mono text-[10px] text-text-300'
            >
              {label}
              <input
                type='range'
                min={min}
                max={max}
                step={1}
                value={val}
                onChange={(e) =>
                  (set as (v: number) => void)(Number(e.target.value))
                }
                className='w-14 accent-accent-500'
              />
              <span className='w-8 text-right text-text-500'>{val}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={sectorDebugVars}>
        <GameLayout
          probeInsetPxByRing={probeInsetPxByRing}
          allowMoveAnyProbe
        />
      </div>
    </GameContextValueProvider>
  );
}
