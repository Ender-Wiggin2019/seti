export enum EGameRuntimeEvent {
  RESEARCH_TECH = 'researchTech:before',
  MAIN_ACTION_RESOLVED = 'mainAction:resolved',
  FREE_ACTION_RESOLVED = 'freeAction:resolved',
  INPUT_RESOLVED = 'input:resolved',
  MARK_PLACED = 'mark:placed',
  TRACE_PLACED = 'trace:placed',
  TURN_END = 'turn:end',
  TURN_START = 'turn:start',
  ROUND_END = 'round:end',
  ROUND_START = 'round:start',
}

export type TGameRuntimeEventType = EGameRuntimeEvent | (string & {});

export interface IGameRuntimeEventContext {
  type: TGameRuntimeEventType;
  [key: string]: unknown;
}

export type TGameRuntimeEventPatch = Partial<IGameRuntimeEventContext> | void;

export type TGameRuntimeEventListener = (
  context: Readonly<IGameRuntimeEventContext>,
) => TGameRuntimeEventPatch;

export interface IGameEventBusSubscriptionOptions {
  owner?: string;
  priority?: number;
}

interface IGameEventBusSubscription {
  type: TGameRuntimeEventType;
  listener: TGameRuntimeEventListener;
  owner?: string;
  priority: number;
  order: number;
}

export class GameEventBus {
  private subscriptions: IGameEventBusSubscription[] = [];

  private nextOrder = 0;

  public subscribe(
    type: TGameRuntimeEventType,
    listener: TGameRuntimeEventListener,
    options: IGameEventBusSubscriptionOptions = {},
  ): () => void {
    const subscription: IGameEventBusSubscription = {
      type,
      listener,
      owner: options.owner,
      priority: options.priority ?? 0,
      order: this.nextOrder,
    };
    this.nextOrder += 1;
    this.subscriptions.push(subscription);

    return () => {
      this.subscriptions = this.subscriptions.filter(
        (candidate) => candidate !== subscription,
      );
    };
  }

  public unsubscribeOwner(owner: string): void {
    this.subscriptions = this.subscriptions.filter(
      (subscription) => subscription.owner !== owner,
    );
  }

  public emit<TContext extends IGameRuntimeEventContext>(
    context: TContext,
  ): TContext {
    let currentContext: IGameRuntimeEventContext = { ...context };
    const listeners = this.subscriptions
      .filter((subscription) => subscription.type === context.type)
      .sort(
        (left, right) =>
          left.priority - right.priority || left.order - right.order,
      );

    for (const subscription of listeners) {
      const patch = subscription.listener(Object.freeze({ ...currentContext }));
      if (patch) {
        currentContext = { ...currentContext, ...patch };
      }
    }

    return currentContext as TContext;
  }
}
