import { describe, expect, it, vi } from 'vitest';
import {
  EGameRuntimeEvent,
  GameEventBus,
} from '@/engine/events/GameEventBus.js';

describe('GameEventBus', () => {
  it('emits listeners in priority order and merges context patches', () => {
    const bus = new GameEventBus();

    bus.subscribe(
      EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      (context) => ({ tags: [...((context.tags as string[]) ?? []), 'late'] }),
      { priority: 10 },
    );
    bus.subscribe(
      EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      (context) => ({ tags: [...((context.tags as string[]) ?? []), 'early'] }),
      { priority: -10 },
    );

    const result = bus.emit({
      type: EGameRuntimeEvent.MAIN_ACTION_RESOLVED,
      tags: [],
    });

    expect(result.tags).toEqual(['early', 'late']);
  });

  it('removes listeners by owner without touching other listeners', () => {
    const bus = new GameEventBus();
    const owned = vi.fn();
    const retained = vi.fn();

    bus.subscribe(EGameRuntimeEvent.ROUND_START, owned, { owner: 'org-a' });
    bus.subscribe(EGameRuntimeEvent.ROUND_START, retained, { owner: 'org-b' });

    bus.unsubscribeOwner('org-a');
    bus.emit({ type: EGameRuntimeEvent.ROUND_START });

    expect(owned).not.toHaveBeenCalled();
    expect(retained).toHaveBeenCalledTimes(1);
  });
});
