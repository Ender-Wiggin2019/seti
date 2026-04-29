import { ETrace } from '@seti/common/types/element';
import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

interface ILanderTarget {
  id: string;
  label: string;
  remove: () => void;
}

/**
 * Card No.84 - Sample Return.
 * Remove one of your landers from a planet or moon to mark a yellow trace.
 */
export class SampleReturnCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('84'), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const targets = this.findLanderTargets(context);
          if (targets.length === 0) return undefined;
          const chooseTarget = (target: ILanderTarget) => {
            target.remove();
            context.player.pieces.return(EPieceType.LANDER);
            return game.markTrace(ETrace.YELLOW, context.player.id);
          };

          if (targets.length === 1) {
            return chooseTarget(targets[0]);
          }

          return new SelectOption(
            context.player,
            targets.map((target) => ({
              id: target.id,
              label: target.label,
              onSelect: () => chooseTarget(target),
            })),
            'Choose lander to return',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private findLanderTargets(context: ICardRuntimeContext): ILanderTarget[] {
    const planetaryBoard = context.game.planetaryBoard;
    if (!planetaryBoard) return [];

    const targets: ILanderTarget[] = [];
    for (const [planet, state] of planetaryBoard.planets.entries()) {
      state.landingSlots.forEach((slot, index) => {
        if (slot.playerId !== context.player.id) return;
        targets.push({
          id: `${planet}-lander-${index}`,
          label: `${planet} lander`,
          remove: () => {
            state.landingSlots.splice(index, 1);
          },
        });
      });

      if (state.moonOccupant?.playerId === context.player.id) {
        targets.push({
          id: `${planet}-moon-lander`,
          label: `${planet} moon lander`,
          remove: () => {
            state.moonOccupant = null;
          },
        });
      }
    }

    return targets;
  }
}
