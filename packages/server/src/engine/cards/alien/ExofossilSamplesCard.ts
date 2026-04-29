import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'ET.28';
const HANDLED_CUSTOM_ID = 'desc.et-28';

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => id !== HANDLED_CUSTOM_ID);
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class ExofossilSamples extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: behaviorWithoutHandledCustom() });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => {
          if (context.player.exofossils < 1) return undefined;
          return new SelectOption(
            context.player,
            [
              {
                id: 'use-exofossil-gain-data',
                label: 'Spend 1 exofossil to gain 1 data',
                onSelect: () => {
                  if (!context.player.spendExofossils(1)) return undefined;
                  context.player.resources.gain({ data: 1 });
                  return undefined;
                },
              },
              {
                id: 'skip-use-exofossil-gain-data',
                label: 'Skip',
                onSelect: () => undefined,
              },
            ],
            'Use exofossil to gain data?',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
