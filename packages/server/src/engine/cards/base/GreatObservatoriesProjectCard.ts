import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';
import { MarkSectorSignalEffect } from '@/engine/effects/index.js';
import type { IPlayerInput } from '@/engine/input/PlayerInput.js';
import { SelectOption } from '@/engine/input/SelectOption.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = '30';
const MAX_PROBES = 3;

interface IProbeSignalTarget {
  id: string;
  label: string;
  sectorIndex: number;
}

export class GreatObservatoriesProjectCard extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), { behavior: {} });
  }

  protected override bespokePlay(
    context: ICardRuntimeContext,
  ): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => buildProbeSignalPrompt(context, game, []),
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}

function buildProbeSignalPrompt(
  context: ICardRuntimeContext,
  game: ICardRuntimeContext['game'],
  selectedProbeIds: string[],
): IPlayerInput | undefined {
  const targets = collectProbeSignalTargets(context).filter(
    (target) => !selectedProbeIds.includes(target.id),
  );
  if (targets.length === 0 || selectedProbeIds.length >= MAX_PROBES) {
    return undefined;
  }

  return new SelectOption(
    context.player,
    [
      ...targets.map((target) => ({
        id: `probe-signal-${target.id}`,
        label: target.label,
        onSelect: () =>
          MarkSectorSignalEffect.markByIndexWithAlternatives(
            context.player,
            game,
            target.sectorIndex,
            () =>
              buildProbeSignalPrompt(context, game, [
                ...selectedProbeIds,
                target.id,
              ]),
          ),
      })),
      {
        id: 'finish-probe-signals',
        label: 'Finish',
        onSelect: () => undefined,
      },
    ],
    'Choose a probe sector to mark',
  );
}

function collectProbeSignalTargets(
  context: ICardRuntimeContext,
): IProbeSignalTarget[] {
  const solarSystem = context.game.solarSystem;
  if (!solarSystem) return [];

  const targets: IProbeSignalTarget[] = [];
  for (const space of solarSystem.spaces) {
    const sectorIndex = solarSystem.getSectorIndexOfSpace(space.id);
    if (sectorIndex === null) continue;
    for (const probe of space.occupants) {
      targets.push({
        id: probe.id,
        label: `${probe.playerId} probe in sector ${sectorIndex + 1}`,
        sectorIndex,
      });
    }
  }
  return targets;
}
