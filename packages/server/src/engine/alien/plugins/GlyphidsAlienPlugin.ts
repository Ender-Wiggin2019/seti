import { PLANETARY_PLANETS } from '@seti/common/constant/boardLayout';
import { GLYPHIDS_ALIEN_CARD_IDS } from '@seti/common/constant/spaceAgencyAliens';
import { EAlienType, EPlanet } from '@seti/common/types/protocol/enums';
import { ALL_TECH_IDS, type ETechId } from '@seti/common/types/tech';
import { isSoloMode } from '@/engine/GameOptions.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { RivalSetup } from '@/engine/solo/RivalSetup.js';
import type { AlienBoard, ITraceSlot } from '../AlienBoard.js';
import { isGlyphidsAlienBoard } from '../AlienBoard.js';
import type { IAlienPlugin } from '../IAlienPlugin.js';

const GLYPHIDS_SET_SCORE_BY_SIZE = [0, 1, 3, 5, 8, 11, 15, 20] as const;

export class GlyphidsAlienPlugin implements IAlienPlugin {
  public readonly alienType = EAlienType.GLYPHIDS;

  public getAlienDeckCardIds(_game: IGame, _board: AlienBoard): string[] {
    return [...GLYPHIDS_ALIEN_CARD_IDS];
  }

  public onDiscover(
    game: IGame,
    _discoverers: IPlayer[],
  ): PlayerInput | undefined {
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (isGlyphidsAlienBoard(board)) {
      board.glyphTokenBank = game.random.shuffle([...board.glyphTokenBank]);
      if (board.boardTokens.length === 0) {
        board.dealBoardTokensFromBank();
      }
      if (board.placedTokens.length === 0) {
        for (const planet of PLANETARY_PLANETS) {
          board.dealPlacedTokenFromBank({ type: 'planet', planet });
        }
        for (
          let sectorIndex = 0;
          sectorIndex < game.sectors.length;
          sectorIndex += 1
        ) {
          const sector = game.sectors[sectorIndex];
          if (!sector) continue;
          board.dealPlacedTokenFromBank({
            type: 'sector',
            sectorId: sector.id,
            sectorIndex,
          });
        }
        for (const techId of ALL_TECH_IDS) {
          if (game.techBoard?.getStack(techId)?.firstTakeBonusAvailable) {
            board.dealPlacedTokenFromBank({ type: 'tech', techId });
          }
        }
      }
      board.resetTranslationRows([
        game.random.next() < 0.5 ? 1 : 2,
        game.random.next() < 0.5 ? 1 : 2,
      ]);
    }
    return undefined;
  }

  public resolveDiscoverySlot(
    game: IGame,
    board: AlienBoard,
    _slot: ITraceSlot,
    player: IPlayer,
  ): void {
    game.alienState.drawAlienCard(player, board, 'deck');
  }

  public onPlanetVisited(game: IGame, player: IPlayer, planet: EPlanet): void {
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) return;
    board.claimPlacedToken(
      player.id,
      (token) =>
        token.location.type === 'planet' && token.location.planet === planet,
    );
  }

  public onSectorWon(game: IGame, player: IPlayer, sectorId: string): void {
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) return;
    board.claimPlacedToken(
      player.id,
      (token) =>
        token.location.type === 'sector' &&
        token.location.sectorId === sectorId,
    );
  }

  public onTechAcquired(game: IGame, player: IPlayer, techId: ETechId): void {
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) return;
    board.claimPlacedToken(
      player.id,
      (token) =>
        token.location.type === 'tech' && token.location.techId === techId,
    );
  }

  public onGameEndScoring(game: IGame, player: IPlayer): number {
    const board = game.alienState.getBoardByType(EAlienType.GLYPHIDS);
    if (!isGlyphidsAlienBoard(board)) return 0;

    const glyphRows = board.glyphRows[player.id] ?? [];
    if (isSoloMode(game.options) && RivalSetup.isRivalPlayer(player)) {
      return 3 * glyphRows.reduce((total, row) => total + row.length, 0);
    }

    return glyphRows.reduce((total, row) => {
      const setSize = Math.min(new Set(row).size, 7);
      return total + (GLYPHIDS_SET_SCORE_BY_SIZE[setSize] ?? 0);
    }, 0);
  }
}
