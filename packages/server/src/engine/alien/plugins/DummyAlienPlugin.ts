import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { IGame } from '../../IGame.js';
import type { PlayerInput } from '../../input/PlayerInput.js';
import type { IPlayer } from '../../player/IPlayer.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

export class DummyAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.DUMMY;

  public onDiscover(
    game: IGame,
    discoverers: IPlayer[],
  ): PlayerInput | undefined {
    // Award 3 VP to each discoverer
    for (const player of discoverers) {
      player.score += 3;
    }
    return undefined;
  }

  public onTraceMark(
    game: IGame,
    player: IPlayer,
    traceColor: ETrace,
    isOverflow: boolean,
  ): void {
    // Dummy alien: no special on-trace-mark behavior
  }

  public onRoundEnd(game: IGame): void {
    // No special round-end behavior
  }

  public onGameEndScoring(game: IGame, player: IPlayer): number {
    // Dummy alien: 1 VP per trace the player has marked on this alien
    const board = game.alienState.getBoardByType(EAlienType.DUMMY);
    if (!board) return 0;
    return board.getPlayerTraceCount(player.id);
  }
}
