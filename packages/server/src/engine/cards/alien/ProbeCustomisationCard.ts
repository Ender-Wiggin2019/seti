import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { behaviorFromEffects, type IBehavior } from '../Behavior.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'ET.25';
const HANDLED_CUSTOM_IDS = new Set(['desc.et-25', 'Then']);

function behaviorWithoutHandledCustom(): IBehavior {
  const behavior = behaviorFromEffects(loadCardData(CARD_ID).effects);
  const custom = behavior.custom?.filter((id) => !HANDLED_CUSTOM_IDS.has(id));
  if (!custom || custom.length === 0) {
    const { custom: _custom, ...rest } = behavior;
    return rest;
  }
  return { ...behavior, custom };
}

export class ProbeCustomisation extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: behaviorWithoutHandledCustom() });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        () => this.createMovementPrompt(context),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }

  private createMovementPrompt(
    context: ICardRuntimeContext,
  ): ReturnType<ImmediateCard['play']> {
    if (context.player.exofossils < 1) return undefined;
    return new SelectOption(
      context.player,
      [
        {
          id: 'use-exofossil-gain-2-move',
          label: 'Spend 1 exofossil to gain 2 move',
          onSelect: () => {
            if (!context.player.spendExofossils(1)) return undefined;
            context.player.gainMove(2);
            return this.createMovementPrompt(context);
          },
        },
        {
          id: 'stop-use-exofossil-gain-2-move',
          label: 'Done',
          onSelect: () => undefined,
        },
      ],
      'Use exofossil to gain movement?',
    );
  }
}
