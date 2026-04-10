import type { IFreeActionRequest } from '@seti/common/types/protocol/actions';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
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
): IPlayerInput | undefined {
  switch (action.type) {
    case EFreeAction.MOVEMENT:
      MovementFreeAction.execute(player, game, action.path);
      return undefined;

    case EFreeAction.CONVERT_ENERGY_TO_MOVEMENT:
      ConvertEnergyToMovementFreeAction.execute(player, game, action.amount);
      return undefined;

    case EFreeAction.PLACE_DATA:
      return PlaceDataFreeAction.execute(player, game, action.slotIndex)
        .pendingInput;

    case EFreeAction.COMPLETE_MISSION:
      CompleteMissionFreeAction.execute(
        player,
        game,
        action.cardId,
        action.branchIndex,
      );
      return undefined;

    case EFreeAction.USE_CARD_CORNER:
      FreeActionCornerFreeAction.execute(player, game, action.cardId);
      return undefined;

    case EFreeAction.BUY_CARD:
      BuyCardFreeAction.execute(player, game, {
        cardId: action.cardId,
        fromDeck: action.fromDeck,
      });
      return undefined;

    case EFreeAction.EXCHANGE_RESOURCES:
      ExchangeResourcesFreeAction.execute(player, game, action.from, action.to);
      return undefined;

    default:
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        `Unknown free action type: ${(action as { type: string }).type}`,
      );
  }
}
