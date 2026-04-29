import { SelectCard } from '@/engine/input/SelectCard.js';
import { ImmediateCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  cardItemId,
  pushCoreAction,
  unregisterMissionState,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.29';
const HANDLED_CUSTOM_ID = 'sa.desc.card_29';

export class AbandonedMission extends ImmediateCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const candidates = context.player.playedMissions
        .map((card, index) => ({ id: cardItemId(card), index }))
        .filter(
          (candidate): candidate is { id: string; index: number } =>
            candidate.id !== undefined,
        );

      if (candidates.length === 0) return undefined;

      return new SelectCard(
        context.player,
        {
          cards: candidates,
          minSelections: 1,
          maxSelections: 1,
          onSelect: ([selectedId]) => {
            const selected = candidates.find(
              (candidate) => candidate.id === selectedId,
            );
            if (!selected) return undefined;

            const [removed] = context.player.playedMissions.splice(
              selected.index,
              1,
            );
            if (removed !== undefined) {
              context.player.hand.push(removed);
            }
            unregisterMissionState(game, context.player.id, selected.id);
            context.player.resources.gain({ data: 2 });
            return undefined;
          },
        },
        'Return an unfinished mission',
      );
    });
    return undefined;
  }
}
