import { EAlienType } from '@seti/common/types/BaseCard';
import { EResource } from '@seti/common/types/element';
import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { getPlayCardAction } from '../../actions/PlayCardActionProvider.js';
import { hasCardData, loadCardData } from '../../cards/loadCardData.js';
import { AnyCardChoiceEffect } from '../../effects/card/AnyCardChoiceEffect.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import type { IPlayer, TCardItem } from '../../player/IPlayer.js';
import type { IOrganizationMainActionPayload } from '../Organization.js';
import { Organization } from '../Organization.js';
import {
  buildIndexedCardSelections,
  getCardItemId,
} from '../OrganizationCardUtils.js';

type TSerializableCardItem = string | { id?: string; [key: string]: unknown };

interface IFuturespanState {
  preparedCard?: TSerializableCardItem;
  preparedCardId?: string;
  unlockScore?: number;
}

export class FuturespanInstitute extends Organization {
  public constructor() {
    super(EOrganizationId.FUTURESPAN_INSTITUTE);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override hasImplementedMainAction(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, game: IGame): boolean {
    const state = this.getState(player);
    if (!state.preparedCardId) {
      return this.hasPrepariableCard(player, game);
    }
    return (
      this.isPreparedCardLocked(player) &&
      (game.cardRow.length > 0 || game.mainDeck.totalSize > 0)
    );
  }

  public override canUsePowerAfterOncePerRoundUsed(
    player: IPlayer,
    game: IGame,
  ): boolean {
    const state = this.getState(player);
    return !state.preparedCardId && this.hasPrepariableCard(player, game);
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const state = this.getState(player);
    if (state.preparedCardId) {
      return this.advancePreparedCard(player, game);
    }

    const selections = buildIndexedCardSelections(player.hand).filter(
      (selection) => this.canPrepareCard(selection.cardId),
    );
    const cards = selections.map((selection) => selection.modelCard);
    if (cards.length === 0) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Futurespan Institute requires a hand card to prepare',
        { playerId: player.id },
      );
    }

    return new SelectCard(
      player,
      {
        cards,
        minSelections: 1,
        maxSelections: 1,
        onSelect: ([selectionId]) => this.prepareCard(player, selectionId),
      },
      'Choose a card to prepare',
    );
  }

  public override canUseMainAction(
    player: IPlayer,
    game: IGame,
    _payload: IOrganizationMainActionPayload = {},
  ): boolean {
    const state = this.getState(player);
    return (
      state.preparedCardId !== undefined &&
      player.score >= (state.unlockScore ?? player.score) &&
      this.canPlayPreparedCard(player, game)
    );
  }

  public override useMainAction(
    player: IPlayer,
    game: IGame,
    _payload: IOrganizationMainActionPayload = {},
  ): IPlayerInput | undefined {
    if (!this.canUseMainAction(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Futurespan Institute prepared card is still locked',
        { playerId: player.id },
      );
    }

    const state = this.getState(player);
    const preparedCard = state.preparedCard ?? state.preparedCardId;
    const preparedCardId = state.preparedCardId;
    if (!preparedCard || !preparedCardId) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Futurespan Institute has no prepared card',
        { playerId: player.id },
      );
    }

    player.hand.push(preparedCard);
    const cardIndex = player.hand.length - 1;
    try {
      getPlayCardAction().execute(player, game, cardIndex, { free: true });
    } catch (error) {
      if (player.hand[cardIndex] === preparedCard) {
        player.removeCardAt(cardIndex);
      }
      throw error;
    }
    this.setState(player, {});
    return undefined;
  }

  private prepareCard(
    player: IPlayer,
    selectionId?: string,
  ): IPlayerInput | undefined {
    if (!selectionId) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Futurespan Institute requires a selected card',
        { playerId: player.id },
      );
    }

    const selectedCard = buildIndexedCardSelections(player.hand).find(
      (selection) => selection.selectionId === selectionId,
    );
    if (!selectedCard) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        `Card selection ${selectionId} not found in hand`,
        { playerId: player.id, selectionId },
      );
    }

    const card = player.removeCardAt(selectedCard.index);
    const preparedCard = this.toSerializableCard(card);
    this.setState(player, {
      preparedCard,
      preparedCardId: selectedCard.cardId,
      unlockScore: this.getUnlockScore(player, selectedCard.cardId),
    });
    return undefined;
  }

  private hasPrepariableCard(player: IPlayer, _game: IGame): boolean {
    return player.hand.some((card) => {
      const cardId = getCardItemId(card);
      return cardId !== undefined && this.canPrepareCard(cardId);
    });
  }

  private canPrepareCard(cardId: string): boolean {
    if (!hasCardData(cardId)) {
      return true;
    }
    const cardData = loadCardData(cardId);
    const priceType =
      cardData.priceType ??
      (cardData.alien === EAlienType.CENTAURIANS
        ? EResource.ENERGY
        : EResource.CREDIT);
    return priceType === EResource.CREDIT;
  }

  private canPlayPreparedCard(player: IPlayer, game: IGame): boolean {
    const state = this.getState(player);
    const preparedCard = state.preparedCard ?? state.preparedCardId;
    if (!preparedCard || !state.preparedCardId) return false;
    if (!this.canPrepareCard(state.preparedCardId)) return false;

    const cardIndex = player.hand.length;
    player.hand.push(preparedCard);
    try {
      return getPlayCardAction().canExecuteCardAtIndex(
        player,
        game,
        cardIndex,
        {
          free: true,
        },
      );
    } finally {
      player.removeCardAt(cardIndex);
    }
  }

  private advancePreparedCard(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (!this.isPreparedCardLocked(player)) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Futurespan Institute prepared card is already unlocked',
        { playerId: player.id },
      );
    }

    if (game.cardRow.length === 0 && game.mainDeck.totalSize === 0) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'No cards available in deck or discard pile',
        { playerId: player.id },
      );
    }

    return AnyCardChoiceEffect.execute(player, game, 1, () => {
      const state = this.getState(player);
      this.setState(player, {
        ...state,
        unlockScore: (state.unlockScore ?? player.score) + 3,
      });
      player.oncePerRoundUsed[this.id] = true;
      return undefined;
    });
  }

  private getState(player: IPlayer): IFuturespanState {
    return (player.organizationState[this.id] ?? {}) as IFuturespanState;
  }

  private setState(player: IPlayer, state: IFuturespanState): void {
    player.organizationState[this.id] = state as Record<string, unknown>;
  }

  private isPreparedCardLocked(player: IPlayer): boolean {
    const state = this.getState(player);
    return (
      state.preparedCardId !== undefined &&
      player.score < (state.unlockScore ?? player.score)
    );
  }

  private getUnlockScore(player: IPlayer, cardId: string): number {
    if (!hasCardData(cardId)) {
      return player.score;
    }
    return player.score + loadCardData(cardId).price * 10 + 5;
  }

  private toSerializableCard(card: TCardItem): TSerializableCardItem {
    if (typeof card === 'string') return card;
    return JSON.parse(JSON.stringify(card)) as TSerializableCardItem;
  }
}
