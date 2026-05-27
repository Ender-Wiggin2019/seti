import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';
import { scoreGlyphidsMostCommonGlyph } from './spaceAgencyEndGameScoring.js';

export class SaEt1GlyphidsCard extends EndGameScoringCard {
  public constructor() {
    super(loadCardData('SA.ET.1'));
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return scoreGlyphidsMostCommonGlyph(player, game);
  }
}
