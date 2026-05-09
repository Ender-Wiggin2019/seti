import { RIVAL_SPECIES_ACTION_CARD_BY_ALIEN } from '@seti/common/constant/solo';
import { rivalActionCards } from '@seti/common/data/rivalActionCards';
import { EPhase } from '@seti/common/types/protocol/enums';
import {
  ERivalActionKind,
  type IRivalActionCandidateDefinition,
  type IRivalActionCardDefinition,
  type TRivalActionCardId,
} from '@seti/common/types/protocol/solo';
import { createActionEvent } from '@/engine/event/GameEvent.js';
import type { Game } from '@/engine/Game.js';
import { RivalActionResolver } from './RivalActionResolver.js';
import { RivalResourceResolver } from './RivalResourceResolver.js';
import { RivalSetup } from './RivalSetup.js';

const RIVAL_ACTION_CARD_BY_ID = new Map<
  TRivalActionCardId,
  IRivalActionCardDefinition
>(rivalActionCards.map((card) => [card.id, card]));

export type TRivalTurnResult =
  | {
      kind: 'action';
      cardId: TRivalActionCardId;
      actionKind: ERivalActionKind;
    }
  | {
      kind: 'pass';
    };

interface IResolvedRivalActionCard {
  resolvedCardId: TRivalActionCardId;
  actionKind?: ERivalActionKind;
  removedCardId?: TRivalActionCardId;
}

export class RivalTurnController {
  public static resolveCurrentTurn(game: Game): TRivalTurnResult {
    const rivalState = game.rivalState;
    if (!rivalState) {
      throw new Error('Cannot resolve rival turn without rival state');
    }

    const rival = RivalSetup.getRivalPlayer(game);
    if (game.activePlayer.id !== rival.id) {
      throw new Error('Rival is not the active player');
    }

    if (rivalState.actionDeck.isEmpty()) {
      return this.resolvePass(game);
    }

    const cardId = rivalState.actionDeck.draw();
    if (!cardId) {
      return this.resolvePass(game);
    }

    const card = RIVAL_ACTION_CARD_BY_ID.get(cardId);
    if (!card) {
      throw new Error(`Unknown rival action card: ${cardId}`);
    }

    rivalState.currentActionCardId = cardId;
    RivalActionResolver.enterResolution(game);

    const resolved = this.resolveActionCard(game, card);
    if (resolved) {
      if (resolved.removedCardId) {
        rivalState.removedActionCardIds.push(resolved.removedCardId);
      }
      rivalState.actionDeck.discard(resolved.resolvedCardId);
      rivalState.usedActionCardIdsThisRound.push(resolved.resolvedCardId);
      if (resolved.actionKind) {
        game.eventLog.append(
          createActionEvent(rival.id, 'RIVAL_ACTION', {
            cardId: resolved.resolvedCardId,
            actionKind: resolved.actionKind,
            ...(resolved.removedCardId
              ? { removedCardId: resolved.removedCardId }
              : {}),
          }),
        );
      }
      this.finishTurn(game);
      if (resolved.actionKind) {
        return {
          kind: 'action',
          cardId: resolved.resolvedCardId,
          actionKind: resolved.actionKind,
        };
      }
      return { kind: 'pass' };
    }

    rivalState.actionDeck.discard(cardId);
    rivalState.usedActionCardIdsThisRound.push(cardId);
    this.finishTurn(game);
    return { kind: 'pass' };
  }

  private static resolveActionCard(
    game: Game,
    card: IRivalActionCardDefinition,
  ): IResolvedRivalActionCard | null {
    for (const candidate of card.candidates) {
      const replacement = this.resolveSpeciesReplacement(game, card, candidate);
      if (replacement) {
        return replacement;
      }

      if (
        RivalActionResolver.resolveCandidate(
          game,
          candidate,
          card.decisionDirection,
        )
      ) {
        return {
          resolvedCardId: card.id,
          actionKind: candidate.kind,
        };
      }
    }

    return null;
  }

  private static resolveSpeciesReplacement(
    game: Game,
    sourceCard: IRivalActionCardDefinition,
    candidate: IRivalActionCandidateDefinition,
  ): IResolvedRivalActionCard | null {
    if (
      candidate.kind !== ERivalActionKind.SPECIES_REPLACEMENT_CHECK ||
      candidate.alienIndex === undefined
    ) {
      return null;
    }

    const board = game.alienState.boards[candidate.alienIndex - 1];
    if (!board?.discovered) {
      return null;
    }

    const replacementCardId =
      RIVAL_SPECIES_ACTION_CARD_BY_ALIEN[board.alienType];
    if (!replacementCardId) {
      return null;
    }

    const replacementCard = RIVAL_ACTION_CARD_BY_ID.get(replacementCardId);
    if (!replacementCard) {
      throw new Error(
        `Unknown rival species replacement card: ${replacementCardId}`,
      );
    }

    const rivalState = game.rivalState;
    if (!rivalState) {
      throw new Error('Cannot replace rival action card without rival state');
    }
    rivalState.currentActionCardId = replacementCardId;
    const resolvedReplacement = this.resolveActionCard(game, replacementCard);
    return {
      resolvedCardId: replacementCardId,
      actionKind: resolvedReplacement?.actionKind,
      removedCardId: sourceCard.id,
    };
  }

  private static resolvePass(game: Game): TRivalTurnResult {
    const rival = RivalSetup.getRivalPlayer(game);
    RivalActionResolver.enterResolution(game);

    const stack = game.endOfRoundStacks[game.roundRotationReminderIndex];
    if (stack?.length > 0) {
      stack.shift();
      RivalResourceResolver.gainProgress(game, 1);
    }

    if (!game.hasRoundFirstPassOccurred) {
      game.hasRoundFirstPassOccurred = true;
      game.solarSystem?.rotateNextDisc();
      game.alienState?.onSolarSystemRotated(game);
    }

    rival.passed = true;
    this.finishTurn(game);
    return { kind: 'pass' };
  }

  private static finishTurn(game: Game): void {
    if (game.phase === EPhase.IN_RESOLUTION) {
      game.transitionTo(EPhase.AWAIT_END_TURN);
    }
    game.processEndTurn(game.activePlayer.id);
  }
}
