export enum EErrorCode {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  INVALID_PHASE = 'INVALID_PHASE',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
  INVALID_ACTION = 'INVALID_ACTION',
  INVALID_FREE_ACTION = 'INVALID_FREE_ACTION',
  INVALID_INPUT_RESPONSE = 'INVALID_INPUT_RESPONSE',
  STALE_INPUT_RESPONSE = 'STALE_INPUT_RESPONSE',
  INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export enum EErrorSeverity {
  SILENT = 'silent',
  WARNING = 'warning',
  ERROR = 'error',
  BLOCKING = 'blocking',
}

export enum EErrorCategory {
  AUTH = 'auth',
  BUSINESS = 'business',
  SYSTEM = 'system',
  TRANSPORT = 'transport',
  VALIDATION = 'validation',
}

export enum EErrorDisplay {
  NONE = 'none',
  TOAST = 'toast',
  BLOCKING = 'blocking',
}

export interface IErrorClassification {
  category: EErrorCategory;
  display: EErrorDisplay;
  retryable: boolean;
  severity: EErrorSeverity;
}

export interface IErrorPayload {
  code: EErrorCode;
  message: string;
  details?: Record<string, unknown>;
  category?: EErrorCategory;
  display?: EErrorDisplay;
  retryable?: boolean;
  severity?: EErrorSeverity;
}

export type TNormalizedErrorPayload = IErrorPayload &
  Required<IErrorClassification>;

export function classifyErrorCode(code: EErrorCode): IErrorClassification {
  switch (code) {
    case EErrorCode.CONNECTION_ERROR:
      return {
        category: EErrorCategory.TRANSPORT,
        display: EErrorDisplay.BLOCKING,
        retryable: true,
        severity: EErrorSeverity.BLOCKING,
      };

    case EErrorCode.STALE_INPUT_RESPONSE:
      return {
        category: EErrorCategory.TRANSPORT,
        display: EErrorDisplay.NONE,
        retryable: false,
        severity: EErrorSeverity.SILENT,
      };

    case EErrorCode.INVALID_PHASE:
    case EErrorCode.NOT_YOUR_TURN:
    case EErrorCode.INVALID_ACTION:
    case EErrorCode.INVALID_FREE_ACTION:
    case EErrorCode.INVALID_INPUT_RESPONSE:
    case EErrorCode.INSUFFICIENT_RESOURCES:
      return {
        category: EErrorCategory.BUSINESS,
        display: EErrorDisplay.TOAST,
        retryable: true,
        severity: EErrorSeverity.WARNING,
      };

    case EErrorCode.VALIDATION_ERROR:
      return {
        category: EErrorCategory.VALIDATION,
        display: EErrorDisplay.TOAST,
        retryable: true,
        severity: EErrorSeverity.WARNING,
      };

    case EErrorCode.UNAUTHORIZED:
    case EErrorCode.FORBIDDEN:
      return {
        category: EErrorCategory.AUTH,
        display: EErrorDisplay.BLOCKING,
        retryable: false,
        severity: EErrorSeverity.BLOCKING,
      };

    case EErrorCode.GAME_NOT_FOUND:
    case EErrorCode.PLAYER_NOT_FOUND:
      return {
        category: EErrorCategory.BUSINESS,
        display: EErrorDisplay.BLOCKING,
        retryable: false,
        severity: EErrorSeverity.BLOCKING,
      };

    case EErrorCode.INTERNAL_SERVER_ERROR:
      return {
        category: EErrorCategory.SYSTEM,
        display: EErrorDisplay.BLOCKING,
        retryable: true,
        severity: EErrorSeverity.BLOCKING,
      };
  }
}

export function normalizeErrorPayload(
  payload: IErrorPayload,
): TNormalizedErrorPayload {
  const defaults = classifyErrorCode(payload.code);
  return {
    ...payload,
    category: payload.category ?? defaults.category,
    display: payload.display ?? defaults.display,
    retryable: payload.retryable ?? defaults.retryable,
    severity: payload.severity ?? defaults.severity,
  };
}
