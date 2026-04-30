# DeferredAction — Queued Effect System

> Source: `deferredActions/DeferredAction.ts`, `deferredActions/DeferredActionsQueue.ts`, `deferredActions/Priority.ts`, and all concrete `deferredActions/*.ts`

## Core Idea

Card effects often involve multiple steps, some requiring player input. Instead of executing everything in a deep synchronous stack, effects are broken into **`DeferredAction`** units and pushed onto a **priority-ordered queue**. The engine drains the queue at each game transition, pausing when player input is needed.

This is the **engine-side scheduling mechanism**, distinct from `PlayerInput` which is the player-facing decision. A `DeferredAction.execute()` may *produce* a `PlayerInput`, bridging the two systems.

## DeferredAction

```typescript
abstract class DeferredAction<T = undefined> {
  public queueId: number = -1;  // Insertion order (set by queue)
  constructor(
    public player: IPlayer,
    public priority: Priority = Priority.DEFAULT,
  ) {}

  abstract execute(): PlayerInput | undefined;

  // Chain: run more logic after this action completes
  andThen(cb: (param: T) => void): this;
}
```

**Contract**: `execute()` returns:
- `PlayerInput` → player must resolve this before the engine continues
- `undefined` → effect is complete, move to next queued action

### SimpleDeferredAction

Lightweight wrapper for inline lambdas:

```typescript
class SimpleDeferredAction<T> extends DeferredAction<T> {
  constructor(player, public execute: () => PlayerInput | undefined, priority?) { ... }
}
```

Used by `Player.defer()` shorthand:

```typescript
// In Player:
defer(input: PlayerInput | undefined | void | (() => PlayerInput | undefined),
      priority = Priority.DEFAULT): void {
  if (input === undefined) return;
  const cb = typeof input === 'function' ? input : () => input;
  this.game.defer(new SimpleDeferredAction(this, cb, priority));
}
```

## Priority System

Actions are ordered by priority (lower number = higher priority). When two share the same priority, insertion order (`queueId`) breaks ties.

```typescript
enum Priority {
  SUPERPOWER = -1,
  DECLARE_CLONE_TAG,           // Must happen first (Pathfinders)
  COST,                         // Pay costs before effects
  BEFORE_PHARMACY_UNION,
  PHARMACY_UNION,
  OPPONENT_TRIGGER,             // Other players' card reactions
  HYPERSPACE_DRIVE_PROTOTYPE,
  OLYMPUS_CONFERENCE,
  SPONSORED_ACADEMIES,
  DRAW_CARDS,
  BUILD_COLONY,
  INCREASE_COLONY_TRACK,
  PLACE_OCEAN_TILE,
  IDENTIFY_UNDERGROUND_RESOURCE,
  EXCAVATE_UNDERGROUND_RESOURCE,
  DEFAULT,                      // Most card effects
  DISCARD_AND_DRAW,
  ATTACK_OPPONENT,
  LOSE_AS_MUCH_AS_POSSIBLE,
  GAIN_RESOURCE_OR_PRODUCTION,
  LOSE_RESOURCE_OR_PRODUCTION,
  DECREASE_COLONY_TRACK_AFTER_TRADE,
  DISCARD_CARDS,
  ROBOTIC_WORKFORCE,
  BACK_OF_THE_LINE,
}
```

Ordering ensures: costs are paid before effects, opponent reactions trigger at the right time, draws happen before discard-and-draw, attacks happen after default effects, etc.

## DeferredActionsQueue

```typescript
class DeferredActionsQueue {
  private queue: Array<IDeferredAction<any>> = [];

  push(action): void;           // Add to queue with auto-incrementing queueId

  // Drain entire queue, call cb when empty
  runAll(cb: () => void): void {
    const action = this.popNextItem();  // Highest priority
    if (action !== undefined) {
      this.run(action, () => this.runAll(cb));
    } else {
      cb();
    }
  }

  // Drain only actions for a specific player
  runAllFor(player: IPlayer, cb: () => void): void;

  // Execute a single action
  run(action: IDeferredAction, cb: () => void): void {
    const input = action.execute();
    if (input !== undefined) {
      action.player.setWaitingFor(input, cb);  // Pause for player input
    } else {
      cb();                                     // Continue immediately
    }
  }
}
```

