import {
  AMOEBA_ALIEN_CARD_IDS,
  AMOEBA_TRACE_SLOTS,
} from '@seti/common/constant/spaceAgencyAliens';
import { EAlienType } from '@seti/common/types/protocol/enums';
import { isSoloMode } from '@/engine/GameOptions.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { RivalSetup } from '@/engine/solo/RivalSetup.js';
import type {
  AlienBoard,
  AmoebaAlienBoard,
  ITraceSlot,
} from '../AlienBoard.js';
import { isAmoebaAlienBoard } from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

export class AmoebaAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.AMOEBA;

  public getAlienDeckCardIds(_game: IGame, _board: AlienBoard): string[] {
    return [...AMOEBA_ALIEN_CARD_IDS];
  }

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (isAmoebaAlienBoard(board) && board.speciesTraceSlots.length === 0) {
      this.shuffleOrganelles(board, game);
      for (const slot of AMOEBA_TRACE_SLOTS) {
        board.addTraceSlot({
          slotId: `alien-${board.alienIndex}-amoeba-${slot.traceColor}-${slot.position}`,
          alienIndex: board.alienIndex,
          traceColor: slot.traceColor,
          maxOccupants: 1,
          rewards: [{ type: 'VP', amount: 3 }],
          isDiscovery: false,
        });
      }
    }
    return undefined;
  }

  private shuffleOrganelles(board: AmoebaAlienBoard, game: IGame): void {
    const positions = board.organelles.map((organelle) => organelle.position);
    const shuffledTokens = game.random.shuffle(
      board.organelles.map((organelle) => ({
        tokenId: organelle.tokenId,
        color: organelle.color,
      })),
    );
    board.organelles = positions.map((position, index) => {
      const organelle = shuffledTokens[index];
      if (organelle === undefined) {
        throw new Error('Amoeba organelle shuffle returned too few tokens');
      }
      return { ...organelle, position };
    });
  }

  public canPlaceTraceOnSlot(
    game: IGame,
    player: IPlayer,
    slot: ITraceSlot,
  ): boolean {
    if (!isSoloMode(game.options) || !RivalSetup.isRivalPlayer(player)) {
      return true;
    }

    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board) || !board.speciesTraceSlots.includes(slot)) {
      return true;
    }

    return board.countOrganellesInSection(slot.traceColor) > 1;
  }

  public onPlaceTraceOnSlot(
    game: IGame,
    _player: IPlayer,
    slot: ITraceSlot,
  ): void {
    const board = game.alienState.getBoardByType(EAlienType.AMOEBA);
    if (!isAmoebaAlienBoard(board) || !board.speciesTraceSlots.includes(slot)) {
      return;
    }

    board.moveOrganellesInSection(slot.traceColor);
  }
}
