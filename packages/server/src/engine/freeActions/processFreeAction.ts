import type { IFreeActionRequest } from '@seti/common/types/protocol/actions';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';
import { BuyCardFreeAction } from './BuyCard.js';
import { CompleteMissionFreeAction } from './CompleteMission.js';
import { ConvertEnergyToMovementFreeAction } from './ConvertEnergyToMovement.js';
import { ExchangeResourcesFreeAction } from './ExchangeResources.js';
import { FreeActionCornerFreeAction } from './FreeActionCorner.js';
import { MovementFreeAction } from './Movement.js';
import { PlaceDataFreeAction } from './PlaceData.js';

export function processFreeAction(
  player: IPlayer,
  game: IGame,
  action: IFreeActionRequest,
): void {
  switch (action.type) {
    case EFreeAction.MOVEMENT:
      MovementFreeAction.execute(player, game, action.path);
      return;

    case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
      ConvertEnergyToMovementFreeAction.execute(player, game, action.amount);
      return;

    case EFreeAction.PLACE_DATA:
      PlaceDataFreeAction.execute(player, game);
      return;

    case EFreeAction.COMPLETE_MISSION:
      CompleteMissionFreeAction.execute(player, game, action.cardId);
      return;

    case EFreeAction.USE_CARD_CORNER:
      FreeActionCornerFreeAction.execute(player, game, action.cardId);
      return;

    case EFreeAction.BUY_CARD:
      BuyCardFreeAction.execute(player, game, {
        cardId: action.cardId,
        fromDeck: action.fromDeck,
      });
      return;

    case EFreeAction.EXCHANGE_RESOURCES:
      ExchangeResourcesFreeAction.execute(player, game, action.from, action.to);
      return;

    default:
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Unknown free action type: ${(action as { type: string }).type}`,
      );
  }
}
