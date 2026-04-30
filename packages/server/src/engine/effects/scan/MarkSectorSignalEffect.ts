import type { EStarName } from '@seti/common/constant/sectorSetup';
import type { ESector } from '@seti/common/types/element';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { AlienRegistry } from '../../alien/AlienRegistry.js';
import { OumuamuaAlienPlugin } from '../../alien/plugins/OumuamuaAlienPlugin.js';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import { EMissionEventType } from '../../missions/IMission.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EPieceType } from '../../player/Pieces.js';
import { emitSectorCompletedTurnEvent } from '../../turnEffects/TurnEffects.js';
import {
  findAllSectorsByColor,
  findSectorById,
  findSectorIdByStarName,
  getSectorAt,
  getSectorIndexByPlanet,
} from './ScanEffectUtils.js';

export interface IMarkSectorSignalResult {
  sectorId: string;
  dataGained: boolean;
  vpAwarded: number;
  completed: boolean;
}

type TSectorSignalTarget = {
  id: string;
  color: ESector;
  completed: boolean;
  markSignal(playerId: string): { dataGained: boolean; vpAwarded: number };
};

/**
 * Atomic + composed effect: mark a signal on a sector for a player.
 *
 * Resolution hierarchy (all paths lead to markOnSector):
 *
 *   markByColor(ESector)       → [interactive: pick sector] → markOnSector
 *   markByPlanet(EPlanet)      → [resolve planet→wedge]     → markByIndex
 *   markByStarName(EStarName)  → [resolve star→ID]          → markById
 *   markByIndex(number)        → [resolve index→sector]     → markOnSector
 *   markById(string)           → [resolve ID→sector]        → markOnSector
 *   markOnSector(sector)       → atomic mark + data reward
 */
export class MarkSectorSignalEffect {
  // ---------------------------------------------------------------------------
  // Level 0 — atomic (synchronous, no resolution)
  // ---------------------------------------------------------------------------

  public static markOnSector(
    player: IPlayer,
    game: IGame,
    sector: TSectorSignalTarget,
  ): IMarkSectorSignalResult {
    player.pieces.deploy(EPieceType.SECTOR_MARKER);
    const signalResult = sector.markSignal(player.id);
    game.missionTracker.recordEvent({
      type: EMissionEventType.SIGNAL_PLACED,
      color: sector.color,
    });
    if (signalResult.dataGained) {
      player.resources.gain({ data: 1 });
    }
    if (signalResult.vpAwarded > 0) {
      player.score += signalResult.vpAwarded;
    }
    if (sector.completed) {
      emitSectorCompletedTurnEvent(game, player, sector.id);
    }

    return {
      sectorId: sector.id,
      dataGained: signalResult.dataGained,
      vpAwarded: signalResult.vpAwarded,
      completed: sector.completed,
    };
  }

  // ---------------------------------------------------------------------------
  // Level 1 — synchronous resolution (unique target, no interaction)
  // ---------------------------------------------------------------------------

  public static markById(
    player: IPlayer,
    game: IGame,
    sectorId: string,
  ): IMarkSectorSignalResult | null {
    const sector = findSectorById(game, sectorId);
    if (!sector) return null;
    return this.markOnSector(player, game, sector);
  }

  public static markByIndex(
    player: IPlayer,
    game: IGame,
    sectorIndex: number,
  ): IMarkSectorSignalResult | null {
    const sector = getSectorAt(game, sectorIndex);
    if (!sector) return null;
    return this.markOnSector(player, game, sector);
  }

  public static markByStarName(
    player: IPlayer,
    game: IGame,
    starName: EStarName,
  ): IMarkSectorSignalResult | null {
    const sectorId = findSectorIdByStarName(game.solarSystemSetup, starName);
    if (!sectorId) return null;
    return this.markById(player, game, sectorId);
  }

  public static markByStarNameWithAlternatives(
    player: IPlayer,
    game: IGame,
    starName: EStarName,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const sectorId = findSectorIdByStarName(game.solarSystemSetup, starName);
    if (!sectorId) return onComplete?.(null);
    return this.markByIdWithAlternatives(player, game, sectorId, onComplete);
  }

