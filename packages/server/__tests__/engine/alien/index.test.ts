import { EAlienType } from '@seti/common/types/protocol/enums';
import * as alienModule from '@/engine/alien/index.js';
import { AlienRegistry } from '@/engine/alien/AlienRegistry.js';

describe('alien index exports', () => {
  it('exports public members', () => {
    expect(alienModule.AlienBoard).toBeDefined();
    expect(alienModule.AlienState).toBeDefined();
    expect(alienModule.AlienRegistry).toBeDefined();
  });

  it('registers dummy plugin as side effect', () => {
    expect(AlienRegistry.has(EAlienType.DUMMY)).toBe(true);
    expect(AlienRegistry.get(EAlienType.DUMMY)).toBeDefined();
  });

  it('registers anomalies plugin as side effect', () => {
    expect(AlienRegistry.has(EAlienType.ANOMALIES)).toBe(true);
    expect(AlienRegistry.get(EAlienType.ANOMALIES)).toBeDefined();
  });
});
