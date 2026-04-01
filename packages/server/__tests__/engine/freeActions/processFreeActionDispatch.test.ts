import { EResource } from '@seti/common/types/element';
import { EFreeAction } from '@seti/common/types/protocol/enums';
import { vi } from 'vitest';
import { BuyCardFreeAction } from '@/engine/freeActions/BuyCard.js';
import { CompleteMissionFreeAction } from '@/engine/freeActions/CompleteMission.js';
import { ConvertEnergyToMovementFreeAction } from '@/engine/freeActions/ConvertEnergyToMovement.js';
import { ExchangeResourcesFreeAction } from '@/engine/freeActions/ExchangeResources.js';
import { FreeActionCornerFreeAction } from '@/engine/freeActions/FreeActionCorner.js';
import { MovementFreeAction } from '@/engine/freeActions/Movement.js';
import { PlaceDataFreeAction } from '@/engine/freeActions/PlaceData.js';
import { processFreeAction } from '@/engine/freeActions/processFreeAction.js';

describe('processFreeAction — full dispatch coverage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches MOVEMENT', () => {
    const spy = vi
      .spyOn(MovementFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.MOVEMENT,
      path: ['a', 'b'],
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.anything(), [
      'a',
      'b',
    ]);
  });

  it('dispatches CONVERT_ENERGY_TO_MOVEMENT', () => {
    const spy = vi
      .spyOn(ConvertEnergyToMovementFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.CONVERT_ENERGY_TO_MOVEMENT,
      amount: 2,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.anything(), 2);
  });

  it('dispatches PLACE_DATA', () => {
    const spy = vi
      .spyOn(PlaceDataFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.PLACE_DATA,
      slotIndex: 0,
    });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('dispatches COMPLETE_MISSION', () => {
    const spy = vi
      .spyOn(CompleteMissionFreeAction, 'execute')
      .mockReturnValue(undefined);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.COMPLETE_MISSION,
      cardId: 'mission-1',
      branchIndex: 0,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'mission-1',
      0,
    );
  });

  it('dispatches USE_CARD_CORNER', () => {
    const spy = vi
      .spyOn(FreeActionCornerFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.USE_CARD_CORNER,
      cardId: 'card-1',
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'card-1',
    );
  });

  it('dispatches BUY_CARD', () => {
    const spy = vi
      .spyOn(BuyCardFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.BUY_CARD,
      cardId: 'card-2',
      fromDeck: true,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      cardId: 'card-2',
      fromDeck: true,
    });
  });

  it('dispatches EXCHANGE_RESOURCES', () => {
    const spy = vi
      .spyOn(ExchangeResourcesFreeAction, 'execute')
      .mockReturnValue({} as never);

    processFreeAction({} as never, {} as never, {
      type: EFreeAction.EXCHANGE_RESOURCES,
      from: EResource.CREDIT,
      to: EResource.ENERGY,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      EResource.CREDIT,
      EResource.ENERGY,
    );
  });

  it('throws on unsupported action type', () => {
    expect(() =>
      processFreeAction(
        {} as never,
        {} as never,
        {
          type: '__unknown__',
        } as never,
      ),
    ).toThrow();
  });
});
