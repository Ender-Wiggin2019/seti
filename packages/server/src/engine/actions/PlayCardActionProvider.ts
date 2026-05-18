import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

interface IPlayCardActionAdapter {
  canExecuteCardAtIndex(
    player: IPlayer,
    game: IGame,
    cardIndex: number,
    options?: { free?: boolean },
  ): boolean;
  execute(
    player: IPlayer,
    game: IGame,
    cardIndex: number,
    options?: { free?: boolean },
  ): unknown;
}

let playCardAction: IPlayCardActionAdapter | undefined;

export function setPlayCardAction(adapter: IPlayCardActionAdapter): void {
  playCardAction = adapter;
}

export function getPlayCardAction(): IPlayCardActionAdapter {
  if (!playCardAction) {
    throw new Error('PlayCardAction has not been initialized');
  }
  return playCardAction;
}
