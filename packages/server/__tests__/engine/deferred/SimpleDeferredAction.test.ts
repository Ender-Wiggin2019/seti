import { EPriority } from '@/engine/deferred/Priority.js';
import { SimpleDeferredAction } from '@/engine/deferred/SimpleDeferredAction.js';

describe('SimpleDeferredAction', () => {
  it('executes callback and forwards return value', () => {
    const action = new SimpleDeferredAction(
      { id: 'p1', name: 'A', color: 'red', seatIndex: 0 },
      () => undefined,
      EPriority.CORE_EFFECT,
    );

    const result = action.execute({} as never);

    expect(result).toBeUndefined();
    expect(action.priority).toBe(EPriority.CORE_EFFECT);
  });
});
