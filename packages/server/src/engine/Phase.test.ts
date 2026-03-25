import { EPhase } from '@seti/common/types/protocol/enums';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';
import { assertValidPhaseTransition, isValidPhaseTransition } from './Phase.js';

describe('Phase transitions', () => {
  it('accepts legal transitions', () => {
    expect(isValidPhaseTransition(EPhase.SETUP, EPhase.AWAIT_MAIN_ACTION)).toBe(
      true,
    );
    expect(
      isValidPhaseTransition(EPhase.AWAIT_MAIN_ACTION, EPhase.IN_RESOLUTION),
    ).toBe(true);
    expect(
      isValidPhaseTransition(EPhase.BETWEEN_TURNS, EPhase.END_OF_ROUND),
    ).toBe(true);
    expect(
      isValidPhaseTransition(EPhase.END_OF_ROUND, EPhase.FINAL_SCORING),
    ).toBe(true);
    expect(isValidPhaseTransition(EPhase.FINAL_SCORING, EPhase.GAME_OVER)).toBe(
      true,
    );
  });

  it('rejects illegal transitions', () => {
    expect(isValidPhaseTransition(EPhase.SETUP, EPhase.GAME_OVER)).toBe(false);
    expect(() =>
      assertValidPhaseTransition(EPhase.SETUP, EPhase.GAME_OVER),
    ).toThrow(GameError);

    try {
      assertValidPhaseTransition(EPhase.SETUP, EPhase.GAME_OVER);
    } catch (error) {
      const gameError = error as GameError;
      expect(gameError.code).toBe(EErrorCode.INVALID_PHASE);
    }
  });
});
