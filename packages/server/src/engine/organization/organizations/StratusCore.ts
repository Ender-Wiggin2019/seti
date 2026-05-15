import { EOrganizationId } from '@seti/common/types/organization';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../../IGame.js';
import type { IPlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { Organization } from '../Organization.js';
import {
  executeCardFreeActionCornerRewardsInOrder,
  getCardItemId,
} from '../OrganizationCardUtils.js';

export class StratusCore extends Organization {
  public constructor() {
    super(EOrganizationId.STRATUS_CORE);
  }

  public override hasImplementedPower(): boolean {
    return true;
  }

  public override canUsePower(_player: IPlayer, game: IGame): boolean {
    const cardIds = game.cardRow.map((card) => getCardItemId(card));
    return (
      cardIds.length > 0 &&
      cardIds.every((cardId): cardId is string => cardId !== undefined)
    );
  }

  public override usePower(
    player: IPlayer,
    game: IGame,
  ): IPlayerInput | undefined {
    if (game.cardRow.length === 0) {
      throw new GameError(EErrorCode.INVALID_FREE_ACTION, 'Card row is empty', {
        playerId: player.id,
      });
    }

    const cardIds = game.cardRow.map((card) => getCardItemId(card));
    if (cardIds.some((cardId) => !cardId)) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Card row contains an unknown card',
        { playerId: player.id },
      );
    }

    player.oncePerRoundUsed[this.id] = true;
    return executeCardFreeActionCornerRewardsInOrder(
      player,
      game,
      cardIds as string[],
    );
  }
}
