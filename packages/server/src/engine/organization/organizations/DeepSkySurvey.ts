import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';
import { buildIndexedCardSelections } from '../OrganizationCardUtils.js';

export class DeepSkySurvey extends Organization {
  public constructor() {
    super(EOrganizationId.DEEP_SKY_SURVEY);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, game: IGame): boolean {
    return player.hand.length > 0 && game.cardRow.length > 0;
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (player.hand.length === 0 || game.cardRow.length === 0) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Deep Sky Survey requires a hand card and a card-row card',
        { playerId: player.id },
      );
    }

    const handSelections = buildIndexedCardSelections(player.hand);
    return new SelectCard(
      player,
      {
        cards: handSelections.map((selection) => selection.modelCard),
        minSelections: 1,
        maxSelections: 1,
        onSelect: ([selectionId]) =>
          this.createRowSelection(player, game, selectionId),
      },
      'Choose a hand card to swap',
    );
  }

  protected override applyPlayerConfig(player: IPlayer, _game: IGame): void {
    player.actionCosts = {
      ...player.actionCosts,
      analyzeDataEnergy: 0,
    };
  }

  private createRowSelection(
    player: IPlayer,
    game: IGame,
    handSelectionId?: string,
  ): IPlayerInput | undefined {
    const handSelections = buildIndexedCardSelections(player.hand);
    const selectedHand = handSelections.find(
      (selection) => selection.selectionId === handSelectionId,
    );
    if (!selectedHand) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Deep Sky Survey requires a selected hand card',
        { playerId: player.id, handSelectionId },
      );
    }

    const rowSelections = buildIndexedCardSelections(game.cardRow);
    return new SelectCard(
      player,
      {
        cards: rowSelections.map((selection) => selection.modelCard),
        minSelections: 1,
        maxSelections: 1,
        onSelect: ([rowSelectionId]) =>
          this.swapSelectedCards(
            player,
            game,
            selectedHand.selectionId,
            rowSelectionId,
          ),
      },
      'Choose a card from the row',
    );
  }

  private swapSelectedCards(
    player: IPlayer,
    game: IGame,
    handSelectionId: string,
    rowSelectionId?: string,
  ): IPlayerInput | undefined {
    const handSelections = buildIndexedCardSelections(player.hand);
    const rowSelections = buildIndexedCardSelections(game.cardRow);
    const selectedHand = handSelections.find(
      (selection) => selection.selectionId === handSelectionId,
    );
    const selectedRow = rowSelections.find(
      (selection) => selection.selectionId === rowSelectionId,
    );
    if (!selectedHand || !selectedRow) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Deep Sky Survey requires one hand card and one card-row card',
        { playerId: player.id, handSelectionId, rowSelectionId },
      );
    }

    const handCard = player.hand[selectedHand.index];
    const rowCard = game.cardRow[selectedRow.index];
    if (handCard === undefined || rowCard === undefined) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Deep Sky Survey selected card is no longer available',
        { playerId: player.id },
      );
    }

    player.hand[selectedHand.index] = rowCard;
    game.cardRow[selectedRow.index] = handCard;
    player.oncePerRoundUsed[this.id] = true;
    return undefined;
  }
}
