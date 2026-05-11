import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { EErrorCode } from '@seti/common/types/protocol/errors';
import { createErrorPayload, GameError, toErrorPayload } from './GameError.js';

interface IHttpResponse {
  status: (statusCode: number) => {
    json: (payload: unknown) => void;
  };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<IHttpResponse>();
    const { status, payload } = this.toHttpError(exception);
    response.status(status).json(payload);
  }

  private toHttpError(exception: unknown): {
    status: number;
    payload: ReturnType<typeof toErrorPayload>;
  } {
    if (exception instanceof GameError) {
      return {
        status: statusForCode(exception.code),
        payload: exception.toPayload(),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error('Unexpected HTTP exception', exception);
        return {
          status,
          payload: createErrorPayload(
            EErrorCode.INTERNAL_SERVER_ERROR,
            'Internal server error',
          ),
        };
      }

      return {
        status,
        payload: createErrorPayload(
          codeForHttpStatus(status),
          messageFromHttpException(exception),
        ),
      };
    }

    this.logger.error('Unexpected HTTP error', exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: toErrorPayload(exception),
    };
  }
}

function codeForHttpStatus(status: number): EErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return EErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return EErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return EErrorCode.GAME_NOT_FOUND;
    default:
      return EErrorCode.VALIDATION_ERROR;
  }
}

function statusForCode(code: EErrorCode): number {
  switch (code) {
    case EErrorCode.UNAUTHORIZED:
      return HttpStatus.UNAUTHORIZED;
    case EErrorCode.FORBIDDEN:
      return HttpStatus.FORBIDDEN;
    case EErrorCode.GAME_NOT_FOUND:
    case EErrorCode.PLAYER_NOT_FOUND:
      return HttpStatus.NOT_FOUND;
    case EErrorCode.INTERNAL_SERVER_ERROR:
      return HttpStatus.INTERNAL_SERVER_ERROR;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}

function messageFromHttpException(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string') {
    return body;
  }

  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join(' ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }

  return exception.message;
}
