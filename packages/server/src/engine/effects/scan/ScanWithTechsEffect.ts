import type { ETechId } from '@seti/common/types/tech';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { IScanTechEffect } from '../../tech/ITech.js';
import { TechModifierQuery } from '../../tech/TechModifierQuery.js';
import type { IMarkSectorSignalResult } from './MarkSectorSignalEffect.js';
import { MarkSectorSignalEffect } from './MarkSectorSignalEffect.js';
import type { IScanEffectResult } from './ScanEffect.js';
import { ScanEffect } from './ScanEffect.js';
import {
  ScanEarthNeighborEffect,
  ScanEnergyLaunchEffect,
  ScanHandSignalEffect,
  ScanMercurySignalEffect,
} from './ScanTechEffects.js';

export interface IScanTechActivationResult {
  techId: ETechId;
  effectType: string;
  activated: boolean;
}

export interface IScanWithTechsResult {
  baseScan: IScanEffectResult;
  techActivations: IScanTechActivationResult[];
}

export interface IScanWithTechsOptions {
  earthSectorIndex?: number;
  mercurySectorIndex?: number;
  sectorCount?: number;
  onComplete?: (result: IScanWithTechsResult) => IPlayerInput | undefined;
}

/**
 * Composed effect: execute scan with all owned scan-tech enhancements.
 *
 * Flow:
 * 1. If player owns earth-neighbor tech → choose earth sector or adjacent
 * 2. Run base ScanEffect (earth signal + card row + target sector signal)
 * 3. Present remaining tech activations (mercury / hand / energy-launch)
 *    in player-chosen order; each is optional and may have a cost
 * 4. Fire `onComplete` when all activations are resolved or skipped
 *
 * When the player owns no scan techs, this falls back to plain ScanEffect.
 */
export class ScanWithTechsEffect {
  public static execute(
    player: IPlayer,
    game: IGame,
    options: IScanWithTechsOptions = {},
  ): IPlayerInput | undefined {
    const scanModifiers = TechModifierQuery.fromTechIds(
      player.techs,
    ).getScanModifiers();

    const result: IScanWithTechsResult = {
      baseScan: {
        earthSectorSignal: null,
        cardRowCard: null,
        targetSectorSignal: null,
      },
      techActivations: [],
    };

    if (scanModifiers.length === 0) {
      return ScanEffect.execute(player, game, {
        earthSectorIndex: options.earthSectorIndex,
        onComplete: (baseScanResult) => {
          result.baseScan = baseScanResult;
          return options.onComplete?.(result);
        },
      });
    }

    const earthNeighborMod = scanModifiers.find(
      (m) => m.effectType === 'earth-neighbor',
    );
    const additionalMods = scanModifiers.filter(
      (m) => m.effectType !== 'earth-neighbor',
    );

    if (earthNeighborMod) {
      return this.resolveEarthSectorWithTech(
        player,
        game,
        options,
        additionalMods,
        result,
      );
    }

    return this.executeBaseScanThenTechs(
      player,
      game,
      options.earthSectorIndex ?? 0,
      additionalMods,
      options,
      result,
    );
  }

  /**
   * Reusable helper: mark a signal on `primarySectorIndex`,
   * or let the player choose an alternative from `candidateIndexes`.
   *
   * When `candidateIndexes` has one entry, marks immediately (synchronous).
   * When multiple entries, presents a choice (interactive).
   */
  public static markSignalWithChoice(
    player: IPlayer,
    game: IGame,
    candidateIndexes: number[],
    options: {
      title?: string;
      onComplete?: (
        result: IMarkSectorSignalResult | null,
      ) => IPlayerInput | undefined;
    } = {},
  ): IPlayerInput | undefined {
    if (candidateIndexes.length === 0) {
      return options.onComplete?.(null);
    }

    if (candidateIndexes.length === 1) {
      const markResult = MarkSectorSignalEffect.markByIndex(
        player,
        game,
        candidateIndexes[0],
      );
      return options.onComplete?.(markResult);
    }

    return new SelectOption(
      player,
      candidateIndexes.map((idx) => ({
        id: `sector-${idx}`,
        label: `Sector ${idx}`,
        onSelect: () => {
          const markResult = MarkSectorSignalEffect.markByIndex(
            player,
            game,
            idx,
          );
          return options.onComplete?.(markResult);
        },
      })),
      options.title ?? 'Choose sector for signal',
    );
  }

  // --- Private orchestration steps ---

  private static resolveEarthSectorWithTech(
    player: IPlayer,
    game: IGame,
    options: IScanWithTechsOptions,
    additionalMods: IScanTechEffect[],
    result: IScanWithTechsResult,
  ): IPlayerInput {
    const earthIdx = options.earthSectorIndex ?? 0;
    const sectorCount = options.sectorCount ?? game.sectors.length;
    const [left, right] = ScanEarthNeighborEffect.getAdjacentSectorIndexes(
      earthIdx,
      sectorCount,
    );

    const candidates = [earthIdx, left, right];
    const uniqueCandidates = [...new Set(candidates)];

    return new SelectOption(
      player,
      uniqueCandidates.map((idx) => ({
        id: `sector-${idx}`,
        label:
          idx === earthIdx
            ? `Earth sector (${idx})`
            : `Adjacent sector (${idx})`,
        onSelect: () =>
          this.executeBaseScanThenTechs(
            player,
            game,
            idx,
            additionalMods,
            options,
            result,
          ),
      })),
      'Earth Look: choose sector for earth signal',
    );
  }

