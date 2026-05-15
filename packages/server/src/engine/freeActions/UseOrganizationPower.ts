import { EOrganizationId } from '@seti/common/types/organization';
import { EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import { OrganizationRegistry } from '../organization/OrganizationRegistry.js';
import type { IPlayer } from '../player/IPlayer.js';

export class UseOrganizationPowerFreeAction {
  public static execute(
    player: IPlayer,
    game: IGame,
    organizationId: EOrganizationId,
  ): IPlayerInput | undefined {
    if (game.phase === EPhase.IN_RESOLUTION || player.waitingFor) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Organization powers cannot interrupt pending resolution',
        { playerId: player.id, organizationId },
      );
    }

    if (!player.organizationIds.includes(organizationId)) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Player does not own this organization',
        { playerId: player.id, organizationId },
      );
    }

    const organization = OrganizationRegistry.create(organizationId);
    organization.restore(player, game);
    if (!organization.hasImplementedPower()) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Organization free-action powers are not implemented for this organization',
        { playerId: player.id, organizationId },
      );
    }

    if (
      player.oncePerRoundUsed[organizationId] &&
      !organization.canUsePowerAfterOncePerRoundUsed(player, game)
    ) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Organization power already used this round',
        { playerId: player.id, organizationId },
      );
    }

    if (!organization.canUsePower(player, game)) {
      throw new GameError(
        EErrorCode.INVALID_FREE_ACTION,
        'Organization power is not currently available',
        { playerId: player.id, organizationId },
      );
    }

    return organization.usePower(player, game);
  }
}
