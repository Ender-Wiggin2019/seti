import {
  createSolarSystemWheelsWithOumuamua,
  getOumuamuaSolarSystemSpaceId,
} from '@seti/common/constant/sectorSetup';
import type { ESector } from '@seti/common/types/element';
import { EAlienType, EPlanet, ETrace } from '@seti/common/types/protocol/enums';
import type { IMarkSectorSignalResult } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import { EMissionEventType } from '../../missions/IMission.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EPieceType } from '../../player/Pieces.js';
import type { AlienBoard, ITraceSlot } from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const OUMUAMUA_META_PREFIX = 'oumuamua-meta';
const OUMUAMUA_TILE_MARKERS = 'oumuamua-tile-markers';
const OUMUAMUA_TILE_DATA = 'oumuamua-tile-data';
const OUMUAMUA_EXOFOSSIL_SUPPLY = 'oumuamua-exofossil-supply';
const OUMUAMUA_TRACE_SLOT_PREFIX = 'oumuamua-trace';
const OUMUAMUA_TILE_DATA_CAPACITY = 3;
const OUMUAMUA_EXOFOSSIL_SUPPLY_CAPACITY = 20;
const OUMUAMUA_TRACE_COLORS: readonly ETrace[] = [
  ETrace.RED,
  ETrace.YELLOW,
  ETrace.BLUE,
];

interface IOumuamuaMeta {
  spaceId: string;
  sectorId: string;
}

export interface IOumuamuaRuntimeState {
  meta: IOumuamuaMeta | null;
  tileDataRemaining: number;
  tileMarkerPlayerIds: string[];
  exofossilSupplyRemaining: number;
}

