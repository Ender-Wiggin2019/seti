import type { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';

export interface IAlienPlugin {
  readonly alienType: EAlienType;

  onDiscover(game: IGame, discoverers: IPlayer[]): PlayerInput | undefined;

  onTraceMark?(
    game: IGame,
    player: IPlayer,
    traceColor: ETrace,
    isOverflow: boolean,
  ): void;

  onRoundEnd?(game: IGame): void;

  onGameEndScoring?(game: IGame, player: IPlayer): number;
}
