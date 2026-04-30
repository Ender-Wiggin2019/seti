import { EFreeAction } from '@seti/common/types/protocol/enums';
import { vi } from 'vitest';
import type { IBuyCardResult } from '@/engine/freeActions/BuyCard.js';
import { BuyCardFreeAction } from '@/engine/freeActions/BuyCard.js';
import type { IMovementResult } from '@/engine/freeActions/Movement.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { processFreeAction } from '@/engine/freeActions/processFreeAction.js';

describe('processFreeAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches movement action', () => {
    const spy = vi
      .spyOn(MovementFreeAction, 'execute')
      .mockReturnValue({} as IMovementResult);

    processFreeAction(
      {} as never,
      {} as never,
      { type: EFreeAction.MOVEMENT, path: ['a', 'b'] } as never,
    );

    expect(spy).toHaveBeenCalledOnce();
  });

  it('passes movement target through movement action', () => {
    const spy = vi
      .spyOn(MovementFreeAction, 'execute')
      .mockReturnValue({} as IMovementResult);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.MOVEMENT,
      path: ['a', 'b'],
      target: { type: 'mascamites-capsule', id: 'capsule-1' },
    });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ['a', 'b'],
      {
        target: { type: 'mascamites-capsule', id: 'capsule-1' },
      },
    );
  });

  it('normalizes deprecated movement capsuleId into a movement target', () => {
    const spy = vi
      .spyOn(MovementFreeAction, 'execute')
      .mockReturnValue({} as IMovementResult);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.MOVEMENT,
      path: ['a', 'b'],
      capsuleId: 'capsule-1',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      ['a', 'b'],
      {
        target: { type: 'mascamites-capsule', id: 'capsule-1' },
      },
    );
  });

  it('dispatches buy card action', () => {
    const spy = vi
      .spyOn(BuyCardFreeAction, 'execute')
      .mockReturnValue({} as IBuyCardResult);

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
