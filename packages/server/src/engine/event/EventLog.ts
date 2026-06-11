import {
  createEventId,
  type IEventLogContext,
  type TGameEvent,
  type TGameEventDraft,
} from './GameEvent.js';

const DEFAULT_EVENT_LOG_CAPACITY = 500;
const DEFAULT_EVENT_LOG_CONTEXT: IEventLogContext = {
  turnIndex: 0,
  round: 1,
};

export class EventLog {
  private readonly events: TGameEvent[] = [];

  private readonly capacity: number;
  private readonly getContext: () => IEventLogContext;

  private nextSequence = 1;

  public constructor(
    capacity: number = DEFAULT_EVENT_LOG_CAPACITY,
    getContext: () => IEventLogContext = () => DEFAULT_EVENT_LOG_CONTEXT,
  ) {
    this.capacity = capacity;
    this.getContext = getContext;
  }

  public append(event: TGameEvent | TGameEventDraft): TGameEvent {
    const sequence = this.nextSequence;
    const seq = 'seq' in event ? event.seq : sequence;
    const context = this.getContext();
    const appended = {
      ...event,
      id: 'id' in event ? event.id : createEventId(seq),
      seq,
      turnIndex: 'turnIndex' in event ? event.turnIndex : context.turnIndex,
      round: 'round' in event ? event.round : context.round,
    } as TGameEvent;

    this.events.push(appended);
    this.nextSequence = Math.max(sequence + 1, seq + 1);
    return appended;
  }

  public recent(count: number): TGameEvent[] {
    if (count <= 0) {
      return [];
    }

    return this.events.slice(-Math.min(count, this.capacity));
  }

  public size(): number {
    return this.events.length;
  }

  public since(seq: number): TGameEvent[] {
    return this.events.filter((event) => event.seq > seq);
  }

  public toArray(): TGameEvent[] {
    return [...this.events];
  }
}
