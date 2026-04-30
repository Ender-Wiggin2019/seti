import { EAlienType } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import { MascamitesAlienPlugin } from '@/engine/alien/plugins/MascamitesAlienPlugin.js';
import { GameError } from '@/shared/errors/GameError.js';
import type { IGame } from '../IGame.js';
import type { IPlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export class DeliverSampleFreeAction {
  public static execute(
    player: IPlayer,
    game: IGame,
    capsuleId: string,
    cardId: string,
    branchIndex?: number,
  ): IPlayerInput | undefined {
    const plugin = AlienRegistry.get(EAlienType.MASCAMITES);
    if (!(plugin instanceof MascamitesAlienPlugin)) {
      throw new GameError(
        EErrorCode.INVALID_ACTION,
        'Mascamites sample delivery is not available',
      );
    }

    return plugin.deliverSample(player, game, capsuleId, cardId, branchIndex);
  }
}
