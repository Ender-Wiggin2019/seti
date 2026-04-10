import { getBehaviorExecutor } from '@/engine/cards/BehaviorExecutor.js';
import { registerDescHandlers } from '@/engine/cards/registerDescHandlers.js';

describe('registerDescHandlers', () => {
  it('registers known custom desc handlers into default executor', () => {
    const executor = getBehaviorExecutor() as unknown as {
      customHandlers: Map<string, unknown>;
    };

    registerDescHandlers();

    expect(executor.customHandlers.has('desc.card-55')).toBe(true);
    expect(executor.customHandlers.has('desc.card-119')).toBe(true);
    expect(executor.customHandlers.has('sa.desc.card_13')).toBe(true);
  });
});
