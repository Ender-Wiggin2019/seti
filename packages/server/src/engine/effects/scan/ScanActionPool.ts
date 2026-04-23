import { EPlanet } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { IScanTechEffect } from '../../tech/ITech.js';
import { TechModifierQuery } from '../../tech/TechModifierQuery.js';
import type { ICardRowCardInfo } from '../cardRow/SelectCardFromCardRowEffect.js';
import { SelectCardFromCardRowEffect } from '../cardRow/SelectCardFromCardRowEffect.js';
import { MarkSectorSignalEffect } from './MarkSectorSignalEffect.js';
import {
  extractSectorColorFromCardItem,
  getSectorIndexByPlanet,
} from './ScanEffectUtils.js';
import {
  ScanEarthNeighborEffect,
  ScanEnergyLaunchEffect,
  ScanHandSignalEffect,
  ScanMercurySignalEffect,
} from './ScanTechEffects.js';

// ── Sub-action identifiers ────────────────────────────────────────────────

export enum EScanSubAction {
  MARK_EARTH = 'mark-earth',
  MARK_CARD_ROW = 'mark-card-row',
  MARK_MERCURY = 'mark-mercury',
  MARK_HAND = 'mark-hand',
  ENERGY_LAUNCH_OR_MOVE = 'energy-launch-or-move',
  /** UI-only: end scan without executing remaining sub-actions. */
  DONE = 'done',
}

// ── Result types ──────────────────────────────────────────────────────────

export interface IScanSubActionRecord {
  id: EScanSubAction;
  executed: boolean;
}

export interface IScanActionPoolResult {
  subActions: IScanSubActionRecord[];
}

export interface IScanActionPoolOptions {
  onComplete?: (result: IScanActionPoolResult) => IPlayerInput | undefined;
}

// ── Internal sub-action descriptor ────────────────────────────────────────

interface IScanSubActionDescriptor {
  id: EScanSubAction;
  label: string;
  canExecute: () => boolean;
  /**
   * Execute the sub-action. When the sub-action is fully resolved
   * (including any player interaction), call `onDone` to return to the pool.
   */
  execute: (onDone: () => IPlayerInput | undefined) => IPlayerInput | undefined;
}

// ── Main pool ─────────────────────────────────────────────────────────────

/**
 * Free-order scan action pool.
 *
 * After paying scan costs, the player enters "scan mode" and is presented
 * with a menu of available sub-actions. They may execute them in any order,
 * interleaving free actions between each. Each sub-action is one-shot —
 * removed from the pool after execution. The scan ends when the player
 * clicks "Done" or all sub-actions have been consumed.
 *
 * Sub-actions:
 *   • Mark Earth          — auto-mark (or choose earth/adjacent with tech)
 *   • Mark Card Row       — interactive: pick card → discard → mark by color
 *   • Mark Mercury        — auto-mark mercury sector (tech, costs 1 publicity)
 *   • Mark Hand           — interactive: pick hand card → discard → mark by color (tech)
 *   • Energy Launch/Move  — interactive: choose launch or movement (tech)
 */
