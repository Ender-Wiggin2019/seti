import { EErrorCode } from '@seti/common/types/protocol/errors';
import { GameError } from '@/shared/errors/GameError.js';

describe('GameError', () => {
  it('keeps error code and message', () => {
    const error = new GameError(EErrorCode.INVALID_ACTION, 'invalid action');

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(EErrorCode.INVALID_ACTION);
    expect(error.message).toBe('invalid action');
    expect(error.name).toBe('GameError');
  });

  it('keeps optional details payload', () => {
    const details = { gameId: 'game-1', playerId: 'player-1' };
    const error = new GameError(
      EErrorCode.VALIDATION_ERROR,
      'validation failed',
      details,
    );

    expect(error.details).toStrictEqual(details);
  });
});
