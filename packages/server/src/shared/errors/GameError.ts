import { EErrorCode } from '@seti/common/types/protocol/errors';

export class GameError extends Error {
  public readonly code: EErrorCode;
  public readonly details?: Record<string, unknown>;

  public constructor(
    code: EErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.details = details;
  }
}
