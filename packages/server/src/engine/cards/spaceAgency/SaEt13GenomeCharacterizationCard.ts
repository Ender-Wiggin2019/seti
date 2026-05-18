import { ETrace } from '@seti/common/types/element';
import { EndGameScoringCard } from '../Card.js';
import type { IGame } from '../../IGame.js';
import type { IPlayer } from '../../player/IPlayer.js';
import { loadCardData } from '../loadCardData.js';
import { scoreAmoebaTraceEndGameCard } from './spaceAgencyEndGameScoring.js';

export class SaEt13GenomeCharacterizationCard extends EndGameScoringCard {
  public constructor() {
    super(loadCardData('SA.ET.13'));
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return scoreAmoebaTraceEndGameCard(player, game, ETrace.BLUE);
  }
}
