import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { EndGameScoringCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import { EMarkSource } from '../utils/Mark.js';

const CARD_ID = 'ET.24';
const HANDLED_CUSTOM_ID = 'desc.et-24';

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => id !== HANDLED_CUSTOM_ID);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class TerrainMapping extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: behaviorWithoutHandledCustom() });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<EndGameScoringCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          if (context.player.exofossils < 1) return undefined;
          return new SelectOption(
            context.player,
            [
              {
                id: 'use-exofossil-mark-any-signal',
                label: 'Spend 1 exofossil to mark any signal',
                onSelect: () => {
                  if (!context.player.spendExofossils(1)) return undefined;
                  return game.mark(EMarkSource.ANY, 1, context.player.id);
                },
              },
              {
                id: 'skip-use-exofossil-mark-any-signal',
                label: 'Skip',
                onSelect: () => undefined,
              },
            ],
            'Use exofossil for extra signal?',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
