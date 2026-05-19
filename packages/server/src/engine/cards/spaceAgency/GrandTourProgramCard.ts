import type { IGame } from '@/engine/IGame.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';
import { countNonMoonPlanetsWithOrbiterOrLander } from './SpaceAgencyCardUtils.js';

const CARD_ID = 'SA.39';

export class GrandTourProgram extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override scoreEndGame(player: IPlayer, game: IGame): number {
    return 2 * countNonMoonPlanetsWithOrbiterOrLander(player, game);
  }
}
