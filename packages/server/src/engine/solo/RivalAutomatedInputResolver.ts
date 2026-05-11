import type { IInputResponse } from '@seti/common/types/protocol/actions';
import {
  EPlayerInputType,
  type IPlayerInputModel,
} from '@seti/common/types/protocol/playerInput';
import type { Game } from '@/engine/Game.js';
import { RivalSetup } from './RivalSetup.js';

export class RivalAutomatedInputResolver {
  public static resolvePendingInput(game: Game): boolean {
    if (!game.rivalState) {
      return false;
    }

    const rival = RivalSetup.getRivalPlayer(game);
    const pendingInput = rival.waitingFor;
    if (!pendingInput) {
      return false;
    }

    game.processInput(rival.id, this.buildResponse(pendingInput.toModel()));
    return true;
  }

  private static buildResponse(model: IPlayerInputModel): IInputResponse {
    switch (model.type) {
      case EPlayerInputType.GOLD_TILE: {
        const tileId = model.options[0];
        if (!tileId) {
          throw new Error('Rival gold tile input has no available option');
        }
        return { type: EPlayerInputType.GOLD_TILE, tileId };
      }
      default:
        throw new Error(`Unsupported rival automated input: ${model.type}`);
    }
  }
}
