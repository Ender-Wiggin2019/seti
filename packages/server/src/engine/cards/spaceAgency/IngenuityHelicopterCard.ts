import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';
import { countNonMoonPlanetsWithTwoLanders } from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.31';

export class IngenuityHelicopter extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return 6 * countNonMoonPlanetsWithTwoLanders(player, game);
  }
}
