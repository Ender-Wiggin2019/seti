import {
  classifyErrorCode,
  EErrorCategory,
  EErrorCode,
  EErrorDisplay,
  EErrorSeverity,
  normalizeErrorPayload,
} from '@seti/common/types/protocol/errors';
import { describe, expect, it } from 'vitest';

describe('protocol error classification', () => {
  it('classifies stale input responses as silent transport errors', () => {
    expect(classifyErrorCode(EErrorCode.STALE_INPUT_RESPONSE)).toStrictEqual({
      category: EErrorCategory.TRANSPORT,
      display: EErrorDisplay.NONE,
      retryable: false,
      severity: EErrorSeverity.SILENT,
    });
  });

  it('classifies ordinary game-rule rejections as warning business errors', () => {
    expect(classifyErrorCode(EErrorCode.INVALID_ACTION)).toStrictEqual({
      category: EErrorCategory.BUSINESS,
      display: EErrorDisplay.TOAST,
      retryable: true,
      severity: EErrorSeverity.WARNING,
    });
  });

  it('classifies auth, missing game, and internal failures as blocking errors', () => {
    expect(classifyErrorCode(EErrorCode.CONNECTION_ERROR)).toMatchObject({
      category: EErrorCategory.TRANSPORT,
      display: EErrorDisplay.BLOCKING,
      retryable: true,
      severity: EErrorSeverity.BLOCKING,
    });
    expect(classifyErrorCode(EErrorCode.UNAUTHORIZED).display).toBe(
      EErrorDisplay.BLOCKING,
    );
    expect(classifyErrorCode(EErrorCode.GAME_NOT_FOUND).display).toBe(
      EErrorDisplay.BLOCKING,
    );
    expect(classifyErrorCode(EErrorCode.INTERNAL_SERVER_ERROR)).toMatchObject({
      category: EErrorCategory.SYSTEM,
      display: EErrorDisplay.BLOCKING,
      severity: EErrorSeverity.BLOCKING,
    });
  });

  it('normalizes legacy payloads without losing explicit overrides', () => {
    expect(
      normalizeErrorPayload({
        code: EErrorCode.INSUFFICIENT_RESOURCES,
        message: 'Not enough energy',
      }),
    ).toStrictEqual({
      category: EErrorCategory.BUSINESS,
      code: EErrorCode.INSUFFICIENT_RESOURCES,
      display: EErrorDisplay.TOAST,
      message: 'Not enough energy',
      retryable: true,
      severity: EErrorSeverity.WARNING,
    });

    expect(
      normalizeErrorPayload({
        category: EErrorCategory.SYSTEM,
        code: EErrorCode.INVALID_ACTION,
        display: EErrorDisplay.NONE,
        message: 'Already handled inline',
        retryable: false,
        severity: EErrorSeverity.SILENT,
      }),
    ).toStrictEqual({
      category: EErrorCategory.SYSTEM,
      code: EErrorCode.INVALID_ACTION,
      display: EErrorDisplay.NONE,
      message: 'Already handled inline',
      retryable: false,
      severity: EErrorSeverity.SILENT,
    });
  });
});
