import { EAlienType } from '@seti/common/types/protocol/enums';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';
import type { IAlienPlugin } from '@/engine/alien/IAlienPlugin.js';

describe('AlienRegistry', () => {
  beforeEach(() => {
    AlienRegistry.clear();
  });

  it('registers and retrieves plugin by alien type', () => {
    const plugin: IAlienPlugin = {
      alienType: EAlienType.DUMMY,
      onDiscover: () => undefined,
    };

    AlienRegistry.register(plugin);

    expect(AlienRegistry.has(EAlienType.DUMMY)).toBe(true);
    expect(AlienRegistry.get(EAlienType.DUMMY)).toBe(plugin);
  });

  it('clear removes all registrations', () => {
    AlienRegistry.register({
      alienType: EAlienType.DUMMY,
      onDiscover: () => undefined,
    });

    AlienRegistry.clear();

    expect(AlienRegistry.has(EAlienType.DUMMY)).toBe(false);
    expect(AlienRegistry.get(EAlienType.DUMMY)).toBeUndefined();
  });
});
