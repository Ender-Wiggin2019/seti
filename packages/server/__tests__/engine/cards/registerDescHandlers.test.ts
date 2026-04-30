import { getBehaviorExecutor } from '@/engine/cards/BehaviorExecutor.js';
import { registerDescHandlers } from '@/engine/cards/registerDescHandlers.js';

describe('registerDescHandlers', () => {
  it('does not keep handlers that have migrated into card classes', () => {
    const executor = getBehaviorExecutor() as unknown as {
      customHandlers: Map<string, unknown>;
    };

    registerDescHandlers();

    expect(executor.customHandlers.has('desc.card-55')).toBe(false);
    expect(executor.customHandlers.has('desc.card-67')).toBe(false);
    expect(executor.customHandlers.has('sa.desc.card_13')).toBe(false);
  });
});
