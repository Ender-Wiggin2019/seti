import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import { DummyAlienPlugin } from '@/engine/alien/plugins/DummyAlienPlugin.js';

describe('DummyAlienPlugin', () => {
  it('awards 3 VP to each discoverer on discover', () => {
    const plugin = new DummyAlienPlugin();
    const discoverers: Array<{ score: number }> = [{ score: 1 }, { score: 5 }];

    plugin.onDiscover({} as never, discoverers as never);

    expect(discoverers[0]?.score).toBe(4);
    expect(discoverers[1]?.score).toBe(8);
  });

  it('computes end-game score from dummy alien board trace count', () => {
    const plugin = new DummyAlienPlugin();
    const game = {
      alienState: {
        getBoardByType: (alien: EAlienType) => {
          if (alien !== EAlienType.DUMMY) return undefined;
          return { getPlayerTraceCount: (_playerId: string) => 3 };
        },
      },
    } as never;

    const score = plugin.onGameEndScoring(game, { id: 'p1' } as never);

    expect(score).toBe(3);
  });

  it('returns 0 when dummy alien board is absent', () => {
    const plugin = new DummyAlienPlugin();
    const score = plugin.onGameEndScoring(
      {
        alienState: { getBoardByType: () => undefined },
      } as never,
      { id: 'p1', traces: { [ETrace.RED]: 1 } } as never,
    );

    expect(score).toBe(0);
  });
});
