import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameError } from '@/hooks/useGameError';
import {
  EErrorCategory,
  EErrorCode,
  EErrorDisplay,
  EErrorSeverity,
  type IErrorPayload,
} from '@/types/re-exports';

const wsMock = vi.hoisted(() => ({
  errorHandlers: new Set<(error: IErrorPayload) => void>(),
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/api/wsClient', () => ({
  wsClient: {
    onError: vi.fn((handler: (error: IErrorPayload) => void) => {
      wsMock.errorHandlers.add(handler);
      return () => wsMock.errorHandlers.delete(handler);
    }),
  },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: toastMock,
}));

function emitError(error: IErrorPayload): void {
  for (const handler of wsMock.errorHandlers) {
    handler(error);
  }
}

describe('useGameError', () => {
  beforeEach(() => {
    wsMock.errorHandlers.clear();
    toastMock.mockClear();
  });

  afterEach(() => {
    wsMock.errorHandlers.clear();
  });

  it('ignores silent errors', () => {
    renderHook(() => useGameError());

    emitError({
      code: EErrorCode.STALE_INPUT_RESPONSE,
      message: 'Prompt is stale',
    });

    expect(toastMock).not.toHaveBeenCalled();
  });

  it('renders warning toasts for game-rule business errors', () => {
    renderHook(() => useGameError());

    emitError({
      code: EErrorCode.INVALID_ACTION,
      message: 'Action is no longer available',
    });

    expect(toastMock).toHaveBeenCalledWith({
      description: 'Action is no longer available',
      title: 'Game Warning',
      variant: 'warning',
    });
  });

  it('keeps blocking errors visible until dismissed', () => {
    renderHook(() => useGameError());

    emitError({
      category: EErrorCategory.SYSTEM,
      code: EErrorCode.INTERNAL_SERVER_ERROR,
      display: EErrorDisplay.BLOCKING,
      message: 'Internal server error',
      retryable: true,
      severity: EErrorSeverity.BLOCKING,
    });

    expect(toastMock).toHaveBeenCalledWith({
      description: 'Internal server error',
      duration: null,
      title: 'Blocking Error',
      variant: 'error',
    });
  });
});
