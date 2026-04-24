import type { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { IGame } from '../IGame.js';
import type { PlayerInput } from '../input/PlayerInput.js';
import type { IPlayer } from '../player/IPlayer.js';
import type { AlienBoard, ITraceSlot } from './AlienBoard.js';

export interface IAlienPlugin {
  readonly alienType: EAlienType;

  onDiscover(game: IGame, discoverers: IPlayer[]): PlayerInput | undefined;

  getAlienDeckCardIds?(game: IGame, board: AlienBoard): string[];

  resolveDiscoverySlot?(
    game: IGame,
    board: AlienBoard,
    slot: ITraceSlot,
    player: IPlayer,
  ): void;

  onTraceMark?(
    game: IGame,
    player: IPlayer,
    traceColor: ETrace,
    isOverflow: boolean,
  ): void;

  canPlaceTraceOnSlot?(game: IGame, player: IPlayer, slot: ITraceSlot): boolean;

  onPlaceTraceOnSlot?(game: IGame, player: IPlayer, slot: ITraceSlot): void;

  onRoundEnd?(game: IGame): void;

  onSolarSystemRotated?(game: IGame): void;

  onGameEndScoring?(game: IGame, player: IPlayer): number;
}
