import { vi } from 'vitest';

type TEventHandler = (...args: unknown[]) => void;

export class MockSocket {
  private listeners = new Map<string, Set<TEventHandler>>();
  connected = true;

  on(event: string, handler: TEventHandler): this {
    const handlers = this.listeners.get(event) ?? new Set<TEventHandler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  off(event: string, handler?: TEventHandler): this {
    if (handler) {
      this.listeners.get(event)?.delete(handler);
    } else {
      this.listeners.delete(event);
    }
    return this;
  }

  emit = vi.fn((event: string, ..._args: unknown[]) => {
    return event;
  });

  simulateEvent(event: string, ...data: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...data);
      }
    }
  }

  connect = vi.fn(() => {
    this.connected = true;
    this.simulateEvent('connect');
  });

  disconnect = vi.fn(() => {
    this.connected = false;
    this.simulateEvent('disconnect', 'io client disconnect');
  });
}

export function createMockSocket(): MockSocket {
  return new MockSocket();
}