export class OumuamuaAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.OUMUAMUA;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) return undefined;
    if (this.getMeta(board) !== null) return undefined;

    const placement = this.placeOumuamuaPlanet(game);
    if (!placement) return undefined;

    board.addSlot({
      slotId: `alien-${board.alienIndex}-${OUMUAMUA_META_PREFIX}|${placement.spaceId}|${placement.sectorId}`,
      alienIndex: board.alienIndex,
      traceColor: ETrace.ANY,
      maxOccupants: 0,
      rewards: [],
      isDiscovery: false,
    });

    board.addSlot({
      slotId: `alien-${board.alienIndex}-${OUMUAMUA_TILE_MARKERS}`,
      alienIndex: board.alienIndex,
      traceColor: ETrace.ANY,
      maxOccupants: -1,
      rewards: [],
      isDiscovery: false,
    });

    board.addSlot({
      slotId: `alien-${board.alienIndex}-${OUMUAMUA_TILE_DATA}`,
      alienIndex: board.alienIndex,
      traceColor: ETrace.ANY,
      maxOccupants: -1,
      occupants: Array.from({ length: OUMUAMUA_TILE_DATA_CAPACITY }, () => ({
        source: 'neutral' as const,
        traceColor: ETrace.ANY,
      })),
      rewards: [],
      isDiscovery: false,
    });

    board.addSlot({
      slotId: `alien-${board.alienIndex}-${OUMUAMUA_EXOFOSSIL_SUPPLY}`,
      alienIndex: board.alienIndex,
      traceColor: ETrace.ANY,
      maxOccupants: -1,
      occupants: Array.from(
        { length: OUMUAMUA_EXOFOSSIL_SUPPLY_CAPACITY },
        () => ({
          source: 'neutral' as const,
          traceColor: ETrace.ANY,
        }),
      ),
      rewards: [],
      isDiscovery: false,
    });

    for (const color of OUMUAMUA_TRACE_COLORS) {
      this.addTraceColumn(board, color);
    }

    const playerIdsOnSpace =
      game.solarSystem
        ?.getProbesAt(placement.spaceId)
        .map((probe) => probe.playerId) ?? [];
    for (const playerId of new Set(playerIdsOnSpace)) {
      const player = game.players.find(
        (candidate) => candidate.id === playerId,
      );
      player?.resources.gain({ publicity: 1 });
    }

    return undefined;
  }

  public canPlaceTraceOnSlot(
    _game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): boolean {
    const cost = this.parseTraceSlotCost(slot.slotId);
    if (cost <= 0) return true;
    return player.exofossils >= cost;
  }

  public onPlaceTraceOnSlot(
    _game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): void {
    const cost = this.parseTraceSlotCost(slot.slotId);
    if (cost <= 0) return;
    player.spendExofossils(cost);
  }

  public createSectorOrTileSignalInput(
    player: IPlayer,
    game: IGame,
    sectorId: string,
    markSector: () => IMarkSectorSignalResult,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board || !board.discovered) {
      const result = markSector();
      return onComplete?.(result);
    }

    const currentSector = this.getCurrentSector(game);
    if (!this.getMeta(board) || currentSector?.id !== sectorId) {
      const result = markSector();
      return onComplete?.(result);
    }

    return new SelectOption(
      player,
      [
        {
          id: 'oumuamua-sector',
          label: 'Mark sector',
          onSelect: () => {
            const result = markSector();
            return onComplete?.(result);
          },
        },
        {
          id: 'oumuamua-tile',
          label: 'Mark Oumuamua tile',
          onSelect: () => {
            this.markTileSignal(player, game);
            return onComplete?.(null);
          },
        },
      ],
      'Choose where to mark signal',
    );
  }

  public markTileSignal(player: IPlayer, game: IGame): void {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) return;

    const markerSlot = this.getMarkerSlot(board);
    const dataSlot = this.getDataSlot(board);
    if (!markerSlot || !dataSlot) return;
    if (dataSlot.occupants.length <= 0) return;

    player.pieces.deploy(EPieceType.SECTOR_MARKER);
    markerSlot.occupants.push({
      source: { playerId: player.id },
      traceColor: ETrace.ANY,
    });
    dataSlot.occupants.pop();

    const currentSector = this.getCurrentSector(game);
    if (currentSector) {
      game.missionTracker.recordEvent({
        type: EMissionEventType.SIGNAL_PLACED,
        color: currentSector.color,
      });
    }

    const markerCount = markerSlot.occupants.length;
    if (markerCount === 1) {
      player.score += 1;
    } else if (markerCount === 3) {
      player.score += 2;
    }

    if (dataSlot.occupants.length <= 0) {
      this.resolveTileCompletion(game, board);
    }
  }

  public getRuntimeState(game: IGame): IOumuamuaRuntimeState | null {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) return null;

    return {
      meta: this.getMeta(board),
      tileDataRemaining: this.getDataSlot(board)?.occupants.length ?? 0,
      tileMarkerPlayerIds: (this.getMarkerSlot(board)?.occupants ?? [])
        .map((occ) => (occ.source === 'neutral' ? null : occ.source.playerId))
        .filter((id): id is string => id !== null),
      exofossilSupplyRemaining:
        this.getSupplySlot(board)?.occupants.length ?? 0,
    };
  }

  public getTileMarkerCountByPlayer(game: IGame, playerId: string): number {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!board) return 0;
    const markerSlot = this.getMarkerSlot(board);
    if (!markerSlot) return 0;
    return markerSlot.occupants.filter(
      (occ) => occ.source !== 'neutral' && occ.source.playerId === playerId,
    ).length;
  }

  private placeOumuamuaPlanet(
    game: IGame,
  ): { spaceId: string; sectorId: string } | null {
    if (!game.solarSystem || game.sectors.length <= 0) return null;

    const ringRotation =
      game.solarSystem.discs[2]?.currentRotation ??
      game.solarSystemSetup?.initialDiscAngles[2] ??
      0;
    const spaceId = getOumuamuaSolarSystemSpaceId(ringRotation);
    const sectorIndex = game.solarSystem.getSectorIndexOfSpace(spaceId);
    if (sectorIndex === null) return null;

    const sector = game.sectors[sectorIndex];
    if (!sector) return null;

    if (game.solarSystemSetup) {
      game.solarSystemSetup = {
        ...game.solarSystemSetup,
        wheels: createSolarSystemWheelsWithOumuamua(
          game.solarSystemSetup.wheels,
        ),
      };
    }

    game.solarSystem.setDynamicPlanetAtSpace(EPlanet.OUMUAMUA, spaceId, {
      grantVisitPublicity: true,
    });

    return {
      spaceId,
      sectorId: sector.id,
    };
  }

  private getMeta(board: AlienBoard): IOumuamuaMeta | null {
    const metaSlot = board.slots.find((slot) =>
      slot.slotId.includes(OUMUAMUA_META_PREFIX),
    );
    if (!metaSlot) return null;
    const parts = metaSlot.slotId.split('|');
    if (parts.length !== 3) return null;
    return {
      spaceId: parts[1],
      sectorId: parts[2],
    };
  }

  private getMarkerSlot(board: AlienBoard): ITraceSlot | undefined {
    return board.slots.find((slot) =>
      slot.slotId.includes(OUMUAMUA_TILE_MARKERS),
    );
  }

  private getDataSlot(board: AlienBoard): ITraceSlot | undefined {
    return board.slots.find((slot) => slot.slotId.includes(OUMUAMUA_TILE_DATA));
  }

  private getSupplySlot(board: AlienBoard): ITraceSlot | undefined {
    return board.slots.find((slot) =>
      slot.slotId.includes(OUMUAMUA_EXOFOSSIL_SUPPLY),
    );
  }

  private getCurrentSector(game: IGame): { id: string; color: ESector } | null {
    const sectorIndex = game.solarSystem?.getSectorIndexOfPlanet(
      EPlanet.OUMUAMUA,
    );
    if (sectorIndex === undefined || sectorIndex === null) return null;
    const sector = game.sectors[sectorIndex];
    if (!sector) return null;
    return {
      id: sector.id,
      color: sector.color,
    };
  }

  private addTraceColumn(board: AlienBoard, color: ETrace): void {
    const defs: Array<{
      tierFromBottom: number;
      maxOccupants: number;
      exofossilCost: number;
      rewards: ITraceSlot['rewards'];
    }> = [
      {
        tierFromBottom: 1,
        maxOccupants: 1,
        exofossilCost: 4,
        rewards: [{ type: 'VP', amount: 25 }],
      },
      {
        tierFromBottom: 2,
        maxOccupants: 1,
        exofossilCost: 0,
        rewards: [
          { type: 'VP', amount: 3 },
          { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
        ],
      },
      {
        tierFromBottom: 3,
        maxOccupants: 1,
        exofossilCost: 0,
        rewards: [
          { type: 'VP', amount: 2 },
          { type: 'CUSTOM', effectId: 'DRAW_ALIEN_CARD' },
        ],
      },
      {
        tierFromBottom: 4,
        maxOccupants: 1,
        exofossilCost: 0,
        rewards: [
          { type: 'VP', amount: 3 },
          { type: 'CUSTOM', effectId: 'GAIN_EXOFOSSIL' },
          { type: 'PUBLICITY', amount: 1 },
        ],
      },
      {
        tierFromBottom: 5,
        maxOccupants: 1,
        exofossilCost: 0,
        rewards: [
          { type: 'VP', amount: 2 },
          { type: 'CUSTOM', effectId: 'GAIN_EXOFOSSIL' },
        ],
      },
      {
        tierFromBottom: 6,
        maxOccupants: -1,
        exofossilCost: 1,
        rewards: [{ type: 'VP', amount: 6 }],
      },
    ];

    for (const def of defs) {
      board.addSlot({
        slotId: this.buildTraceSlotId(
          board.alienIndex,
          color,
          def.tierFromBottom,
          def.exofossilCost,
        ),
        alienIndex: board.alienIndex,
        traceColor: color,
        maxOccupants: def.maxOccupants,
        rewards: def.rewards.map((reward) => ({ ...reward })),
        isDiscovery: false,
      });
    }
  }

  private buildTraceSlotId(
    alienIndex: number,
    color: ETrace,
    tierFromBottom: number,
    exofossilCost: number,
  ): string {
    return `alien-${alienIndex}-${OUMUAMUA_TRACE_SLOT_PREFIX}|${color}|${tierFromBottom}|${exofossilCost}`;
  }

  private parseTraceSlotCost(slotId: string): number {
    if (!slotId.includes(OUMUAMUA_TRACE_SLOT_PREFIX)) return 0;
    const parts = slotId.split('|');
    if (parts.length !== 4) return 0;
    const cost = Number(parts[3]);
    if (!Number.isInteger(cost) || cost <= 0) return 0;
    return cost;
  }

  private resolveTileCompletion(game: IGame, board: AlienBoard): void {
    const markerSlot = this.getMarkerSlot(board);
    const dataSlot = this.getDataSlot(board);
    const supplySlot = this.getSupplySlot(board);
    if (!markerSlot || !dataSlot) return;

    const markerCountsByPlayer = new Map<string, number>();
    for (const occupant of markerSlot.occupants) {
      if (occupant.source === 'neutral') continue;
      markerCountsByPlayer.set(
        occupant.source.playerId,
        (markerCountsByPlayer.get(occupant.source.playerId) ?? 0) + 1,
      );
    }

    for (const [playerId, markerCount] of markerCountsByPlayer.entries()) {
      const player = game.players.find(
        (candidate) => candidate.id === playerId,
      );
      if (!player) continue;
      const toReturn = Math.min(
        markerCount,
        player.pieces.deployed(EPieceType.SECTOR_MARKER),
      );
      for (let i = 0; i < toReturn; i += 1) {
        player.pieces.return(EPieceType.SECTOR_MARKER);
      }
      if (supplySlot && supplySlot.occupants.length > 0) {
        supplySlot.occupants.pop();
      }
      player.gainExofossils(1);
    }

    markerSlot.occupants = [];
    dataSlot.occupants = Array.from(
      { length: OUMUAMUA_TILE_DATA_CAPACITY },
      () => ({
        source: 'neutral',
        traceColor: ETrace.ANY,
      }),
    );
  }
}
