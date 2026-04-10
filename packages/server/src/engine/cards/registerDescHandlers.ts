/**
 * Registers custom DESC effect handlers on the default BehaviorExecutor.
 *
 * DESC effects use `effect.desc` as their lookup token (see `appendCustom` in
 * Behavior.ts). Each handler receives `(player, game, card)` and may return
 * an `IPlayerInput` to prompt the user.
 *
 * Cards whose DESC text is purely informational (e.g. rule reminders or
 * flavour) do NOT need a handler — the executor gracefully skips unhandled
 * custom IDs.  Only register a handler when the DESC implies a programmable
 * game-state mutation that cannot be expressed through standard base effects.
 */

import { getBehaviorExecutor } from './BehaviorExecutor.js';

export function registerDescHandlers(): void {
  const _executor = getBehaviorExecutor();

  // ---------------------------------------------------------------
  // To register a handler, use:
  //
  //   executor.registerCustomHandler('desc.card-XYZ', (player, game, card) => {
  //     // implement the effect
  //     return undefined; // or return IPlayerInput for interactive choices
  //   });
  //
  // The customId must match the `desc` string passed to DESC() or
  // DESC_WITH_TYPE() in packages/common/src/constant/effect.ts data.
  // ---------------------------------------------------------------

  // Future implementations can be added here as the game engine matures.
  // Pure DESC cards (17, 18, 30, 73, 84, 90, 91, 93, 98, 99, 100,
  // 108, 120, 122) and mixed DESC cards (9, 11, 13, 15, 19-29, etc.)
  // will be implemented as their gameplay logic is finalized.
}
