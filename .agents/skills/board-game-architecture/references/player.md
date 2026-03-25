# Player — Per-Player State & Composed Subsystems

> Source: `Player.ts`, `IPlayer.ts`, `player/Stock.ts`, `player/Production.ts`, `player/Tags.ts`, `player/Colonies.ts`, `player/StockBase.ts`

## Core Idea

`Player` encapsulates all per-player state and the action selection loop. Complex domain state is **extracted into composed helper objects** that share a common base class, keeping `Player` focused on orchestration.

## Composed Subsystems

### BaseStock — Shared Resource Container

Abstract base for both `Stock` and `Production`. Holds 6 resource fields (megacredits, steel, titanium, plants, energy, heat) with:
- `adjust(units)` / `deductUnits(units)` / `has(units)` — bulk operations
- `asUnits()` — snapshot as `Units` object
- Configurable floor (0 for stock, -5 for MC production)

### Stock — Current Resource Holdings

Extends `BaseStock` with game-aware `add()`:
- Clamp-to-zero on deductions (can't go negative)
- Triggers card hooks: `LawSuit.resourceHook`, `CrashSiteCleanup.resourceHook`
- Mons Insurance resolution on opponent-caused losses
- `steal(resource, qty, thief)` — transfer with logging

### Production — Per-Generation Income

Extends `BaseStock` with floor of -5 (MC production can go to -5):
- `add()` triggers `card.onProductionGain(player, resource, amount)` for all tableau cards
- Same insurance/lawsuit hooks as Stock

### Tags — Tag Counting with Substitutions

Handles counting modes for different contexts:

```typescript
type CountingMode = 'raw' | 'default' | 'milestone' | 'award' | 'raw-pf' | 'raw-underworld'
```

Special card hooks:
- **Wild tags**: added in `default`/`milestone` modes
- **Earth Embassy**: Moon tags count as Earth tags
- **Habitat Marte**: Mars tags count as Science tags
- **Chimera**: 2 wild tags but count as 1 for milestones/awards
- **Leavitt Station**: extra science tags (`extraScienceTags` field)

Also provides: `distinctCount()` (unique tag types), `playerHas(tags)` (multi-tag checks with wild tag allocation), `cardHasTag()` (per-card tag checking with substitutions).

### Colonies — Fleet & Trade State

Manages: fleet size, used trade fleets, trade discount/offset, colony victory points, and the `coloniesTradeAction()` which builds the trading input.

## Player State Overview

```typescript
class Player implements IPlayer {
  // Composed subsystems
  public tags: Tags;
  public colonies: Colonies;
  public readonly production: Production;
  public readonly stock: Stock;
  public readonly opponents: ReadonlyArray<IPlayer>;

  // Core state
  public terraformRating: number = 20;
  public cardsInHand: Array<IProjectCard> = [];
  public preludeCardsInHand: Array<IPreludeCard> = [];
  public playedCards: PlayedCards = new PlayedCards();  // tableau
  public draftedCards: Array<IProjectCard> = [];
  public draftHand: Array<IProjectCard> = [];

  // Back-reference (set during setup, not constructor)
  public game: IGame;

  // Input state machine
  protected waitingFor?: PlayerInput;
  protected waitingForCb?: () => void;
}
```

## Setup Lifecycle

```typescript
// Construction — game reference NOT available yet
constructor(name, color, beginner, handicap, id) {
  this.game = undefined as unknown as Game;
  this.tags = new Tags(this);
  this.colonies = new Colonies(this);
  this.production = new Production(this);
  this.stock = new Stock(this);
}

// Called by Game after creation
setup(game: IGame) {
  this.game = game;
  this.opponents = game.players.filter(p => p !== this);
}
```

## Input State Machine

One pending input at a time:

```typescript
setWaitingFor(input: PlayerInput, cb: () => void): void  // Set pending decision
process(response: InputResponse): void                    // Resolve with client response
getWaitingFor(): PlayerInput | undefined                  // Check if waiting

// Safety variant for overlapping inputs (Philares edge case)
setWaitingForSafely(input: PlayerInput, cb: () => void): void
```

**Flow**: Engine calls `setWaitingFor(input, cb)` → client sends response → `process()` clears state, calls `input.process(response)` → may defer more actions → `cb()` continues game flow.

## Action Selection (`takeAction`)

The core game loop for a player's turn:

```typescript
takeAction(): void {
  // 1. Drain deferred actions
  if (game.deferredActions.length > 0) {
    game.deferredActions.runAll(() => this.takeAction());
    return;
  }

  // 2. Special phases: preludes, CEOs
  if (this.preludeCardsInHand.length > 0) { /* play prelude */ return; }
  if (this.ceoCardsInHand.size > 0) { /* play CEO */ return; }

  // 3. Check turn completion
  if (hasPassedOrExhaustedActions) {
    game.playerIsFinishedTakingActions();
    return;
  }

  // 4. Build action menu (OrOptions)
  // Includes: milestones, convert plants/heat, turmoil actions,
  //   blue card actions, CEO OPG, playable project cards,
  //   colony trade, fund award, standard projects, pass,
  //   sell patents, undo
  this.setWaitingFor(actionMenu, () => {
    this.actionsTakenThisRound++;
    this.takeAction(); // Loop
  });
}
```

## Card Playing Pipeline

```typescript
playCard(selectedCard, payment?, cardAction = 'add'): void {
  if (payment) this.pay(payment);
  const action = selectedCard.play(this);  // May return PlayerInput
  this.defer(action);
  // Remove from hand → add to tableau
  this.onCardPlayed(selectedCard);         // Trigger hooks
}
```

`onCardPlayed` triggers: self-owned card effects → Turmoil effects → other players' card reactions → Pathfinders effects.

## Production Phase

```typescript
runProductionPhase(): void {
  this.actionsThisGeneration.clear();
  this.heat += this.energy;   // Energy → Heat conversion
  this.energy = 0;
  this.megaCredits += this.production.megacredits + this.terraformRating;
  // ... add all production to stock
  // Trigger card.onProductionPhase() hooks
  // Reset CEO OPG actions
}
```

## Deferred Action Shorthand

```typescript
defer(input: PlayerInput | undefined | void | (() => PlayerInput | undefined),
      priority = Priority.DEFAULT): void {
  if (input === undefined) return;
  const cb = typeof input === 'function' ? input : () => input;
  this.game.defer(new SimpleDeferredAction(this, cb, priority));
}
```

## Key Takeaways

1. **Composed subsystems** (`Stock`, `Production`, `Tags`, `Colonies`) with shared `BaseStock` base — each handles its own hooks and validation
2. **Deferred game reference** — `game` set via `setup()`, not constructor, to break circular dependency
3. **Single pending input** (`waitingFor`) — one decision at a time, no concurrency issues
4. **`takeAction()` recursive loop** — drain queue → build options → wait → repeat
5. **Card hook chain** (`onCardPlayed`) — enables reactive effects without coupling
