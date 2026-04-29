import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  availableTechsResearchedByOthers,
  takeTechWithoutPrintedBonus,
} from './baseTechCardUtils.js';

const CARD_ID = '81';

export class InternationalCollaborationCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          const techIds = availableTechsResearchedByOthers(
            context.player,
            game,
          );
          if (techIds.length === 0) return undefined;
          if (techIds.length === 1) {
            return takeTechWithoutPrintedBonus(
              context.player,
              game,
              techIds[0],
            );
          }

          return new SelectOption(
            context.player,
            techIds.map((techId) => ({
              id: techId,
              label: techId,
              onSelect: () =>
                takeTechWithoutPrintedBonus(context.player, game, techId),
            })),
            'Select a technology researched by another player',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
