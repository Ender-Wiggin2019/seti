import { EAlienType, ETrace } from '@seti/common/types/protocol/enums';
import type { IAlienPlugin } from '@/engine/alien/IAlienPlugin.js';

describe('IAlienPlugin contract', () => {
  it('supports required and optional hooks', () => {
    const plugin: IAlienPlugin = {
      alienType: EAlienType.DUMMY,
      onDiscover: () => undefined,
      onTraceMark: () => undefined,
      onRoundEnd: () => undefined,
      onSolarSystemRotated: () => undefined,
      onGameEndScoring: () => 0,
    };

    expect(plugin.alienType).toBe(EAlienType.DUMMY);
    expect(plugin.onTraceMark).toBeTypeOf('function');
    expect(plugin.onSolarSystemRotated).toBeTypeOf('function');
    expect(
      plugin.onGameEndScoring?.(
        { alienState: {} } as never,
        { id: 'p1', traces: { [ETrace.RED]: 1 } } as never,
      ),
    ).toBe(0);
  });
});
