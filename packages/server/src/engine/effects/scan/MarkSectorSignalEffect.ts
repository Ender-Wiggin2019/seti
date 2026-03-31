import type { EStarName } from '@seti/common/constant/sectorSetup';
import type { ESector } from '@seti/common/types/element';
import type { EPlanet } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import { EMissionEventType } from '../../missions/IMission.js';
import type { IPlayer } from '../../player/IPlayer.js';
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
  completed: boolean;
}

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
    sector: {
      markSignal(playerId: string): { dataGained: boolean };
      id: string;
      color: ESector;
      completed: boolean;
    },
  ): IMarkSectorSignalResult {
    const signalResult = sector.markSignal(player.id);
    game.missionTracker.recordEvent({
      type: EMissionEventType.SIGNAL_PLACED,
      color: sector.color,
    });
    if (signalResult.dataGained) {
      player.resources.gain({ data: 1 });
    }

    return {
      sectorId: sector.id,
      dataGained: signalResult.dataGained,
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

  /**
   * Mark the sector that a planet currently occupies on the solar system.
   *
   * The planet's angular wedge (0..7) maps directly to `game.sectors[index]`.
   * Returns null if the solar system is absent or the planet isn't found.
   */
  public static markByPlanet(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
  ): IMarkSectorSignalResult | null {
    if (!game.solarSystem) return null;
    const sectorIndex = getSectorIndexByPlanet(game.solarSystem, planet);
    if (sectorIndex === null) return null;
    return this.markByIndex(player, game, sectorIndex);
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
      const result = this.markOnSector(player, game, sectors[0]);
      return onComplete?.(result);
    }

    return new SelectOption(
      player,
      sectors.map((sector) => ({
        id: sector.id,
        label: `Sector ${sector.id}`,
        onSelect: () => {
          const result = this.markOnSector(player, game, sector);
          return onComplete?.(result);
        },
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
}
