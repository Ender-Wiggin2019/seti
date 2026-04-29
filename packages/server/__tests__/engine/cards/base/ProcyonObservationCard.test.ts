import { EStarName } from '@seti/common/constant/sectorSetup';
import { ESector } from '@seti/common/types/element';
import { expectObservationEndGameCard } from './ObservationEndGameCardTestUtils.js';

describe('ProcyonObservationCard (card 42)', () => {
  it('marks Procyon sector and scores blue fulfilled sectors', () => {
    expectObservationEndGameCard({
      cardId: '42',
      starName: EStarName.PROCYON,
      sectorColor: ESector.BLUE,
      signalCount: 2,
    });
  });
});
