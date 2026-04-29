import { EStarName } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { expectObservationEndGameCard } from './ObservationEndGameCardTestUtils.js';

describe('Kepler22ObservationCard (card 40)', () => {
  it('marks Kepler 22 sector and scores yellow fulfilled sectors', () => {
    expectObservationEndGameCard({
      cardId: '40',
      starName: EStarName.KEPLER_22,
      sectorColor: ESector.YELLOW,
      signalCount: 2,
    });
  });
});