export class ScanActionPool {
  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanActionPoolOptions = {},
  ): IPlayerInput | undefined {
    const descriptors = this.buildSubActions(player, game);
    const result: IScanActionPoolResult = { subActions: [] };
    return this.presentPool(player, game, descriptors, result, options);
  }

  // ── Pool loop ─────────────────────────────────────────────────────────

  private static presentPool(
    player: IPlayer,
    game: IGame,
    remaining: IScanSubActionDescriptor[],
    result: IScanActionPoolResult,
    options: IScanActionPoolOptions,
  ): IPlayerInput | undefined {
    const affordable = remaining.filter((d) => d.canExecute());

    if (affordable.length === 0) {
      for (const d of remaining) {
        result.subActions.push({ id: d.id, executed: false });
      }
      return options.onComplete?.(result);
    }

    const menuOptions = affordable.map((descriptor) => ({
      id: descriptor.id,
      label: descriptor.label,
      onSelect: () => {
        const next = remaining.filter((d) => d.id !== descriptor.id);
        return descriptor.execute(() => {
          result.subActions.push({ id: descriptor.id, executed: true });
          return this.presentPool(player, game, next, result, options);
        });
      },
    }));

    // Rule: marking the earth sector is mandatory on every Scan — do not
    // offer Done until MARK_EARTH has been executed.
    const markEarthPending = remaining.some(
      (d) => d.id === EScanSubAction.MARK_EARTH,
    );
    if (!markEarthPending) {
      menuOptions.push({
        id: EScanSubAction.DONE,
        label: 'Done (end scan)',
        onSelect: () => {
          for (const d of remaining) {
            result.subActions.push({ id: d.id, executed: false });
          }
          return options.onComplete?.(result);
        },
      });
    }

    return new SelectOption(player, menuOptions, 'Scan: choose sub-action');
  }

  // ── Build sub-action descriptors ──────────────────────────────────────

  private static buildSubActions(
    player: IPlayer,
    game: IGame,
  ): IScanSubActionDescriptor[] {
    const scanModifiers = TechModifierQuery.fromTechIds(
      player.techs,
    ).getScanModifiers();

    const hasEarthNeighbor = scanModifiers.some(
      (m) => m.effectType === 'earth-neighbor',
    );
    const mercuryMod = scanModifiers.find(
      (m) => m.effectType === 'mercury-signal',
    );
    const handMod = scanModifiers.find((m) => m.effectType === 'hand-signal');
    const energyMod = scanModifiers.find(
      (m) => m.effectType === 'energy-launch',
    );

    const descriptors: IScanSubActionDescriptor[] = [];

    descriptors.push(this.buildMarkEarth(player, game, hasEarthNeighbor));
    descriptors.push(this.buildMarkCardRow(player, game));

    if (mercuryMod) {
      descriptors.push(this.buildMarkMercury(player, game, mercuryMod));
    }
    if (handMod) {
      descriptors.push(this.buildMarkHand(player, game));
    }
    if (energyMod) {
      descriptors.push(this.buildEnergyLaunchOrMove(player, game));
    }

    return descriptors;
  }

  // ── Individual sub-action builders ────────────────────────────────────

  private static buildMarkEarth(
    player: IPlayer,
    game: IGame,
    hasEarthNeighborTech: boolean,
  ): IScanSubActionDescriptor {
    return {
      id: EScanSubAction.MARK_EARTH,
      label: hasEarthNeighborTech ? 'Mark Earth or Adjacent' : 'Mark Earth',
      canExecute: () => true,
      execute: (onDone) => {
        if (!hasEarthNeighborTech) {
          return this.markPlanet(player, game, EPlanet.EARTH, onDone);
        }
        return this.markEarthWithNeighborChoice(player, game, onDone);
      },
    };
  }

  private static buildMarkCardRow(
    player: IPlayer,
    game: IGame,
  ): IScanSubActionDescriptor {
    return {
      id: EScanSubAction.MARK_CARD_ROW,
      label: 'Mark Card Row',
      canExecute: () => game.cardRow.length > 0,
      execute: (onDone) =>
        SelectCardFromCardRowEffect.execute(player, game, {
          destination: 'discard',
          onComplete: (cardInfo: ICardRowCardInfo) => {
            const sectorColor = extractSectorColorFromCardItem(
              cardInfo.rawItem,
            );
            if (sectorColor) {
              return MarkSectorSignalEffect.markByColor(
                player,
                game,
                sectorColor,
                () => onDone(),
              );
            }
            return onDone();
          },
        }),
    };
  }

  private static buildMarkMercury(
    player: IPlayer,
    game: IGame,
    _mod: IScanTechEffect,
  ): IScanSubActionDescriptor {
    return {
      id: EScanSubAction.MARK_MERCURY,
      label: 'Mark Mercury (1 publicity)',
      canExecute: () => ScanMercurySignalEffect.canExecute(player),
      execute: (onDone) => {
        const mercuryIndex = this.resolvePlanetIndex(game, EPlanet.MERCURY);
        return ScanMercurySignalEffect.execute(player, game, {
          mercurySectorIndex: mercuryIndex,
          onComplete: () => onDone(),
        });
      },
    };
  }

  private static buildMarkHand(
    player: IPlayer,
    game: IGame,
  ): IScanSubActionDescriptor {
    return {
      id: EScanSubAction.MARK_HAND,
      label: 'Mark Hand Signal',
      canExecute: () => ScanHandSignalEffect.canExecute(player),
      execute: (onDone) =>
        ScanHandSignalEffect.execute(player, game, {
          onComplete: () => onDone(),
        }),
    };
  }

  private static buildEnergyLaunchOrMove(
    player: IPlayer,
    game: IGame,
  ): IScanSubActionDescriptor {
    return {
      id: EScanSubAction.ENERGY_LAUNCH_OR_MOVE,
      label: 'Energy Launch or Move',
      canExecute: () => true,
      execute: (onDone) =>
        ScanEnergyLaunchEffect.execute(player, game, {
          onComplete: () => onDone(),
        }),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private static markPlanet(
    player: IPlayer,
    game: IGame,
    planet: EPlanet,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    if (game.solarSystem) {
      const sectorIndex = getSectorIndexByPlanet(game.solarSystem, planet);
      if (sectorIndex === null) {
        return onDone();
      }
      return MarkSectorSignalEffect.markByIndexWithAlternatives(
        player,
        game,
        sectorIndex,
        () => onDone(),
      );
    }
    return MarkSectorSignalEffect.markByIndexWithAlternatives(
      player,
      game,
      0,
      () => onDone(),
    );
  }

  private static resolvePlanetIndex(game: IGame, planet: EPlanet): number {
    if (!game.solarSystem) return 0;
    return getSectorIndexByPlanet(game.solarSystem, planet) ?? 0;
  }

  /**
   * Earth-neighbor tech: let the player choose earth's sector or an adjacent one.
   */
  private static markEarthWithNeighborChoice(
    player: IPlayer,
    game: IGame,
    onDone: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    const earthIndex = this.resolvePlanetIndex(game, EPlanet.EARTH);
    const sectorCount = game.sectors.length;
    const [left, right] = ScanEarthNeighborEffect.getAdjacentSectorIndexes(
      earthIndex,
      sectorCount,
    );

    const candidates = [...new Set([earthIndex, left, right])];

    if (candidates.length <= 1) {
      MarkSectorSignalEffect.markByIndex(player, game, earthIndex);
      return onDone();
    }

    return new SelectOption(
      player,
      candidates.map((idx) => ({
        id: `sector-${idx}`,
        label:
          idx === earthIndex
            ? `Earth sector (${idx})`
            : `Adjacent sector (${idx})`,
        onSelect: () => {
          return MarkSectorSignalEffect.markByIndexWithAlternatives(
            player,
            game,
            idx,
            () => onDone(),
          );
        },
      })),
      'Earth Look: choose sector for earth signal',
    );
  }
}
