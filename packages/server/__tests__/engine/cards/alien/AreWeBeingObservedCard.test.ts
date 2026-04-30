import { ETrace } from '@seti/common/types/protocol/enums';
import { AreWeBeingObservedCard } from '@/engine/cards/alien/AreWeBeingObservedCard.js';
import {
  addAnomalyToken,
  createAnomaliesGame,
  getEarthSectorIndex,
  resolveDeferredInputs,
} from './AnomaliesCardTestHelpers.js';

describe('AreWeBeingObservedCard', () => {
  it('gains the reward from the next counter-clockwise anomaly token', () => {
    const { game, player } = createAnomaliesGame('are-we-being-observed');
    const earth = getEarthSectorIndex(game);
    const counterClockwise =
      (earth + game.sectors.length - 1) % game.sectors.length;
    const clockwise = (earth + 1) % game.sectors.length;
    addAnomalyToken(game, counterClockwise, ETrace.BLUE, [
      { type: 'PUBLICITY', amount: 2 },
    ]);
    addAnomalyToken(game, clockwise, ETrace.RED, [{ type: 'VP', amount: 5 }]);
    const publicityBefore = player.resources.publicity;
    const scoreBefore = player.score;

    new AreWeBeingObservedCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.resources.publicity).toBe(publicityBefore + 2);
    expect(player.score).toBe(scoreBefore);
  });
});
