import { ETrace } from '@seti/common/types/element';
import {
  hasNoCardsInHand,
  hasTrace,
  hasTraceOnAllSpecies,
  playedCardsInSameSector,
  probeOnAsteroidAdjacentToEarth,
} from '@/engine/missions/QuickMissionConditions.js';
import { ESolarSystemElementType } from '@/engine/board/SolarSystem.js';

describe('QuickMissionConditions', () => {
  it('hasTrace checks required color count', () => {
    const player = { traces: { [ETrace.RED]: 2 } } as never;
    expect(hasTrace(ETrace.RED, 2)(player, {} as never)).toBe(true);
    expect(hasTrace(ETrace.RED, 3)(player, {} as never)).toBe(false);
  });

  it('hasTraceOnAllSpecies validates every discovered alien board', () => {
    const player = {
      tracesByAlien: {
        0: { [ETrace.BLUE]: 1 },
        1: { [ETrace.BLUE]: 1 },
      },
    } as never;
    const game = {
      alienState: { boards: [{ alienIndex: 0 }, { alienIndex: 1 }] },
    } as never;

    expect(hasTraceOnAllSpecies(ETrace.BLUE)(player, game)).toBe(true);
    expect(hasTraceOnAllSpecies(ETrace.RED)(player, game)).toBe(false);
  });

  it('probeOnAsteroidAdjacentToEarth validates adjacency relation', () => {
    const player = { id: 'p1' } as never;
    const game = {
      solarSystem: {
        spaces: [
          {
            id: 'earth',
            elements: [{ type: ESolarSystemElementType.EARTH, amount: 1 }],
            occupants: [],
          },
          {
            id: 'asteroid',
            elements: [{ type: ESolarSystemElementType.ASTEROID, amount: 1 }],
            occupants: [{ playerId: 'p1' }],
          },
        ],
        adjacency: new Map([
          ['asteroid', ['earth']],
          ['earth', ['asteroid']],
        ]),
      },
    } as never;

    expect(probeOnAsteroidAdjacentToEarth()(player, game)).toBe(true);
  });

  it('playedCardsInSameSector handles empty hand edge case', () => {
    const player = {
      playedMissions: [],
      completedMissions: [],
      endGameCards: [],
    } as never;

    expect(playedCardsInSameSector(1)(player, {} as never)).toBe(false);
  });

  it('hasNoCardsInHand checks boundary 0 cards', () => {
    expect(hasNoCardsInHand()({ hand: [] } as never, {} as never)).toBe(true);
    expect(hasNoCardsInHand()({ hand: ['1'] } as never, {} as never)).toBe(false);
  });
});
