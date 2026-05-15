import type { IGame } from '../IGame.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface ISetupRole {
  readonly id: string;
  readonly name: string;
  resolve(player: IPlayer, game: IGame): void;
}
