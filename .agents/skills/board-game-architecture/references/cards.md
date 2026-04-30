# Cards — Hierarchy, Base Class, Requirements, Behavior & Registration

> Source: `cards/ICard.ts`, `cards/Card.ts`, `cards/IProjectCard.ts`, `cards/corporation/ICorporationCard.ts`, `cards/requirements/`, `behavior/Behavior.ts`, `behavior/BehaviorExecutor.ts`, `behavior/Executor.ts`, `cards/ModuleManifest.ts`, `cards/CardFactorySpec.ts`, `GameCards.ts`, `cards/AllManifests.ts`

## 1. Interface Hierarchy

```
ICard (root contract)
├── IProjectCard      — has cost, canPlay, requirements
├── ICorporationCard  — startingMegaCredits, initialAction, cardCost
├── IPreludeCard      — played before generation 1
├── ICeoCard          — once-per-game action (OPG)
├── IStandardProjectCard — always-available projects
└── IStandardActionCard  — always-available actions (convert plants/heat)

IActionCard (orthogonal)  — canAct() + action() for blue card activations
```

### ICard — Root Interface

```typescript
interface ICard {
  readonly name: CardName;
  readonly tags: ReadonlyArray<Tag>;
  readonly type: CardType;
  readonly cost?: number;
  readonly requirements: ReadonlyArray<CardRequirementDescriptor>;
  readonly metadata: CardMetadata;
  readonly behavior?: Behavior;

  play(player: IPlayer): PlayerInput | undefined;

  resourceCount: number;
  resourceType?: CardResource;
  victoryPoints?: number | 'special' | CountableVictoryPoints;
  getVictoryPoints(player: IPlayer, context?: GetVictoryPointsContext): number;

  // Discounts
  getCardDiscount?(player: IPlayer, card: IProjectCard): number;
  cardDiscount?: OneOrArray<CardDiscount>;

  // Lifecycle hooks (all optional)
  onCardPlayed?(player: IPlayer, card: ICard): PlayerInput | undefined | void;
  onCardPlayedByAnyPlayer?(owner, card, activePlayer): PlayerInput | undefined | void;
  onTilePlaced?(cardOwner, activePlayer, space, boardType): void;
  onResourceAdded?(player, playedCard, count): void;
  onGlobalParameterIncrease?(player, parameter, steps): void;
  onProductionPhase?(player): void;
  onDiscard?(player): void;
  onColonyAddedByAnyPlayer?(cardOwner, colonyOwner): void;
  onIncreaseTerraformRatingByAnyPlayer?(cardOwner, player, steps): void;
  // ... more hooks
}
```

## 2. Card Base Class — The Pipeline

`Card` is the abstract base class that most cards extend. It implements a **template method pipeline** where shared logic (requirements, behavior execution) runs first, then card-specific overrides.

### Static Property Cache

Card properties are normalized **once per CardName** and stored in a static `Map<CardName, InternalProperties>`. Individual card instances are lightweight — they just reference the cached properties.

### `canPlay` Pipeline

```typescript
canPlay(player, canAffordOptions?): boolean {
  // 1. Check compiled requirements
  if (!this.compiledRequirements.satisfies(player, this)) return false;

  // 2. Check behavior feasibility (if behavior exists)
  //    → delegates to getBehaviorExecutor().canExecute(behavior, player, card)
  if (!this.canPlayPostRequirements(player, canAffordOptions)) return false;

  // 3. Card-specific check (override point)
  return this.bespokeCanPlay(player, canAffordOptions);  // default: true
}
```

### `play` Pipeline

```typescript
play(player): PlayerInput | undefined {
  // 1. Deduct reserve units (Moon costs, etc.)
  player.stock.deductUnits(MoonExpansion.adjustedReserveCosts(player, this));

  // 2. Execute declarative behavior (if exists)
  if (this.behavior) {
    getBehaviorExecutor().execute(this.behavior, player, this);
  }

  // 3. Card-specific logic (override point)
  return this.bespokePlay(player);  // default: undefined
}
```

### Extension Points

- **`bespokeCanPlay(player)`** — override for card-specific feasibility checks
- **`bespokePlay(player)`** — override for card-specific imperative effects
- Only override `play()`/`canPlay()` directly if you need to bypass the entire pipeline (rare)

### Victory Points

```typescript
getVictoryPoints(player, context): number {
  if (typeof vp === 'number') return vp;
  if (typeof vp === 'object') return Counter.count(vp, player, this, context);
  if (vp === 'special') /* must override */;
  // Fallback: derive from metadata
}
```

## 3. Requirements System

Card requirements (e.g., "requires 5% oxygen", "requires 3 science tags") are **compiled once** at card creation into an efficient checker.

### Authoring

```typescript
// In card constructor:
requirements: [{ oxygen: 5 }, { tag: Tag.SCIENCE, count: 2 }]
```

### Compilation

`Card` constructor normalizes descriptors via `populateCount()` (fills `count` from field like `oxygen`, `oceans`, etc.), then `CardRequirements.compile(descriptors)` maps each to a concrete subclass.

### Requirement Hierarchy

```
CardRequirement (abstract)
  └── InequalityRequirement (score >= count, or <= if max)
      └── GlobalParameterRequirement
          ├── OxygenRequirement
          ├── TemperatureRequirement
          ├── OceanRequirement
          └── VenusRequirement
      └── TagCardRequirement
      └── ProductionRequirement
      └── ... other concrete types
```

`InequalityRequirement.satisfies()` compares `getScore(player)` against `count`. `GlobalParameterRequirement` adds bonus support (e.g., +2 from Adaptation Technology).

### Evaluation

