import { ETrace } from '@seti/common/types/protocol/enums';
import { ListeningCarefullyCard } from '@/engine/cards/alien/ListeningCarefullyCard.js';
import {
  addAnomalyToken,
  createAnomaliesGame,
  getEarthSectorIndex,
  resolveDeferredInputs,
} from './AnomaliesCardTestHelpers.js';

describe('ListeningCarefullyCard', () => {
  it('marks the next counter-clockwise anomaly sector in addition to scan marks', () => {
    const { game, player } = createAnomaliesGame('listening-carefully');
    const earth = getEarthSectorIndex(game);
    const counterClockwise =
      (earth + game.sectors.length - 1) % game.sectors.length;
    const clockwise = (earth + 1) % game.sectors.length;
    addAnomalyToken(game, counterClockwise, ETrace.YELLOW);
    addAnomalyToken(game, clockwise, ETrace.BLUE);

    const before = game.sectors[counterClockwise].getPlayerMarkerCount(
      player.id,
    );

    new ListeningCarefullyCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(game.sectors[counterClockwise].getPlayerMarkerCount(player.id)).toBe(
      before + 1,
    );
  });
});
