import {
  BadRequestException,
  Controller,
  Get,
  type INestApplication,
  InternalServerErrorException,
  Logger,
  Module,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  EErrorCategory,
  EErrorCode,
  EErrorDisplay,
  EErrorSeverity,
} from '@seti/common/types/protocol/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameError } from '@/shared/errors/GameError.js';
import { HttpErrorFilter } from '@/shared/errors/HttpErrorFilter.js';

@Controller('error-filter-test')
class ErrorFilterTestController {
  @Get('bad-request')
  badRequest() {
    throw new BadRequestException('Room is full');
  }

  @Get('game-error')
  gameError() {
    throw new GameError(EErrorCode.GAME_NOT_FOUND, 'Game game-1 not found');
  }

  @Get('internal')
  internal() {
    throw new Error('database password leaked');
  }

  @Get('internal-http')
  internalHttp() {
    throw new InternalServerErrorException('database password leaked');
  }
}

@Module({ controllers: [ErrorFilterTestController] })
class ErrorFilterTestModule {}

function getBaseUrl(app: INestApplication): string {
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve test server address');
  }
  return `http://127.0.0.1:${address.port}`;
}

describe('HttpErrorFilter', () => {
  let app: INestApplication;
  let baseUrl = '';

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module = await Test.createTestingModule({
      imports: [ErrorFilterTestModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new HttpErrorFilter());
    await app.listen(0);
    baseUrl = getBaseUrl(app);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
  });

  it('maps Nest business exceptions to shared warning payloads', async () => {
    const res = await fetch(`${baseUrl}/error-filter-test/bad-request`);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      category: EErrorCategory.VALIDATION,
      code: EErrorCode.VALIDATION_ERROR,
      display: EErrorDisplay.TOAST,
      message: 'Room is full',
      retryable: true,
      severity: EErrorSeverity.WARNING,
    });
  });

  it('preserves GameError metadata on HTTP boundaries', async () => {
    const res = await fetch(`${baseUrl}/error-filter-test/game-error`);

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      category: EErrorCategory.BUSINESS,
      code: EErrorCode.GAME_NOT_FOUND,
      display: EErrorDisplay.BLOCKING,
      message: 'Game game-1 not found',
      retryable: false,
      severity: EErrorSeverity.BLOCKING,
    });
  });

  it('sanitizes unexpected HTTP errors', async () => {
    const res = await fetch(`${baseUrl}/error-filter-test/internal`);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      category: EErrorCategory.SYSTEM,
      code: EErrorCode.INTERNAL_SERVER_ERROR,
      display: EErrorDisplay.BLOCKING,
      message: 'Internal server error',
      retryable: true,
      severity: EErrorSeverity.BLOCKING,
    });
  });

  it('sanitizes Nest 5xx HTTP exceptions', async () => {
    const res = await fetch(`${baseUrl}/error-filter-test/internal-http`);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      category: EErrorCategory.SYSTEM,
      code: EErrorCode.INTERNAL_SERVER_ERROR,
      display: EErrorDisplay.BLOCKING,
      message: 'Internal server error',
      retryable: true,
      severity: EErrorSeverity.BLOCKING,
    });
  });
});