  private static executeBaseScanThenTechs(
    player: IPlayer,
    game: IGame,
    earthSectorIndex: number,
    additionalMods: IScanTechEffect[],
    options: IScanWithTechsOptions,
    result: IScanWithTechsResult,
  ): IPlayerInput | undefined {
    return ScanEffect.execute(player, game, {
      earthSectorIndex,
      onComplete: (baseScanResult) => {
        result.baseScan = baseScanResult;

        if (additionalMods.length === 0) {
          return options.onComplete?.(result);
        }

        return this.buildTechActivationMenu(
          player,
          game,
          [...additionalMods],
          options,
          result,
        );
      },
    });
  }

  private static buildTechActivationMenu(
    player: IPlayer,
    game: IGame,
    remainingMods: IScanTechEffect[],
    options: IScanWithTechsOptions,
    result: IScanWithTechsResult,
  ): IPlayerInput | undefined {
    const affordableMods = remainingMods.filter((mod) =>
      this.canActivateTech(player, mod),
    );

    if (affordableMods.length === 0) {
      for (const mod of remainingMods) {
        result.techActivations.push({
          techId: mod.techId,
          effectType: mod.effectType,
          activated: false,
        });
      }
      return options.onComplete?.(result);
    }

    return new SelectOption(
      player,
      [
        {
          id: 'done',
          label: 'Done (skip remaining scan techs)',
          onSelect: () => {
            for (const mod of remainingMods) {
              result.techActivations.push({
                techId: mod.techId,
                effectType: mod.effectType,
                activated: false,
              });
            }
            return options.onComplete?.(result);
          },
        },
        ...affordableMods.map((mod) => ({
          id: `tech-${mod.techId}`,
          label: this.formatTechLabel(mod),
          onSelect: () => {
            const remaining = remainingMods.filter(
              (m) => m.techId !== mod.techId,
            );
            return this.activateTechEffect(
              player,
              game,
              mod,
              remaining,
              options,
              result,
            );
          },
        })),
      ],
      'Activate scan tech effect',
    );
  }

  private static activateTechEffect(
    player: IPlayer,
    game: IGame,
    mod: IScanTechEffect,
    remainingMods: IScanTechEffect[],
    options: IScanWithTechsOptions,
    result: IScanWithTechsResult,
  ): IPlayerInput | undefined {
    const afterActivation = (): IPlayerInput | undefined => {
      result.techActivations.push({
        techId: mod.techId,
        effectType: mod.effectType,
        activated: true,
      });

      if (remainingMods.length === 0) {
        return options.onComplete?.(result);
      }
      return this.buildTechActivationMenu(
        player,
        game,
        remainingMods,
        options,
        result,
      );
    };

    switch (mod.effectType) {
      case 'mercury-signal':
        return this.executeMercurySignal(
          player,
          game,
          options,
          afterActivation,
        );
      case 'hand-signal':
        return ScanHandSignalEffect.execute(player, game, {
          onComplete: () => afterActivation(),
        });
      case 'energy-launch':
        return ScanEnergyLaunchEffect.execute(player, game, {
          onComplete: () => afterActivation(),
        });
      default:
        result.techActivations.push({
          techId: mod.techId,
          effectType: mod.effectType,
          activated: false,
        });
        if (remainingMods.length === 0) {
          return options.onComplete?.(result);
        }
        return this.buildTechActivationMenu(
          player,
          game,
          remainingMods,
          options,
          result,
        );
    }
  }

  private static executeMercurySignal(
    player: IPlayer,
    game: IGame,
    options: IScanWithTechsOptions,
    afterActivation: () => IPlayerInput | undefined,
  ): IPlayerInput | undefined {
    return ScanMercurySignalEffect.execute(player, game, {
      mercurySectorIndex: options.mercurySectorIndex ?? 0,
      onComplete: () => afterActivation(),
    });
  }

  private static canActivateTech(
    player: IPlayer,
    mod: IScanTechEffect,
  ): boolean {
    switch (mod.effectType) {
      case 'mercury-signal':
        return ScanMercurySignalEffect.canExecute(player);
      case 'hand-signal':
        return ScanHandSignalEffect.canExecute(player);
      case 'energy-launch':
        return true;
      default:
        return true;
    }
  }

  private static formatTechLabel(mod: IScanTechEffect): string {
    if (!mod.cost) return mod.description;
    const parts = Object.entries(mod.cost)
      .filter(([, v]) => v !== undefined && v > 0)
      .map(([k, v]) => `${v} ${k}`);
    return parts.length > 0
      ? `${mod.description} (cost: ${parts.join(', ')})`
      : mod.description;
  }
}
