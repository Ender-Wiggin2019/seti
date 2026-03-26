import { EFreeAction } from '@seti/common/types/protocol/enums';
import { vi } from 'vitest';
import { BuyCardFreeAction } from '@/engine/freeActions/BuyCard.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { processFreeAction } from '@/engine/freeActions/processFreeAction.js';

describe('processFreeAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches movement action', () => {
    const spy = vi
      .spyOn(MovementFreeAction, 'execute')
      .mockImplementation(() => undefined);

    processFreeAction(
      {} as never,
      {} as never,
      { type: EFreeAction.MOVEMENT, path: ['a', 'b'] } as never,
    );

    expect(spy).toHaveBeenCalledOnce();
  });

  it('dispatches buy card action', () => {
    const spy = vi
      .spyOn(BuyCardFreeAction, 'execute')
      .mockImplementation(() => undefined);

    processFreeAction(
      {} as never,
      {} as never,
      { type: EFreeAction.BUY_CARD, cardId: 'c1', fromDeck: false } as never,
    );

    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      cardId: 'c1',
      fromDeck: false,
    });
  });

  it('throws on unsupported action type', () => {
    expect(() =>
      processFreeAction(
        {} as never,
        {} as never,
        { type: '__unknown__' } as never,
      ),
    ).toThrow();
  });
});
