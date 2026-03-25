# PlayerInput — Synchronous Choice System

> Source: `PlayerInput.ts`, `inputs/OrOptions.ts`, `inputs/SelectCard.ts`, `inputs/SelectOption.ts`, `inputs/SelectSpace.ts`, `inputs/AndOptions.ts`, `inputs/OptionsPlayerInput.ts`, and all other `inputs/*.ts`

## Core Idea

`PlayerInput` represents **a pending decision the player must make right now**. It is the server-side model of "what the UI should show." Each input type knows how to serialize itself for the client (`toModel`) and how to validate + apply the client's response (`process`).

This is distinct from `DeferredAction`, which is a **queued effect** the engine schedules. A `DeferredAction.execute()` may *produce* a `PlayerInput`, but they are separate abstractions.

## Interface & Base Class

```typescript
interface PlayerInput {
  type: PlayerInputType;   // 'card', 'space', 'option', 'or', 'and', ...
  buttonLabel: string;
  title: string | Message;
  eligibleForDefault?: boolean;

  cb(...item: any): PlayerInput | undefined;
  toModel(player: IPlayer): PlayerInputModel;
  process(response: InputResponse, player: IPlayer): PlayerInput | undefined;
}

abstract class BasePlayerInput<T> implements PlayerInput {
  public cb: (param: T) => PlayerInput | undefined = () => undefined;

  // Fluent callback setter — the primary way to attach behavior
  andThen(cb: (param: T) => PlayerInput | undefined): this;
  setTitle(title): this;
  setButtonLabel(label): this;
}
```

**Key contract**: `process()` validates the client response and calls `cb()`. It may return another `PlayerInput` (chained decisions) or `undefined` (done).

## Input Type Catalog

### Primitive Inputs

| Class | Type | What It Resolves |
|-------|------|-----------------|
| `SelectOption` | `'option'` | Simple confirmation button (e.g., "Increase temperature") |
| `SelectCard<T>` | `'card'` | Choose min..max cards from a list |
| `SelectSpace` | `'space'` | Choose a hex on the board |
| `SelectAmount` | `'amount'` | Choose a number in [min, max] |
| `SelectPlayer` | `'player'` | Choose another player |
| `SelectColony` | `'colony'` | Choose a colony tile |
| `SelectParty` | `'party'` | Choose a Turmoil party |
| `SelectDelegate` | `'delegate'` | Choose a player or NEUTRAL as delegate |
| `SelectPayment` | `'payment'` | Choose how to pay M€ with steel/titanium/heat/etc. |
| `SelectResource` | `'resource'` | Choose one resource type |
| `SelectResources` | `'resources'` | Distribute N units across resource types |
| `SelectProductionToLose` | `'productionToLose'` | Choose production units to lose |
| `SelectGlobalEvent` | `'globalEvent'` | Choose a Turmoil global event |

### Composite Inputs

| Class | Type | Behavior |
|-------|------|----------|
| `OrOptions` | `'or'` | Player picks **one** of N sub-inputs |
| `AndOptions` | `'and'` | Player resolves **all** sub-inputs |

Both extend `OptionsInput<T>` which holds a `PlayerInput[]` array.

### Specialized / Compound Inputs

| Class | What It Does |
|-------|-------------|
| `SelectProjectCardToPlay` | Choose a project card from hand + payment handling |
| `SelectInitialCards` | Staged corporation → project → prelude → CEO selection |
| `GainResources` | `AndOptions` of 6 `SelectAmount` for distributing resources |
| `ShiftAresGlobalParameters` | Ares hazard threshold adjustment (4 deltas) |
| `UndoActionOption` | Preset `SelectOption` for undo |

## Composite Pattern: OrOptions

The most important composite. Builds nested decision trees:

```typescript
class OrOptions extends OptionsInput<undefined> {
  constructor(...options: Array<PlayerInput>) { ... }

  process(input, player) {
    // Validate index, delegate to the selected child
    player.defer(this.options[input.index].process(input.response, player));
    return this.cb(undefined);
  }

  // Optimization: collapse when 0 or 1 option
  reduce(): PlayerInput | undefined {
    if (this.options.length === 0) return undefined;
    if (this.options.length === 1) return this.options[0].cb();
    return this;
  }
}
```

Usage pattern (building an action menu):

```typescript
const action = new OrOptions()
  .setTitle('Take your next action')
  .setButtonLabel('Take action');

action.options.push(milestoneOption);    // OrOptions of milestones
action.options.push(convertPlants);       // SelectOption
action.options.push(playableCards);       // SelectProjectCardToPlay
action.options.push(standardProjects);    // SelectCard
action.options.push(passOption);          // SelectOption
// ...
player.setWaitingFor(action, callback);
```

## Fluent `andThen` Pattern

All inputs use `andThen` to set their callback inline:

```typescript
new SelectSpace('Select space for ocean', availableSpaces)
  .andThen((space) => {
    game.addOcean(player, space);
    return undefined;  // Done — no further input needed
  });

new SelectOption('Increase temperature', 'Increase')
  .andThen(() => {
    game.increaseTemperature(player, 1);
    return undefined;
  });

new SelectCard('Choose cards to keep', 'Keep', cards, {min: 1, max: 3})
  .andThen((selected) => {
    // Process selected cards
    return undefined;
  });
```

## SelectCard Configuration

`SelectCard<T>` is highly configurable:

```typescript
type Options = {
  max: number;           // Max cards to select (default 1)
  min: number;           // Min cards to select (default 1)
  selectBlueCardAction: boolean;  // Blue card action UI mode
  enabled: ReadonlyArray<boolean> | undefined;  // Per-card enable/disable
  played: boolean | CardName.SELF_REPLICATING_ROBOTS;  // Show resources vs cost
  showOwner: boolean;    // Show card owner name
  showSelectAll: boolean; // Show select all toggle
}
```

## Key Takeaways

1. **PlayerInput = what the player sees** — a synchronous, serializable decision
2. **`process(response)` validates + executes** — returns further input or undefined
3. **`andThen()` fluent API** — inline callback attachment, reads naturally
4. **Composite `OrOptions`/`AndOptions`** — build complex menus from simple primitives
5. **`toModel()` for client, `process()` for server** — clean separation of serialization and logic
6. **Independent from DeferredAction** — inputs are produced by deferred actions, but are not themselves queued effects
