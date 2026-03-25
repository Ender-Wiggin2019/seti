# Game — Session Lifecycle & Aggregate Root

> Source: `Game.ts`, `IGame.ts`, `game/GameOptions.ts`

## Core Idea

`Game` is the **aggregate root** — the single source of truth for a match. It owns the board, decks, global parameters, player list, deferred action queue, and expansion state. All mutation of shared state flows through `Game`.

`IGame` narrows the dependency surface so cards and subsystems depend on capabilities, not the concrete class.

## State Structure

```typescript
interface IGame {
  readonly id: GameId;
  readonly gameOptions: Readonly<GameOptions>;
  readonly players: ReadonlyArray<IPlayer>;
  readonly playersInGenerationOrder: ReadonlyArray<IPlayer>;

  phase: Phase;           // RESEARCH | DRAFTING | ACTION | PRODUCTION | SOLAR | END
  generation: number;
  activePlayer: IPlayer;
  readonly first: IPlayer;

  board: MarsBoard;
  projectDeck: ProjectDeck;
  corporationDeck: CorporationDeck;
  preludeDeck: PreludeDeck;
  ceoDeck: CeoDeck;
  deferredActions: DeferredActionsQueue;

  // Global parameters (private in Game, exposed via getters/setters)
  // temperature, oxygenLevel, venusScaleLevel

  // Milestones & Awards
  milestones: Array<IMilestone>;
  awards: Array<IAward>;
  claimedMilestones: Array<ClaimedMilestone>;
  fundedAwards: Array<FundedAward>;

  // Expansion state (optional)
  turmoil: Turmoil | undefined;
  moonData: MoonData | undefined;
  pathfindersData: PathfindersData | undefined;
  underworldData: UnderworldData;
  colonies: Array<IColony>;
  aresData: AresData | undefined;
}
```

## Construction

**Private constructor + static factory** ensures all invariants are established at creation:

```typescript
static newInstance(id, players, firstPlayer, options, seed, spectatorId): Game
```

Factory sequence:
1. Merge options with `DEFAULT_GAME_OPTIONS`
2. Create board via `GameSetup.newBoard(options, rng)`
3. Build filtered card pool: `new GameCards(options)`
4. Create & shuffle typed decks (`ProjectDeck`, `CorporationDeck`, `PreludeDeck`, `CeoDeck`)
5. Initialize expansion data conditionally (Ares, Colonies, Turmoil, Moon, Pathfinders, Underworld)
6. Choose milestones & awards
7. Deal starting cards to players
8. Enter initial phase (draft or research)

## Phase Machine

```
Generation start
  → RESEARCH (players buy cards)
  → [DRAFTING] (optional: players draft cards)
  → ACTION (players take turns)
  → PRODUCTION (resource income)
  → SOLAR (world government terraforming, optional)
  → End of generation hooks (colonies, underworld, turmoil)
  → Next generation

When terraforming complete:
  → Final greenery placement
  → END (score calculation)
```

Key transitions: `gotoResearchPhase()` → `gotoDraftPhase()` → `playerIsFinishedWithResearchPhase()` → ACTION → `playerIsFinishedTakingActions()` → `gotoProductionPhase()` → `postProductionPhase()` → `gotoEndGeneration()` → `startGeneration()`

## Turn Flow (ACTION Phase)

1. `startActionsForPlayer(player)` — set active player
2. Player's `takeAction()` builds `OrOptions` of available actions
3. Player resolves one action → deferred actions drain → callback
4. After N actions (default 2), player is done; engine advances to next un-passed player
5. All players pass → production phase

## Deferred Action Orchestration

```typescript
// Used at every transition point:
if (this.deferredActions.length > 0) {
  this.deferredActions.runAll(() => this.nextPhaseMethod());
  return;
}
```

The `game.defer(action, priority?)` method pushes onto the queue. See [deferred-action.md](deferred-action.md) for queue mechanics.

## Global Parameter Management

Parameters are private fields with public mutation methods that handle:
- Bounds checking (min/max constants)
- Bonus triggers at thresholds (e.g., ocean tile at 0°C)
- TR increases for the triggering player
- Expansion hooks (Ares, Turmoil, Underworld reactions)

```typescript
increaseTemperature(player, increments: -2 | -1 | 1 | 2 | 3): undefined
increaseOxygenLevel(player, increments: -2 | -1 | 1 | 2): void
increaseVenusScaleLevel(player, increments: -1 | 1 | 2 | 3): number
```

## Key Takeaways

1. **Private constructor + static factory** — all setup invariants in one place
2. **Phase enum + explicit transition methods** — traceable state machine
3. **Deferred action drain at every transition** — prevents stale/orphan effects
4. **Expansion state as optional fields** — core class stays stable
5. **`IGame` interface** — enables testing, mocking, and dependency narrowing
