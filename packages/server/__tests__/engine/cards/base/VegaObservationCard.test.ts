import { EStarName } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { expectObservationEndGameCard } from './ObservationEndGameCardTestUtils.js';

describe('VegaObservationCard (card 44)', () => {
  it('marks Vega sector and scores black fulfilled sectors', () => {
    expectObservationEndGameCard({
      cardId: '44',
      starName: EStarName.VEGA,
      sectorColor: ESector.BLACK,
      signalCount: 1,
    });
  });
});
