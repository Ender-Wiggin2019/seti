import type { EAlienType } from '@seti/common/types/protocol/enums';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export type TDrawCardSource = 'base' | 'alien';

export interface IDrawCardRequest {
  source: TDrawCardSource;
  count?: number;
  alienType?: EAlienType;
  defaultAlienType?: EAlienType;
}

export interface IDrawCardResult {
  drawnCardIds: string[];
  pendingInput?: PlayerInput;
}

export function drawCard(
  player: IPlayer,
  game: IGame,
  request: IDrawCardRequest,
): IDrawCardResult {
  const count = request.count ?? 1;

  if (request.source === 'base') {
    const drawnCardIds: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const drawn = game.mainDeck.drawWithReshuffle(game.random);
      if (drawn === undefined) {
        break;
      }
      drawnCardIds.push(drawn);
      player.hand.push(drawn);
    }

    if (drawnCardIds.length > 0) {
      game.lockCurrentTurn();
    }

    return { drawnCardIds };
  }

  const pendingInput = game.alienState.createDrawAlienCardInput(player, game, {
    alienType: request.alienType,
    defaultAlienType: request.defaultAlienType,
  });
  return { drawnCardIds: [], pendingInput };
}
