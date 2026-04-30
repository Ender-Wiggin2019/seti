import { ETrace } from '@seti/common/types/protocol/enums';
import { EPlayerInputType } from '@seti/common/types/protocol/playerInput';
import type { AlienState } from '@/engine/alien/AlienState.js';
import type { IGame } from '@/engine/IGame.js';
import type { PlayerInput } from '@/engine/input/PlayerInput.js';
import type { IPlayer } from '@/engine/player/IPlayer.js';

interface IPlaceTraceForTestSetupOptions {
  forceOverflow?: boolean;
}

/**
 * Test fixture helper only. Runtime trace rewards must go through
 * AlienState.createTraceInput so the player chooses the concrete trace slot.
 */
export function placeTraceForTestSetup(
  alienState: AlienState,
  player: IPlayer,
  game: IGame,
  traceColor: ETrace,
  alienIndex: number,
  options: IPlaceTraceForTestSetupOptions = {},
): void {
  if (traceColor === ETrace.ANY) {
    throw new Error('Use player input to resolve universal trace color');
  }

  const board = alienState.getBoard(alienIndex);
  if (!board) {
    throw new Error(`Missing alien board ${alienIndex}`);
  }

  const available = board.getAvailableSlots(traceColor);
  let target = options.forceOverflow
    ? available.find((slot) => !slot.isDiscovery)
    : available.find((slot) => slot.isDiscovery);
  target ??= available.find((slot) => !slot.isDiscovery);

  if (!target) {
    throw new Error(
      `No available ${traceColor} trace slot on alien ${alienIndex}`,
    );
  }

  const placed = alienState.applyTraceToSlot(
    player,
    game,
    target.slotId,
    traceColor,
  );
  if (!placed) {
    throw new Error(`Failed to place trace on ${target.slotId}`);
  }
}

export function chooseTraceSlotViaInput(
  alienState: AlienState,
  player: IPlayer,
  game: IGame,
  traceColor: ETrace,
  slotId: string,
  options: { alien?: number } = {},
): PlayerInput | undefined {
  const input = alienState.createTraceInput(player, game, traceColor, options);
  if (!input) {
    throw new Error(`Expected trace input for ${traceColor}`);
  }

  const model = input.toModel();
  if (model.type !== EPlayerInputType.OPTION) {
    throw new Error(`Expected option input, received ${model.type}`);
  }

  const target = model.options.find((option) => option.id === slotId);
  if (!target) {
    throw new Error(`Trace input does not contain slot ${slotId}`);
  }

  return input.process({
    type: EPlayerInputType.OPTION,
    optionId: slotId,
  });
}