## Concrete DeferredAction Catalog

### Resource & Production

| Class | Effect |
|-------|--------|
| `GainResourcesDeferred` | Add stock of one resource |
| `GainStock` | Add a `Units` bundle to stock |
| `GainProduction` | Increase one production track |
| `LoseProduction` | Decrease one production track |
| `SelectPaymentDeferred` | Pay M€ with alternative resources |
| `StealResources` | Steal stock from opponent |
| `RemoveResources` | Remove stock with protection checks |

### Card-Related

| Class | Effect |
|-------|--------|
| `AddResourcesToCard` | Place card resources on an eligible card |
| `AddResourcesToCards` | Split resources across multiple cards |
| `RemoveResourcesFromCard` | Remove/steal card resources |
| `DrawCards` | Draw from deck with filtering |
| `ChooseCards` | Draw then keep/pay/discard flow |
| `DiscardCards` | Select cards to discard from hand |
| `PlayProjectCard` | Select and play a project card |

### Tile Placement

| Class | Effect |
|-------|--------|
| `PlaceOceanTile` | Select space for ocean |
| `PlaceCityTile` | Select space for city |
| `PlaceGreeneryTile` | Select space for greenery |
| `PlaceTile` | Place arbitrary tile type |
| `PlaceHazardTile` | Ares: place mild hazard |

### Combat / Interaction

| Class | Effect |
|-------|--------|
| `RemoveAnyPlants` | Attack: strip plants from opponent |
| `DecreaseAnyProduction` | Pick opponent, reduce their production |
| `SelectProductionToLoseDeferred` | Choose production units to lose |

### Colony / Turmoil / Expansion

| Class | Effect |
|-------|--------|
| `BuildColony` | Select colony to build on |
| `GiveColonyBonus` | Fan out colony bonuses (special: runs all at once) |
| `IncreaseColonyTrack` | Advance colony track steps |
| `RemoveColonyFromGame` | Remove a colony tile |
| `SendDelegateToArea` | Place Turmoil delegate(s) |
| `ChooseAlliedParty` | Choose Turmoil allied party |
| `ChoosePoliticalAgenda` | Choose ruling party bonus/policy |

### Utility

| Class | Effect |
|-------|--------|
| `RunNTimes<T>` | Abstract: run same prompt N times, collect results |
| `SelectCardDeferred` | Deferred wrapper around `SelectCard` with auto-pick |
| `SelectResourceTypeDeferred` | Choose from a list of resource types |

## `andThen` Chaining

Both `DeferredAction` and `PlayerInput` support `andThen`, but they serve different purposes:

```typescript
// DeferredAction: run more logic after the queued effect completes
game.defer(new SelectPaymentDeferred(player, cost, {title: 'Pay for milestone'}))
  .andThen(() => {
    game.claimedMilestones.push({player, milestone});
  });

// PlayerInput: set the callback for when the player responds (see input.md)
new SelectSpace('Choose space', spaces)
  .andThen((space) => { ... });
```

## The Complete Flow

```
Card.play(player)
  → returns PlayerInput | undefined
  → player.defer(result)
    → wraps in SimpleDeferredAction → pushes to game.deferredActions

Engine reaches transition point (e.g., end of action)
  → deferredActions.runAll(continueCallback)
    → pop highest-priority action
    → action.execute()
      → returns PlayerInput?
        YES → player.setWaitingFor(input, cb)
              → Client responds → player.process(response)
              → may defer more actions → cb() → runAll continues
        NO  → cb() → runAll continues
    → queue empty → continueCallback()
```

## Key Takeaways

1. **DeferredAction = engine-scheduled effect**, PlayerInput = player-facing decision
2. **Priority queue** ensures correct ordering (costs → effects → reactions → cleanup)
3. **`execute() → PlayerInput | undefined`** continuation pattern — return input to pause
4. **`andThen` on DeferredAction** — post-completion logic without nesting
5. **Drain-at-every-transition** — the engine calls `runAll()` at each phase boundary
6. **Rich catalog** of concrete actions — most game effects have a reusable DeferredAction
