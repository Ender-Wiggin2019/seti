# Deck & Draft — Generic Card Pools and Template-Method Drafting

> Source: `cards/Deck.ts`, `Draft.ts`

## Deck<T> — Generic Card Pool

### Core Idea

`Deck<T extends ICard>` is a generic, reusable deck abstraction with draw pile, discard pile, seeded random shuffle, and auto-reshuffle when the draw pile is exhausted.

### Structure

```typescript
class Deck<T extends ICard> {
  public drawPile: Array<T>;
  public discardPile: Array<T>;
  private readonly random: Random;  // Seeded RNG for deterministic shuffles

  protected constructor(type: string, drawPile, discards, random);
```

### Key Operations

```typescript
// Shuffle — merges draw + discard, reshuffles. Optionally pin cards on top.
shuffle(cardsOnTop: ReadonlyArray<CardName> = []): void;

// Draw from top or bottom. Auto-reshuffles discard into draw when empty.
draw(logger, source: 'top' | 'bottom' = 'top'): T | undefined;
drawN(logger, count, source?): Array<T>;
drawOrThrow(logger, source?): T;     // Throws if deck is empty

// Draw with filter — discards non-matching cards until enough matches found
drawByConditionOrThrow(logger, total, include: (card: T) => boolean): Array<T>;

// Discard
discard(...cards: Array<T>): void;
shuffleDiscardPile(): void;   // For special cards like Junk Ventures

// Query
size(): number;               // drawPile + discardPile
canDraw(count): boolean;

// Serialization
serialize(): SerializedDeck;  // { drawPile: CardName[], discardPile: CardName[] }
```

### Auto-Reshuffle

When the draw pile is empty but the discard pile has cards, the deck automatically shuffles the discard pile into a new draw pile. This is transparent to callers.

### Typed Subclasses

Each card type has a concrete deck class:

```typescript
class ProjectDeck extends Deck<IProjectCard> {
  static deserialize(d: SerializedDeck, random: Random): Deck<IProjectCard>;
}

class CorporationDeck extends Deck<ICorporationCard> { ... }

class PreludeDeck extends Deck<IPreludeCard> {
  // Special: removes one of two incompatible preludes at construction
  constructor(deck, discarded, random) {
    // Randomly remove either ByElection or TheNewSpaceRace
    super('prelude', filtered, discarded, random);
  }
}

class CeoDeck extends Deck<ICeoCard> { ... }
```

### Usage in Game

```typescript
// In Game.newInstance:
const gameCards = new GameCards(gameOptions);
const projectDeck = new ProjectDeck(gameCards.getProjectCards(), [], rng);
projectDeck.shuffle();
// ... same for corporation, prelude, CEO decks

// During play:
const card = game.projectDeck.draw(game);
game.projectDeck.discard(card);
player.dealtProjectCards.push(...projectDeck.drawN(game, 10));
```

---

## Draft — Template-Method Drafting System

### Core Idea

Drafting is a common board game mechanic where players choose from a hand and pass the rest. The `Draft` abstract class implements the **template method pattern** — the algorithm skeleton is fixed, subclasses configure draw count, pass direction, and end-of-round behavior.

### Abstract Class

```typescript
abstract class Draft {
  constructor(public readonly type: DraftType, protected readonly game: IGame) {}

  // --- Template method hooks (override in subclasses) ---

  /** Draw cards into hand at the start of the iteration */
  protected abstract draw(player: IPlayer): Array<IProjectCard>;

  /** Cards to keep per round (almost always 1) */
  protected abstract cardsToKeep(player: IPlayer): number;

  /** Pass direction: 'before' (right) or 'after' (left) */
  protected abstract passDirection(): 'before' | 'after';

  /** Called when all cards are drafted in this iteration */
  protected abstract endRound(): void;

  // --- Shared algorithm ---

  /** Start a draft iteration */
  public startDraft(save: boolean = true): void;

  /** Restore draft from saved state */
  public restoreDraft(): void;
}
```

### Algorithm (`startDraft`)

1. If round 1: call `draw(player)` for each player to get initial hands
2. If round > 1: rotate `draftHand` arrays based on `passDirection()`
3. Ask each player to choose `cardsToKeep()` cards via `SelectCard`
4. Player picks → card added to `draftedCards`, removed from `draftHand`
5. When all players have picked:
   - If cards remain (> 1 in hand): increment `draftRound`, `startDraft()` again
   - If 1 card remains: push last cards, call `endRound()`

### Concrete Implementations

```typescript
type DraftType = 'none' | 'initial' | 'prelude' | 'ceos' | 'standard';
```

| Class | When | Draw Count | Keep | Direction | End Round |
|-------|------|-----------|------|-----------|-----------|
| `StandardDraft` | Each generation | 4 cards from deck | 1 | Alternates by generation (odd=after, even=before) | Go to research phase |
| `InitialDraft` | Gen 1, iterations 1-2 | 5 project cards | 1 | Iteration 1: after, Iteration 2: before | Start iteration 2, then prelude draft or research |
| `PreludeDraft` | Gen 1, iteration 3 | Player's dealt preludes | 1 | after | CEO draft or research |
| `CEOsDraft` | Gen 1, iteration 4 | Player's dealt CEOs | 1 | after | Initial research phase |

### Special Card Handling

- **Luna Project Office**: player keeps 2 cards instead of 1 per round (via `cardsToKeep` override)
- **Mars Maths**: changes selectable count in research phase (not draft)

### Factory Functions

```typescript
function newStandardDraft(game: IGame): StandardDraft;
function newInitialDraft(game: IGame): InitialDraft;
function newPreludeDraft(game: IGame): PreludeDraft;
function newCEOsDraft(game: IGame): CEOsDraft;
```

### Save/Restore

Games are saved after every draft selection. `restoreDraft()` reconstructs the draft state:
- If no one has been dealt cards yet → restart from `startDraft(false)`
- If some players still need to draft → re-prompt them
- If all done → call `endRound()`

## Key Takeaways

1. **`Deck<T>` is generic** — same draw/discard/shuffle logic for any card type
2. **Seeded random** — deterministic shuffles for reproducibility
3. **Auto-reshuffle** — transparent to callers, handles deck exhaustion gracefully
4. **Typed subclasses** — type-safe deserialization per card type
5. **`Draft` template method** — fixed algorithm skeleton, subclasses only configure draw/keep/direction/end
6. **Save/restore compatible** — draft state reconstructable from serialized game
7. **Pass direction alternation** — standard draft alternates each generation for fairness
