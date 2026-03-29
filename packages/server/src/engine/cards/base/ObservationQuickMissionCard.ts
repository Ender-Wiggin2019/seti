import {
  EStarName,
  type ISolarSystemSetupConfig,
  SECTOR_TILE_DEFINITIONS,
} from '@seti/common/constant/sectorSetup';
import {
  EEffectType,
  type Effect,
  type IBaseEffect,
} from '@seti/common/types/effect';
import { ESector } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const SIGNAL_COLORS = new Set<ESector>(Object.values(ESector));

function extractSignalEffect(effects: Effect[]): IBaseEffect | undefined {
  return effects.find(
    (effect): effect is IBaseEffect =>
      effect.effectType === EEffectType.BASE &&
      SIGNAL_COLORS.has(effect.type as ESector),
  );
}

function findSectorIdForStar(
  setup: ISolarSystemSetupConfig | null,
  starName: EStarName,
): string | undefined {
  if (!setup) return undefined;

  for (const placement of setup.tilePlacements) {
    const sectors = SECTOR_TILE_DEFINITIONS[placement.tileId].sectors;
    if (sectors[0].starName === starName) {
      return placement.sectorIds[0];
    }
    if (sectors[1].starName === starName) {
      return placement.sectorIds[1];
    }
  }

  return undefined;
}

/**
 * Observation quick-mission cards (37/39/41/43).
 *
 * Their printed DESC constrains signal placement to a specific nearby star.
 * This implementation resolves that star to the matching runtime sector id.
 */
export class ObservationQuickMissionCard extends MissionCard {
  private readonly starName: EStarName;

  public constructor(cardId: string, starName: EStarName) {
    super(loadCardData(cardId), { behavior: {} });
    this.starName = starName;
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<MissionCard['play']> {
    const signalEffect = extractSignalEffect(this.effects);
    if (!signalEffect) return undefined;

    const signalCount = signalEffect.value ?? 1;
    const signalColor = signalEffect.type as ESector;

    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const targetSectorId = findSectorIdForStar(
            game.solarSystemSetup,
            this.starName,
          );
          const targetSector = game.sectors.find(
            (sector) =>
              sector &&
              typeof sector === 'object' &&
              'id' in sector &&
              'markSignal' in sector &&
              (sector as { id: string }).id === targetSectorId,
          );

          for (let i = 0; i < signalCount; i += 1) {
            if (targetSector) {
              MarkSectorSignalEffect.markOnSector(
                context.player,
                targetSector as {
                  markSignal(playerId: string): {
                    dataGained: unknown;
                    vpGained: number;
                  };
                  id: string;
                  completed: boolean;
                },
              );
            } else {
              // Preserve legacy behavior if setup info is missing.
              MarkSectorSignalEffect.markByColor(
                context.player,
                game,
                signalColor,
              );
            }
          }

          return undefined;
        },
        EPriority.DEFAULT,
      ),
    );

    return undefined;
  }
}
