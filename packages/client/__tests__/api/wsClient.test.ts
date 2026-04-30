import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IPublicGameState } from '@/types/re-exports';

type THandler = (...args: unknown[]) => void;

interface IMockSocket {
  connected: boolean;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  __handlers: Map<string, Set<THandler>>;
}

const createdSockets: IMockSocket[] = [];

function createMockSocket(): IMockSocket {
  const handlers = new Map<string, Set<THandler>>();

  return {
    connected: true,
    on: vi.fn((event: string, handler: THandler) => {
      const existing = handlers.get(event) ?? new Set<THandler>();
      existing.add(handler);
      handlers.set(event, existing);
    }),
    off: vi.fn((event: string, handler: THandler) => {
      handlers.get(event)?.delete(handler);
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    __handlers: handlers,
  };
}

function emitSocketEvent(
  socket: IMockSocket,
  event: string,
  payload: unknown,
): void {
  for (const handler of socket.__handlers.get(event) ?? []) {
    handler(payload);
  }
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const socket = createMockSocket();
    createdSockets.push(socket);
    return socket;
  }),
}));

describe('wsClient', () => {
  beforeEach(() => {
    createdSockets.length = 0;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('binds game:state listeners that subscribe before the socket connects', async () => {
    const { wsClient } = await import('@/api/wsClient');
    const handleState = vi.fn();
    const gameState = { gameId: 'game-1' } as IPublicGameState;

    wsClient.onState(handleState);
    wsClient.connect('token-a');

    expect(createdSockets).toHaveLength(1);

    emitSocketEvent(createdSockets[0], 'game:state', { gameState });

    expect(handleState).toHaveBeenCalledWith(gameState);
  });

  it('rebinds game:state listeners after replacing the socket instance', async () => {
    const { wsClient } = await import('@/api/wsClient');
    const handleState = vi.fn();
    const firstState = { gameId: 'game-1' } as IPublicGameState;
    const secondState = { gameId: 'game-2' } as IPublicGameState;

    wsClient.connect('token-a');
    wsClient.onState(handleState);

    emitSocketEvent(createdSockets[0], 'game:state', { gameState: firstState });
    expect(handleState).toHaveBeenCalledWith(firstState);

    wsClient.connect('token-b');

    expect(createdSockets).toHaveLength(2);
    expect(createdSockets[0].disconnect).toHaveBeenCalledTimes(1);

    emitSocketEvent(createdSockets[1], 'game:state', {
      gameState: secondState,
    });

    expect(handleState).toHaveBeenCalledWith(secondState);
  });
});
