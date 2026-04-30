import { ETrace } from '@seti/common/types/protocol/enums';
import { SignsOfLifeCard } from '@/engine/cards/alien/SignsOfLifeCard.js';
import {
  addAnomalyToken,
  createAnomaliesGame,
  getEarthSectorIndex,
  resolveDeferredInputs,
} from './AnomaliesCardTestHelpers.js';

describe('SignsOfLifeCard', () => {
  it('gains one movement after launching when Earth sector has an anomaly token', () => {
    const { game, player } = createAnomaliesGame('signs-of-life-anomaly');
    addAnomalyToken(game, getEarthSectorIndex(game), ETrace.RED);

    new SignsOfLifeCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.probesInSpace).toBe(1);
    expect(player.getMoveStash()).toBe(1);
  });

  it('does not gain movement when Earth sector has no anomaly token', () => {
    const { game, player } = createAnomaliesGame('signs-of-life-no-anomaly');

    new SignsOfLifeCard().play({ player, game });
    resolveDeferredInputs(game);

    expect(player.probesInSpace).toBe(1);
    expect(player.getMoveStash()).toBe(0);
  });
});
