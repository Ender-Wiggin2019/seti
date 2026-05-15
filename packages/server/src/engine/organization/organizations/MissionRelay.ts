import { EOrganizationId } from '@seti/common/types/organization';
import { EMainAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { RefillCardRowEffect } from '../../effects/cardRow/RefillCardRowEffect.js';
import { EGameRuntimeEvent } from '../../events/GameEventBus.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import { SelectCard } from '../../input/SelectCard.js';
import { SelectOption } from '../../input/SelectOption.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';
import {
  buildIndexedCardSelections,
  drawCardFromMainDeck,
  gainIncomeCornerResource,
} from '../OrganizationCardUtils.js';

const MISSION_RELAY_PUBLICITY_COST = 2;

export class MissionRelay extends Organization {
  public constructor() {
    super(EOrganizationId.MISSION_RELAY);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(player: IPlayer, game: IGame): boolean {
    return (
      player.resources.publicity >= MISSION_RELAY_PUBLICITY_COST &&
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
        'No cards available for Mission Relay',
        { playerId: player.id },
      );
    }

    if (options.length === 1) {
      return options[0].onSelect();
    }

    return new SelectOption(
      player,
      options,
      'Choose Mission Relay card source',
    );
  }

  protected override afterResolve(player: IPlayer, game: IGame): void {
    game.goldScoringTiles
      .find((tile) => tile.id === 'mission')
      ?.claimLowest(player.id);
  }

  protected override registerEvents(player: IPlayer, game: IGame): void {
    const owner = this.getEventOwner(player);
    game.eventBus.unsubscribeOwner(owner);
    game.eventBus.subscribe(
      EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      (context) => {
        if (context.player !== player) {
          return undefined;
        }
        const action = context.action as { type?: EMainAction } | undefined;
        if (action?.type !== EMainAction.PLAY_CARD) {
          return undefined;
        }

        const actionDetails = context.actionDetails as
          | { cardId?: string; destination?: string }
          | undefined;
        if (actionDetails?.destination !== 'mission') {
          return undefined;
        }

        player.resources.gain({ publicity: 1 });
        return undefined;
      },
      { owner },
    );
  }

  private createCardRowInput(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    const rowSelections = buildIndexedCardSelections(game.cardRow);
    return new SelectCard(
      player,
      {
        cards: rowSelections.map((selection) => selection.modelCard),
        minSelections: 1,
        maxSelections: 1,
        onSelect: ([selectionId]) =>
          this.takeCardFromRow(player, game, selectionId),
      },
      'Choose a card from the row',
    );
  }

  private takeCardFromRow(
    player: IPlayer,
    game: IGame,
    selectionId?: string,
  ): IPlayerInput | undefined {
    this.assertCanPay(player);
    const rowSelections = buildIndexedCardSelections(game.cardRow);
    const selected = rowSelections.find(
      (selection) => selection.selectionId === selectionId,
    );
    if (!selected) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Mission Relay requires a selected card-row card',
        { playerId: player.id, selectionId },
      );
    }

    player.resources.spend({ publicity: MISSION_RELAY_PUBLICITY_COST });
    const [removed] = game.cardRow.splice(selected.index, 1);
    if (removed !== undefined) {
      player.hand.push(removed);
    }
    RefillCardRowEffect.execute(game);
    player.oncePerRoundUsed[this.id] = true;
    return gainIncomeCornerResource(player, game, selected.cardId);
  }

  private takeCardFromDeck(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    this.assertCanPay(player);
    const drawnCardId = drawCardFromMainDeck(player, game);
    if (drawnCardId === undefined) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'No cards available in deck or discard pile',
        { playerId: player.id },
      );
    }

    player.resources.spend({ publicity: MISSION_RELAY_PUBLICITY_COST });
    player.oncePerRoundUsed[this.id] = true;
    return gainIncomeCornerResource(player, game, drawnCardId);
  }

  private assertCanPay(player: IPlayer): void {
    if (player.resources.publicity >= MISSION_RELAY_PUBLICITY_COST) {
      return;
    }
    throw new GameError(
      EErrorCode.INSUFFICIENT_RESOURCES,
      'Not enough publicity for Mission Relay',
      {
        playerId: player.id,
        required: MISSION_RELAY_PUBLICITY_COST,
        available: player.resources.publicity,
      },
    );
  }
}
