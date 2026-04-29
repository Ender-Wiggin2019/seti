import { SelectCard } from '@/engine/input/SelectCard.js';
import { buildQuickMissionDef } from '@/engine/missions/buildMissionDef.js';
import type { IMissionDef } from '@/engine/missions/IMission.js';
import { MissionCard } from '../Card.js';
import type { ICardRuntimeContext } from '../ICard.js';
import { loadCardData } from '../loadCardData.js';
import {
  behaviorWithoutCustom,
  cardItemId,
  gainIncomeCornerResource,
  pushCoreAction,
} from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.28';
const HANDLED_CUSTOM_ID = 'sa.desc.card_28';

export class Restructuring extends MissionCard {
  public constructor() {
    super(loadCardData(CARD_ID), {
      behavior: behaviorWithoutCustom(CARD_ID, [HANDLED_CUSTOM_ID]),
    });
  }

  public override getMissionDef(): IMissionDef {
    return buildQuickMissionDef(CARD_ID, (player) => {
      return (
        player.resources.credits === 0 &&
        player.resources.energy === 0 &&
        player.hand.length === 0
      );
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): undefined {
    pushCoreAction(context.player, context.game, (game) => {
      const candidates = context.player.hand
        .map((card, index) => {
          const cardId = cardItemId(card);
          return cardId ? { id: `${cardId}@${index}`, cardId, index } : null;
        })
        .filter(
          (
            candidate,
          ): candidate is { id: string; cardId: string; index: number } =>
            candidate !== null,
        );

      if (candidates.length === 0) return undefined;

      return new SelectCard(
        context.player,
        {
          cards: candidates,
          minSelections: 0,
          maxSelections: candidates.length,
          onSelect: (selectedIds) => {
            const selected = new Set(selectedIds);
            const selectedCards = candidates
              .filter((candidate) => selected.has(candidate.id))
              .sort((left, right) => right.index - left.index);

            for (const candidate of selectedCards) {
              const [removed] = context.player.hand.splice(candidate.index, 1);
              const removedId = removed
                ? cardItemId(removed)
                : candidate.cardId;
              if (!removedId) continue;
              game.mainDeck.discard(removedId);
              gainIncomeCornerResource(context.player, game, removedId);
            }
            return undefined;
          },
        },
        'Discard cards for income corners',
      );
    });
    return undefined;
  }
}
