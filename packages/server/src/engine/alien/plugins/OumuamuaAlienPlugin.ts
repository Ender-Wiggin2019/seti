import {
  OUMUAMUA_TILE_DATA_CAPACITY,
  OUMUAMUA_TRACE_COLORS,
  OUMUAMUA_TRACE_SLOT_DEFS,
  OUMUAMUA_TRACE_SLOT_PREFIX,
} from '@seti/common/constant/alienBoardConfig';
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
import {
  type ITraceSlot,
  isOumuamuaAlienBoard,
  type OumuamuaAlienBoard,
} from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

interface IOumuamuaMeta {
  spaceId: string;
  sectorId: string;
}

export interface IOumuamuaRuntimeState {
  meta: IOumuamuaMeta | null;
  tileDataRemaining: number;
  tileMarkerPlayerIds: string[];
}

export class OumuamuaAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.OUMUAMUA;

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board)) return undefined;
    if (this.getMeta(board) !== null) return undefined;

    const placement = this.placeOumuamuaPlanet(game);
    if (!placement) return undefined;

    board.oumuamuaTile = {
      spaceId: placement.spaceId,
      sectorId: placement.sectorId,
      dataRemaining: OUMUAMUA_TILE_DATA_CAPACITY,
      markerPlayerIds: [],
    };

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
    if (
      !slot.isDiscovery &&
      !slot.slotId.includes('overflow') &&
      !slot.slotId.includes(OUMUAMUA_TRACE_SLOT_PREFIX)
    ) {
      return false;
    }
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
    if (!isOumuamuaAlienBoard(board) || !board.discovered) {
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
    if (!isOumuamuaAlienBoard(board)) return;

    const tile = board.oumuamuaTile;
    if (!tile || tile.dataRemaining <= 0) return;

    player.pieces.deploy(EPieceType.SECTOR_MARKER);
    tile.markerPlayerIds.push(player.id);
    tile.dataRemaining -= 1;

    const currentSector = this.getCurrentSector(game);
    if (currentSector) {
      game.missionTracker.recordEvent({
        type: EMissionEventType.SIGNAL_PLACED,
        color: currentSector.color,
      });
    }

    const markerCount = tile.markerPlayerIds.length;
    if (markerCount === 1) {
      player.score += 1;
    } else if (markerCount === 3) {
      player.score += 2;
    }

    if (tile.dataRemaining <= 0) {
      this.resolveTileCompletion(game, board);
    }
  }

  public getRuntimeState(game: IGame): IOumuamuaRuntimeState | null {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board)) return null;

    return {
      meta: this.getMeta(board),
      tileDataRemaining: board.oumuamuaTile?.dataRemaining ?? 0,
      tileMarkerPlayerIds: [...(board.oumuamuaTile?.markerPlayerIds ?? [])],
    };
  }

  public getTileMarkerCountByPlayer(game: IGame, playerId: string): number {
    const board = game.alienState?.getBoardByType(EAlienType.OUMUAMUA);
    if (!isOumuamuaAlienBoard(board)) return 0;
    return (board.oumuamuaTile?.markerPlayerIds ?? []).filter(
      (id) => id === playerId,
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

  private getMeta(board: OumuamuaAlienBoard): IOumuamuaMeta | null {
    const tile = board.oumuamuaTile;
    if (!tile) return null;
    return {
      spaceId: tile.spaceId,
      sectorId: tile.sectorId,
    };
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

  private addTraceColumn(board: OumuamuaAlienBoard, color: ETrace): void {
    for (const def of OUMUAMUA_TRACE_SLOT_DEFS) {
      board.addTraceSlot({
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

  private resolveTileCompletion(game: IGame, board: OumuamuaAlienBoard): void {
    const tile = board.oumuamuaTile;
    if (!tile) return;

    const markerCountsByPlayer = new Map<string, number>();
    for (const playerId of tile.markerPlayerIds) {
      markerCountsByPlayer.set(
        playerId,
        (markerCountsByPlayer.get(playerId) ?? 0) + 1,
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
      player.gainExofossils(1);
    }

    tile.markerPlayerIds = [];
    tile.dataRemaining = OUMUAMUA_TILE_DATA_CAPACITY;
  }
}
