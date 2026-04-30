import { EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

const VALID_PHASE_TRANSITIONS_SOURCE: ReadonlyArray<
  readonly [EPhase, readonly EPhase[]]
> = [
  [EPhase.SETUP, [EPhase.AWAIT_MAIN_ACTION]],
  [EPhase.AWAIT_MAIN_ACTION, [EPhase.IN_RESOLUTION]],
  [EPhase.IN_RESOLUTION, [EPhase.AWAIT_END_TURN, EPhase.BETWEEN_TURNS]],
  [EPhase.AWAIT_END_TURN, [EPhase.BETWEEN_TURNS]],
  [EPhase.BETWEEN_TURNS, [EPhase.AWAIT_MAIN_ACTION, EPhase.END_OF_ROUND]],
  [EPhase.END_OF_ROUND, [EPhase.AWAIT_MAIN_ACTION, EPhase.FINAL_SCORING]],
  [EPhase.FINAL_SCORING, [EPhase.GAME_OVER]],
  [EPhase.GAME_OVER, []],
];

export const VALID_PHASE_TRANSITIONS: ReadonlyMap<EPhase, readonly EPhase[]> =
  new Map(VALID_PHASE_TRANSITIONS_SOURCE);

export function isValidPhaseTransition(
  fromPhase: EPhase,
  toPhase: EPhase,
): boolean {
  const nextPhases = VALID_PHASE_TRANSITIONS.get(fromPhase);
  return nextPhases?.includes(toPhase) ?? false;
}

export function assertValidPhaseTransition(
  fromPhase: EPhase,
  toPhase: EPhase,
): void {
  if (!isValidPhaseTransition(fromPhase, toPhase)) {
    throw new GameError(
      EErrorCode.INVALID_PHASE,
      `Illegal phase transition: ${fromPhase} -> ${toPhase}`,
      {
        fromPhase,
        toPhase,
        allowedPhases: VALID_PHASE_TRANSITIONS.get(fromPhase) ?? [],
      },
    );
  }
}
