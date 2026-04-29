import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { RefillCardRowEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { EPieceType } from '@/engine/player/Pieces.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '15';

interface IOrbiterTarget {
  id: string;
  label: string;
  remove: () => void;
}

export class AtmosphericEntryCard extends ImmediateCard {
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
          const targets = findOrbiterTargets(context);
          if (targets.length === 0) return undefined;

          const resolveTarget = (target: IOrbiterTarget) => {
            target.remove();
            if (context.player.pieces.deployed(EPieceType.ORBITER) > 0) {
              context.player.pieces.return(EPieceType.ORBITER);
            }
            context.player.score += 3;
            context.player.resources.gain({ data: 1 });
            const drawn = game.mainDeck.drawWithReshuffle(game.random);
            if (drawn !== undefined) {
              context.player.hand.push(drawn);
              game.lockCurrentTurn();
            }
            RefillCardRowEffect.execute(game);
            return undefined;
          };

          if (targets.length === 1) {
            return resolveTarget(targets[0]);
          }

          return new SelectOption(
            context.player,
            targets.map((target) => ({
              id: target.id,
              label: target.label,
              onSelect: () => resolveTarget(target),
            })),
            'Choose orbiter to return',
          );
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function findOrbiterTargets(context: ICardRuntimeContext): IOrbiterTarget[] {
  const planetaryBoard = context.game.planetaryBoard;
  if (!planetaryBoard) return [];

  const targets: IOrbiterTarget[] = [];
  for (const [planet, state] of planetaryBoard.planets.entries()) {
    state.orbitSlots.forEach((slot, index) => {
      if (slot.playerId !== context.player.id) return;
      targets.push({
        id: `${planet}-orbiter-${index}`,
        label: `${planet} orbiter`,
        remove: () => {
          state.orbitSlots.splice(index, 1);
        },
      });
    });
  }

  return targets;
}
