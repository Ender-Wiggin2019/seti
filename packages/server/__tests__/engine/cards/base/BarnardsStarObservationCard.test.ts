import { EStarName } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { expectObservationEndGameCard } from './ObservationEndGameCardTestUtils.js';

describe('BarnardsStarObservation (card 38)', () => {
  it('marks Barnard star sector and scores red fulfilled sectors', () => {
    expectObservationEndGameCard({
      cardId: '38',
      starName: EStarName.BARNARDS_STAR,
      sectorColor: ESector.RED,
      signalCount: 2,
    });
  });
});
