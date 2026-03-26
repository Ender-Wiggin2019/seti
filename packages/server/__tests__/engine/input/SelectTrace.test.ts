import { ETrace } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import { vi } from 'vitest';
import { SelectTrace } from '@/engine/input/SelectTrace.js';

describe('SelectTrace', () => {
  it('accepts valid trace option', () => {
    const onSelect = vi.fn(() => undefined);
    const input = new SelectTrace(
      { id: 'p1' } as never,
      [ETrace.RED, ETrace.BLUE],
      onSelect,
    );

    input.process({ type: EPlayerInputType.TRACE, trace: ETrace.BLUE });
    expect(onSelect).toHaveBeenCalledWith(ETrace.BLUE);
  });

  it('throws for invalid trace option', () => {
    const input = new SelectTrace(
      { id: 'p1' } as never,
      [ETrace.RED],
      () => undefined,
    );

    expect(() =>
      input.process({ type: EPlayerInputType.TRACE, trace: ETrace.BLUE }),
    ).toThrow();
  });
});
