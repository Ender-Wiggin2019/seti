import type { IPlayer } from '@/engine/player/IPlayer.js';
import { EndGameScoringCard } from '../Card.js';
import { loadCardData } from '../loadCardData.js';

const CARD_ID = 'SA.8';

export class QuantumDataStorage extends EndGameScoringCard {
  public constructor() {
    super(loadCardData(CARD_ID));
  }

  public override scoreEndGame(player: IPlayer): number {
    return 3 * player.dataPool.count;
  }
}