```typescript
CardRequirements.satisfies(player, card): boolean {
  // Multi-tag check with wild tag allocation
  if (hasMultipleTagRequirements) {
    if (!player.tags.playerHas(tags)) return false;
  }
  // Each requirement must individually satisfy
  return requirements.every(r => r.satisfies(player, card));
}
```

## 4. Behavior System

### Motivation

80%+ of cards follow common patterns (gain production, gain stock, raise parameter, draw cards). The `Behavior` type is a **declarative DSL** describing card effects:

```typescript
type Behavior = {
  or?: OrBehavior;                     // Choose one sub-behavior
  spend?: Partial<OneOfType<Spend>>;   // Spend before acting
  production?: Partial<CountableUnits>; // Gain/lose production
  stock?: Partial<CountableUnits>;     // Gain/lose stock
  tr?: Countable;                      // Gain/lose TR
  global?: { temperature?, oxygen?, venus? };
  drawCard?: number | DrawCard;
  addResources?: Countable;            // Add to self
  addResourcesToAnyCard?: AddResource | Array<...>;
  decreaseAnyProduction?: DecreaseAnyProduction;
  removeAnyPlants?: number;
  city?: { space?, on? };
  greenery?: { on? };
  ocean?: { count?, on? };
  tile?: { type, on, adjacencyBonus?, title? };
  colonies?: { buildColony?, addTradeFleet?, tradeDiscount?, tradeOffset? };
  turmoil?: { influenceBonus?, sendDelegates? };
  moon?: { habitatTile?, mineTile?, roadTile?, tile?, habitatRate?, ... };
  underworld?: { identify?, excavate?, corruption?, markThisGeneration? };
  steelValue?: 1;
  titanumValue?: 1;
  greeneryDiscount?: 1;
  log?: string;
}
```

### BehaviorExecutor

Singleton registered at startup via `globalInitialize()`:

```typescript
interface BehaviorExecutor {
  canExecute(behavior, player, card, affordOptions?): boolean;
  execute(behavior, player, card): void;
  onDiscard(behavior, player, card): void;
  toTRSource(behavior, ctx): TRSource;
}

// Registration (once at startup)
registerBehaviorExecutor(new Executor());
```

The concrete `Executor` handles each behavior field: feasibility in `canExecute`, applies effects in `execute`, reverses persistent effects in `onDiscard`.

### Card Example: Declarative

```typescript
class Asteroid extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.ASTEROID,
      tags: [Tag.SPACE],
      cost: 14,
      behavior: {
        stock: {titanium: 2},
        global: {temperature: 1},
        removeAnyPlants: 3,
      },
      metadata: { ... },
    });
  }
  // No bespokePlay or bespokeCanPlay needed!
}
```

### Card Example: Imperative (bespokePlay)

Cards with complex UI logic override `bespokePlay`:

```typescript
class ImportedHydrogen extends Card implements IProjectCard {
  constructor() {
    super({
      behavior: { global: { temperature: 1 } }, // Shared part still declarative
      // ...
    });
  }
  override bespokePlay(player) {
    // Custom OrOptions for choosing between plants/microbes/animals
    return new OrOptions(...);
  }
}
```

### Card Example: Full Override (rare)

Only when bypassing the pipeline entirely:

```typescript
class LocalHeatTrapping extends Card {
  override canPlay(player) { /* custom heat check */ }
  override play(player) { /* custom heat spending + choice UI */ }
}
```

## 5. Registration System

### CardFactorySpec

```typescript
type CardFactorySpec<T> = {
  Factory: new () => T;                   // Constructor
  compatibility?: OneOrArray<Expansion>;  // Required expansions
  instantiate?: boolean;                  // false for proxy/fake cards
}
```

### ModuleManifest

Each expansion declares a manifest:

```typescript
class ModuleManifest {
  module: GameModule;
  projectCards: CardManifest<IProjectCard>;
  corporationCards: CardManifest<ICorporationCard>;
  preludeCards: CardManifest<IPreludeCard>;
  ceoCards: CardManifest<ICeoCard>;
  standardProjects: CardManifest<IStandardProjectCard>;
  standardActions: CardManifest<IStandardActionCard>;
  globalEvents: GlobalEventManifest;
  cardsToRemove: ReadonlySet<CardName>;  // Replace base game cards
}
```

### GameCards — Filtering & Instantiation

```typescript
class GameCards {
  constructor(gameOptions: GameOptions) {
    // Map expansion booleans → manifests
    this.moduleManifests = manifests.filter(([enabled]) => enabled).map(([, m]) => m);
  }

  getProjectCards(): Array<IProjectCard> {
    // Instantiate → check cross-expansion compatibility → filter banned → filter replaced
  }
}
```

### AllManifests — Central Registry

```typescript
const ALL_MODULE_MANIFESTS: Array<ModuleManifest> = [
  BASE_CARD_MANIFEST, CORP_ERA_CARD_MANIFEST, PROMO_CARD_MANIFEST,
  VENUS_CARD_MANIFEST, COLONIES_CARD_MANIFEST, PRELUDE_CARD_MANIFEST,
  // ... all expansion manifests
];
```

## Key Takeaways

1. **Interface hierarchy** — `ICard` is the universal contract; subtypes add specific concerns
2. **`Card` base class pipeline** — shared logic (requirements, behavior) + `bespokePlay`/`bespokeCanPlay` extension points
3. **Static property cache** — card properties stored once per name, instances are lightweight
4. **Compiled requirements** — `InequalityRequirement` hierarchy with efficient `satisfies()` checks
5. **Declarative `Behavior`** — eliminates boilerplate for 80%+ of cards
6. **Manifest + Factory** — expansions register cards without touching core code
7. **Lifecycle hooks** — reactive effects via optional interface methods, no engine changes needed
