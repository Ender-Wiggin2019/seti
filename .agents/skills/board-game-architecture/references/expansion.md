# Expansion Integration — Composition over Inheritance

> Source: `moon/MoonExpansion.ts`, `game/GameOptions.ts`, `GameCards.ts`, `globalInitialize.ts`, `Game.ts`

## Core Idea

Expansions are integrated through **5 layers of composition**, never inheritance. No `Game` subclass per expansion. Each layer is independent — you can add cards without rules, or rules without cards.

## Layer 1: Configuration

`GameOptions` holds per-expansion boolean flags:

```typescript
interface GameOptions {
  venusNextExtension: boolean;
  coloniesExtension: boolean;
  turmoilExtension: boolean;
  moonExpansion: boolean;
  pathfindersExpansion: boolean;
  underworldExpansion: boolean;
  aresExtension: boolean;
  // ... plus variant flags
}
```

These flags drive all other integration layers.

## Layer 2: Card Registration

Each expansion declares a `ModuleManifest` containing card factories:

```typescript
export const MOON_CARD_MANIFEST = new ModuleManifest({
  module: 'moon',
  projectCards: { [CardName.X]: { Factory: X }, ... },
  corporationCards: { ... },
  standardProjects: { ... },
  cardsToRemove: [CardName.REPLACED_CARD],  // Remove base game cards
});
```

`GameCards` maps expansion flags to manifests and filters:

```typescript
const manifests: Array<[boolean, ModuleManifest]> = [
  [true, BASE_CARD_MANIFEST],
  [gameOptions.moonExpansion, MOON_CARD_MANIFEST],
  // ...
];
```

Cross-expansion compatibility per card:

```typescript
{ Factory: SomeCard, compatibility: ['moon', 'turmoil'] }
// Only included when both Moon AND Turmoil are enabled
```

## Layer 3: State Injection

Expansion data lives as optional fields on `IGame`:

```typescript
interface IGame {
  turmoil: Turmoil | undefined;
  moonData: MoonData | undefined;
  pathfindersData: PathfindersData | undefined;
  aresData: AresData | undefined;
  underworldData: UnderworldData;  // Always present (no-op default)
  colonies: Array<IColony>;
}
```

Each expansion's data type encapsulates all its state:

```typescript
interface MoonData {
  moon: MoonBoard;
  habitatRate: number;
  miningRate: number;
  logisticRate: number;
  lunaFirstPlayer: IPlayer | undefined;
}
```

## Layer 4: Rule Entry Points (Static Façade + Guard)

Each expansion exposes a static helper class with guard methods:

```typescript
class MoonExpansion {
  private constructor() {}  // No instances

  // Guard: execute only if expansion is active
  static ifMoon<T>(game: IGame, cb: (moonData: MoonData) => T): T | undefined {
    if (game.gameOptions.moonExpansion && game.moonData !== undefined) {
      return cb(game.moonData);
    }
    return undefined;
  }

  // Strict: throws if not active
  static moonData(game: IGame): MoonData { ... }

  // Operations
  static raiseHabitatRate(player, count?): void;
  static addMineTile(player, spaceId): void;
  static initialize(options, rng): MoonData;
}
```

### Guard Pattern Variants

| Expansion | Guard | Handler |
|-----------|-------|---------|
| Moon | `MoonExpansion.ifMoon(game, cb)` | `MoonExpansion` (static) |
| Turmoil | `Turmoil.ifTurmoil(game, cb)` | `TurmoilHandler` + `Turmoil` instance |
| Ares | `AresHandler.ifAres(game, cb)` | `AresHandler` (static) |
| Pathfinders | Direct calls with option checks | `PathfindersExpansion` (static) |
| Underworld | `UnderworldExpansion.xxx(game)` | `UnderworldExpansion` (static) |
| Colonies | `ColoniesHandler.xxx(game)` | `ColoniesHandler` (static) |

Usage in game code (always safe to call):

```typescript
MoonExpansion.ifMoon(this, (moonData) => {
  if (moonData.habitatRate < MAXIMUM_HABITAT_RATE) {
    options.push(new SelectOption('Raise habitat rate', ...));
  }
});

Turmoil.ifTurmoil(this, (turmoil) => {
  turmoil.endGeneration(this);
});
```

## Layer 5: Startup Wiring

`globalInitialize()` registers cross-cutting concerns:

```typescript
function globalInitialize() {
  registerBehaviorExecutor(new Executor());    // Handles all expansion behaviors
  initializeGlobalEventDealer(ALL_MODULE_MANIFESTS);  // Turmoil event deck
}
```

The `BehaviorExecutor` is expansion-aware — it handles Moon tile placement, Turmoil delegates, Underworld excavation, etc.

## Integration in Game Lifecycle

### Initialization (`Game.newInstance`)

```typescript
if (gameOptions.aresExtension) game.aresData = AresSetup.initialData(...);
if (gameOptions.coloniesExtension) { /* ColonyDealer */ }
if (gameOptions.turmoilExtension) game.turmoil = Turmoil.newInstance(game, ...);
if (gameOptions.moonExpansion) game.moonData = MoonExpansion.initialize(...);
if (gameOptions.pathfindersExpansion) game.pathfindersData = PathfindersExpansion.initialize(game);
if (gameOptions.underworldExpansion) game.underworldData = UnderworldExpansion.initialize(rng);
```

### End of Generation

```typescript
private gotoEndGeneration() {
  this.endGenerationForColonies();
  UnderworldExpansion.endGeneration(this);
  Turmoil.ifTurmoil(this, (turmoil) => turmoil.endGeneration(this));
}
```

### Deserialization

```typescript
if (d.moonData && gameOptions.moonExpansion) {
  game.moonData = MoonData.deserialize(d.moonData, players);
}
if (d.turmoil && gameOptions.turmoilExtension) {
  game.turmoil = Turmoil.deserialize(d.turmoil, players);
}
```

## Adding a New Expansion — Checklist

1. Define expansion data type (e.g., `NewExpansionData`)
2. Add optional field to `IGame` / `Game`
3. Add boolean flag to `GameOptions`
4. Create `ModuleManifest` with cards
5. Register manifest in `AllManifests` + add to `GameCards` filter
6. Create static façade with guard pattern
7. Initialize in `Game.newInstance` when flag is true
8. Hook into lifecycle (end of generation, production, etc.)
9. Add serialization/deserialization support
10. Update `BehaviorExecutor` if expansion adds new behavior fields
11. Add new `Behavior` fields if needed
12. Add new `PlayerInput` types if expansion has unique interactions
13. Add new `DeferredAction` subclasses for expansion-specific effects

## Key Takeaways

1. **No subclassing** — `Game` stays stable; expansions compose via optional fields + static façades
2. **Guard pattern** — `ifExpansion(game, cb)` safe to call even when disabled
3. **Manifest system** — adding cards is purely declarative
4. **Each layer is independent** — cards, state, rules, and wiring are decoupled
5. **Cross-expansion compatibility** at the card factory level
6. **BehaviorExecutor is expansion-aware** — handles all expansion-specific behaviors centrally
