import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { FreeActionCornerFreeAction } from '../../freeActions/FreeActionCorner.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';
import { getCardItemId, toSelectionCard } from '../OrganizationCardUtils.js';

export class FenwickResearchCenter extends Organization {
  public constructor() {
    super(EOrganizationId.FENWICK_RESEARCH_CENTER);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, game: IGame): boolean {
    return (
      player.resources.publicity >= 1 &&
      (game.cardRow.length > 0 || game.mainDeck.totalSize > 0)
    );
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    this.assertCanPay(player);

    const options = [];
    if (game.cardRow.length > 0) {
      options.push({
        id: 'card-row',
        label: 'Card row',
        onSelect: () => this.createCardRowInput(player, game),
      });
    }
    if (game.mainDeck.totalSize > 0) {
      options.push({
        id: 'main-deck',
        label: 'Main deck',
        onSelect: () => this.takeCardFromDeck(player, game),
      });
    }

    if (options.length === 0) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'No cards available for Fenwick Research Center',
        { playerId: player.id },
      );
    }

    if (options.length === 1) {
      return options[0].onSelect();
    }

    return new SelectOption(
      player,
      options,
      'Choose Fenwick Research Center card source',
    );
  }

  protected override applyPlayerConfig(player: IPlayer, _game: IGame): void {
    player.actionCosts = {
      ...player.actionCosts,
      researchTechPublicity: 5,
    };
  }

  private createCardRowInput(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    return new SelectCard(
      player,
      {
        cards: game.cardRow.map((card) => toSelectionCard(card)),
        minSelections: 1,
        maxSelections: 1,
        onSelect: ([cardId]) => this.takeCardFromRow(player, game, cardId),
      },
      'Choose a card from the row',
    );
  }

  private takeCardFromRow(
    player: IPlayer,
    game: IGame,
    cardId?: string,
  ): IPlayerInput | undefined {
    this.assertCanPay(player);
    if (!cardId) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Fenwick Research Center requires a selected card',
        { playerId: player.id },
      );
    }

    const cardIndex = game.cardRow.findIndex(
      (card) => getCardItemId(card) === cardId,
    );
    if (cardIndex < 0) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        `Card ${cardId} not found in card row`,
        { playerId: player.id, cardId },
      );
    }

    player.resources.spend({ publicity: 1 });
    const [removed] = game.cardRow.splice(cardIndex, 1);
    player.hand.push(removed);
    const refill = game.mainDeck.drawWithReshuffle(game.random);
    if (refill !== undefined) {
      game.cardRow.push(refill);
      game.lockCurrentTurn();
    }

    player.oncePerRoundUsed[this.id] = true;
    return FreeActionCornerFreeAction.executeCardCornerRewards(
      player,
      game,
      cardId,
    );
  }

  private takeCardFromDeck(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    this.assertCanPay(player);
    const cardId = game.mainDeck.drawWithReshuffle(game.random);
    if (cardId === undefined) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'No cards available in deck or discard pile',
        { playerId: player.id },
      );
    }

    player.resources.spend({ publicity: 1 });
    player.hand.push(cardId);
    game.lockCurrentTurn();
    player.oncePerRoundUsed[this.id] = true;
    return FreeActionCornerFreeAction.executeCardCornerRewards(
      player,
      game,
      cardId,
    );
  }

  private assertCanPay(player: IPlayer): void {
    if (player.resources.publicity >= 1) {
      return;
    }
    throw new GameError(
      EErrorCode.INSUFFICIENT_RESOURCES,
      'Not enough publicity for Fenwick Research Center',
      {
        playerId: player.id,
        required: 1,
        available: player.resources.publicity,
      },
    );
  }
}
