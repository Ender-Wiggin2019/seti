import { EndGameScoringCard } from '../Card.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { loadCardData } from '../loadCardData.js';
import { scoreGlyphidsLargestSet } from './spaceAgencyEndGameScoring.js';

export class SaEt9GlyphidsCard extends EndGameScoringCard {
  public constructor() {
    super(loadCardData('SA.ET.9'));
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return scoreGlyphidsLargestSet(player, game);
  }
}
