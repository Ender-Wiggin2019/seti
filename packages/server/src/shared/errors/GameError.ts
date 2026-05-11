import {
  EErrorCode,
  type IErrorClassification,
  normalizeErrorPayload,
  type TNormalizedErrorPayload,
} from '@seti/common/types/protocol/errors';

export class GameError extends Error {
  public readonly code: EErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly category: IErrorClassification['category'];
  public readonly display: IErrorClassification['display'];
  public readonly retryable: IErrorClassification['retryable'];
  public readonly severity: IErrorClassification['severity'];

  public constructor(
    code: EErrorCode,
    message: string,
    details?: Record<string, unknown>,
    classification?: Partial<IErrorClassification>,
  ) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.details = details;
    const normalized = normalizeErrorPayload({
      code,
      message,
      ...(details === undefined ? {} : { details }),
      ...classification,
    });
    this.category = normalized.category;
    this.display = normalized.display;
    this.retryable = normalized.retryable;
    this.severity = normalized.severity;
  }

  public toPayload(): TNormalizedErrorPayload {
    return normalizeErrorPayload({
      code: this.code,
      message: this.message,
      ...(this.details === undefined ? {} : { details: this.details }),
      category: this.category,
      display: this.display,
      retryable: this.retryable,
      severity: this.severity,
    });
  }
}

export function createErrorPayload(
  code: EErrorCode,
  message: string,
  details?: Record<string, unknown>,
  classification?: Partial<IErrorClassification>,
): TNormalizedErrorPayload {
  return normalizeErrorPayload({
    code,
    message,
    ...(details === undefined ? {} : { details }),
    ...classification,
  });
}

export function toErrorPayload(error: unknown): TNormalizedErrorPayload {
  if (error instanceof GameError) {
    return error.toPayload();
  }

  return createErrorPayload(
    EErrorCode.INTERNAL_SERVER_ERROR,
    'Internal server error',
  );
}