  /**
   * Mark the sector that a planet currently occupies on the solar system.
   *
   * The planet's angular wedge (0..7) maps directly to `game.sectors[index]`.
   * Returns null if the solar system is absent or the planet isn't found.
   */
  public static markByPlanet(
    player: IPlayer,
    game: IGame,
    planet: Exclude<EPlanet, EPlanet.OUMUAMUA>,
  ): IMarkSectorSignalResult | null;
  public static markByPlanet(
    player: IPlayer,
    game: IGame,
    planet: EPlanet.OUMUAMUA,
  ): PlayerInput | IMarkSectorSignalResult | null;
  public static markByPlanet(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): PlayerInput | IMarkSectorSignalResult | null;
  public static markByPlanet(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): PlayerInput | IMarkSectorSignalResult | null {
    if (!game.solarSystem) return null;
    const sectorIndex = getSectorIndexByPlanet(game.solarSystem, planet);
    if (sectorIndex === null) return null;
    const sector = getSectorAt(game, sectorIndex);
    if (!sector) return null;
    if (planet === EPlanet.OUMUAMUA) {
      const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
      if (plugin instanceof OumuamuaAlienPlugin) {
        let syncResult: IMarkSectorSignalResult | null = null;
        const input = plugin.createSectorOrTileSignalInput(
          player,
          game,
          sector.id,
          () => this.markOnSector(player, game, sector),
          (result) => {
            syncResult = result;
            return undefined;
          },
        );
        return input ?? syncResult;
      }
    }
    return this.markOnSector(player, game, sector);
  }

  public static markByPlanetWithAlternatives(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (!game.solarSystem) return onComplete?.(null);
    const sectorIndex = getSectorIndexByPlanet(game.solarSystem, planet);
    if (sectorIndex === null) return onComplete?.(null);
    const sector = getSectorAt(game, sectorIndex);
    if (!sector) return onComplete?.(null);

    if (planet === EPlanet.OUMUAMUA) {
      const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
      if (plugin instanceof OumuamuaAlienPlugin) {
        return plugin.createSectorOrTileSignalInput(
          player,
          game,
          sector.id,
          () => this.markOnSector(player, game, sector),
          onComplete,
        );
      }
    }

    const result = this.markOnSector(player, game, sector);
    return onComplete?.(result);
  }

  public static markByIdWithAlternatives(
    player: IPlayer,
    game: IGame,
    sectorId: string,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const sector = findSectorById(game, sectorId);
    if (!sector) return onComplete?.(null);
    return this.markOnSectorWithAlternatives(player, game, sector, onComplete);
  }

  public static markOnSectorWithAlternatives(
    player: IPlayer,
    game: IGame,
    sector: TSectorSignalTarget,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    return this.markSectorWithOumuamuaChoice(player, game, sector, onComplete);
  }

  // ---------------------------------------------------------------------------
  // Level 2 — interactive (may require player input when ambiguous)
  // ---------------------------------------------------------------------------

  /**
   * Mark a signal on a sector of the given color.
   *
   * When multiple sectors share the color (standard setup: 2 per color),
   * the player is presented with a choice. After the mark resolves,
   * `onComplete` fires with the result so callers can chain further actions.
   */
  public static markByColor(
    player: IPlayer,
    game: IGame,
    color: ESector,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const sectors = findAllSectorsByColor(game, color);

    if (sectors.length === 0) {
      return onComplete?.(null);
    }

    if (sectors.length === 1) {
      return this.markSectorWithOumuamuaChoice(
        player,
        game,
        sectors[0],
        onComplete,
      );
    }

    return new SelectOption(
      player,
      sectors.map((sector) => ({
        id: sector.id,
        label: `Sector ${sector.id}`,
        onSelect: () =>
          this.markSectorWithOumuamuaChoice(player, game, sector, onComplete),
      })),
      `Choose ${color} sector to mark signal`,
    );
  }

  /**
   * Mark signals for a sequence of colors, chaining interactions.
   *
   * Each color is resolved via `markByColor` (potentially interactive).
   * The next color is only processed after the previous one resolves.
   */
  public static markByColorChain(
    player: IPlayer,
    game: IGame,
    colors: ESector[],
    onComplete?: () => PlayerInput | undefined,
  ): PlayerInput | undefined {
    if (colors.length === 0) {
      return onComplete?.();
    }
    return this.markByColor(player, game, colors[0], () =>
      this.markByColorChain(player, game, colors.slice(1), onComplete),
    );
  }

  public static markByIndexWithAlternatives(
    player: IPlayer,
    game: IGame,
    sectorIndex: number,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const sector = getSectorAt(game, sectorIndex);
    if (!sector) return onComplete?.(null);
    return this.markOnSectorWithAlternatives(player, game, sector, onComplete);
  }

  private static markSectorWithOumuamuaChoice(
    player: IPlayer,
    game: IGame,
    sector: TSectorSignalTarget,
    onComplete?: (
      result: IMarkSectorSignalResult | null,
    ) => PlayerInput | undefined,
  ): PlayerInput | undefined {
    const plugin = AlienRegistry.get(EAlienType.OUMUAMUA);
    if (plugin instanceof OumuamuaAlienPlugin) {
      return plugin.createSectorOrTileSignalInput(
        player,
        game,
        sector.id,
        () => this.markOnSector(player, game, sector),
        onComplete,
      );
    }

    const result = this.markOnSector(player, game, sector);
    return onComplete?.(result);
  }
}
