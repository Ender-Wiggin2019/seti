import { EStarName } from '@seti/common/constant/sectorSetup';
import {
  EEffectType,
  type Effect,
  type IBaseEffect,
} from '@seti/common/types/effect';
import { ESector } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/scan/MarkSectorSignalEffect.js';
import { findSectorIdByStarName } from '@/engine/effects/scan/ScanEffectUtils.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
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
          if (!findSectorIdByStarName(game.solarSystemSetup, this.starName)) {
            const colors = Array.from<ESector>({ length: signalCount }).fill(
              signalColor,
            );
            return MarkSectorSignalEffect.markByColorChain(
              context.player,
              game,
              colors,
            );
          }

          const markStarChain = (
            remaining: number,
          ): IPlayerInput | undefined => {
            if (remaining <= 0) return undefined;

            return MarkSectorSignalEffect.markByStarNameWithAlternatives(
              context.player,
              game,
              this.starName,
              () => markStarChain(remaining - 1),
            );
          };

          return markStarChain(signalCount);
        },
        EPriority.CORE_EFFECT,
      ),
    );

    return undefined;
  }
}
