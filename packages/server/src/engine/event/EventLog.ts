import type { TGameEvent } from './GameEvent.js';

const DEFAULT_EVENT_LOG_CAPACITY = 500;

export class EventLog {
  private readonly events: TGameEvent[] = [];

  private readonly capacity: number;

  public constructor(capacity: number = DEFAULT_EVENT_LOG_CAPACITY) {
    this.capacity = capacity;
  }

  public append(event: TGameEvent): void {
    this.events.push(event);
    if (this.events.length > this.capacity) {
      this.events.splice(0, this.events.length - this.capacity);
    }
  }

  public recent(count: number): TGameEvent[] {
    if (count <= 0) {
      return [];
    }

    return this.events.slice(-count);
  }

  public size(): number {
    return this.events.length;
  }

  public toArray(): TGameEvent[] {
    return [...this.events];
  }
}
