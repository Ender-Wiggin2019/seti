# SETI Server Architecture

> Server-side architecture for the SETI board game engine. Covers request layer, persistence, in-memory game engine, and engineering concerns.

---

## 1. Package Overview

New package: `packages/server` (`@seti/server`)

```
packages/server/
├── src/
│   ├── app.module.ts                 # NestJS root module
│   ├── main.ts                       # Bootstrap
│   │
│   ├── lobby/                        # Room/matchmaking (REST)
│   │   ├── lobby.module.ts
│   │   ├── lobby.controller.ts
│   │   ├── lobby.service.ts
│   │   └── dto/
│   │
│   ├── gateway/                      # WebSocket gateway (in-game)
│   │   ├── game.gateway.ts
│   │   └── game.gateway.module.ts
│   │
│   ├── auth/                         # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   │
│   ├── engine/                       # ★ Core game engine (pure logic)
│   │   ├── Game.ts                   # Aggregate root
│   │   ├── IGame.ts                  # Interface
│   │   ├── GameOptions.ts
│   │   ├── GameSetup.ts              # Setup orchestrator
│   │   ├── Phase.ts                  # Phase enum
│   │   │
│   │   ├── player/
│   │   │   ├── Player.ts
│   │   │   ├── IPlayer.ts
│   │   │   ├── Resources.ts          # Credits, energy, publicity
│   │   │   ├── Income.ts             # Per-round income tracking
│   │   │   ├── Computer.ts           # Data computer subsystem
│   │   │   ├── DataPool.ts           # Data pool (cap 6)
│   │   │   └── Pieces.ts             # Probe/orbiter/lander/marker inventory
│   │   │
│   │   ├── board/
│   │   │   ├── SolarSystem.ts        # Rings, discs, rotation
│   │   │   ├── Sector.ts             # Per-sector signal/data/marker state
│   │   │   ├── PlanetaryBoard.ts     # Orbits, landings, moons
│   │   │   ├── TechBoard.ts          # 12 tech stacks
│   │   │   └── BoardBuilder.ts       # Solar system layout constructor
│   │   │
│   │   ├── actions/                  # Main action implementations
│   │   │   ├── LaunchProbe.ts
│   │   │   ├── Orbit.ts
│   │   │   ├── Land.ts
│   │   │   ├── Scan.ts
│   │   │   ├── AnalyzeData.ts
│   │   │   ├── PlayCard.ts
│   │   │   ├── ResearchTech.ts
│   │   │   └── Pass.ts
│   │   │
│   │   ├── freeActions/
│   │   │   ├── Movement.ts
│   │   │   ├── PlaceData.ts
│   │   │   ├── CompleteMission.ts
│   │   │   ├── FreeActionCorner.ts
│   │   │   ├── BuyCard.ts
│   │   │   └── ExchangeResources.ts
│   │   │
│   │   ├── input/                    # PlayerInput types
│   │   │   ├── PlayerInput.ts        # Base interface + BasePlayerInput
│   │   │   ├── OrOptions.ts
│   │   │   ├── AndOptions.ts
│   │   │   ├── SelectCard.ts
│   │   │   ├── SelectOption.ts
│   │   │   ├── SelectSector.ts
│   │   │   ├── SelectPlanet.ts
│   │   │   ├── SelectTech.ts
│   │   │   ├── SelectGoldTile.ts
│   │   │   ├── SelectResource.ts
│   │   │   └── SelectEndOfRoundCard.ts
│   │   │
│   │   ├── deferred/                 # DeferredAction system
│   │   │   ├── DeferredAction.ts
│   │   │   ├── DeferredActionsQueue.ts
│   │   │   ├── Priority.ts
│   │   │   ├── SimpleDeferredAction.ts
│   │   │   ├── GainResources.ts
│   │   │   ├── SpendResources.ts
│   │   │   ├── MarkSignal.ts
│   │   │   ├── MarkTrace.ts
│   │   │   ├── ResolveSectorCompletion.ts
│   │   │   ├── ResolveMilestone.ts
│   │   │   ├── ResolveDiscovery.ts
│   │   │   └── RotateSolarSystem.ts
│   │   │
│   │   ├── cards/
│   │   │   ├── ICard.ts              # Root card interface
│   │   │   ├── Card.ts               # Base class with pipeline
│   │   │   ├── CardRegistry.ts       # Manifest + factory
│   │   │   ├── Behavior.ts           # Declarative effect DSL
│   │   │   ├── BehaviorExecutor.ts   # Behavior interpreter
│   │   │   ├── Requirements.ts       # Card requirement system
│   │   │   ├── base/                 # Base game card implementations
│   │   │   └── alien/               # Per-alien card sets
│   │   │
│   │   ├── alien/                    # Alien species modules
│   │   │   ├── IAlienModule.ts       # Plugin interface
│   │   │   ├── AlienRegistry.ts
│   │   │   ├── Anomalies.ts
│   │   │   ├── Centaurians.ts
│   │   │   ├── Exertians.ts
│   │   │   ├── Mascamites.ts
│   │   │   └── Oumuamua.ts
│   │   │
│   │   ├── scoring/
│   │   │   ├── Milestone.ts
│   │   │   ├── GoldScoringTile.ts
│   │   │   └── FinalScoring.ts
│   │   │
│   │   ├── deck/
│   │   │   ├── Deck.ts              # Generic Deck<T>
│   │   │   ├── MainDeck.ts
│   │   │   └── AlienDeck.ts
│   │   │
│   │   └── event/
│   │       ├── GameEvent.ts          # Event types
│   │       └── EventLog.ts           # Audit log
│   │
│   ├── persistence/                  # DB layer
│   │   ├── schema/                   # Drizzle schema
│   │   │   ├── games.ts
│   │   │   ├── players.ts
│   │   │   ├── gameSnapshots.ts
│   │   │   └── users.ts
│   │   ├── dto/
│   │   │   ├── GameStateDto.ts
│   │   │   └── PlayerStateDto.ts
│   │   ├── serializer/
│   │   │   ├── GameSerializer.ts
│   │   │   └── GameDeserializer.ts
│   │   ├── repository/
│   │   │   ├── GameRepository.ts
│   │   │   └── UserRepository.ts
│   │   └── drizzle.module.ts
│   │
│   └── shared/
│       ├── rng/
│       │   └── SeededRandom.ts       # Deterministic RNG
│       └── errors/
│           └── GameError.ts
│
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── test/
    ├── engine/                       # Deterministic simulation tests
    └── integration/
```

---

## 2. Request Layer

### 2.1 Technology: NestJS

NestJS provides the best fit for this project:

- **Modular architecture** aligns with the engine's domain separation
- **First-class WebSocket support** via `@nestjs/platform-socket.io`
- **Dependency injection** simplifies wiring engine services to transport
- **Guards/interceptors** handle auth, validation, and rate limiting uniformly
- **Monorepo friendly** — integrates naturally into the existing pnpm + Turbo workspace

### 2.2 Communication Protocol: Hybrid REST + WebSocket

| Concern | Protocol | Rationale |
|---------|----------|-----------|
| Auth (login/register) | REST | Stateless, cacheable, standard JWT flow |
| Lobby (create/join/list rooms) | REST | CRUD operations, no real-time requirement |
| In-game actions | WebSocket | Low-latency bidirectional communication; server pushes state changes to all players |
| Game state sync | WebSocket | Players need immediate updates when others act |
| Spectator | WebSocket | Real-time observation |
| Reconnection | WebSocket | Re-subscribe to game room, server pushes full state |

**WebSocket protocol design:**

```
Client → Server (actions):
  game:action       { gameId, action: MainAction }
  game:freeAction   { gameId, action: FreeAction }
  game:input        { gameId, inputResponse: InputResponse }

Server → Client (state):
  game:state        { gameState: PublicGameState }          // Full state after each action
  game:waiting      { playerId, input: PlayerInputModel }   // Pending decision prompt
  game:event        { event: GameEvent }                    // Audit log event
  game:error        { code, message }                       // Validation rejection

Room lifecycle:
  room:join         { gameId }
  room:leave        { gameId }
  room:playerJoined { playerId, playerName }
  room:playerLeft   { playerId }
```

**View model separation:** Server maintains one canonical `Game` state. When pushing to clients, it projects per-player views that hide secret information (deck order, other players' hands, hidden alien identity).

---

## 3. DB Layer

### 3.1 ORM: Drizzle

Drizzle ORM with PostgreSQL. Lightweight, type-safe, SQL-close.

### 3.2 Schema Design

```typescript
// games table — one row per game session
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull(),            // 'waiting' | 'playing' | 'finished'
  playerCount: integer('player_count').notNull(),
  currentRound: integer('current_round'),
  seed: text('seed').notNull(),                // RNG seed for replay
  options: jsonb('options'),                   // GameOptions
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// game_snapshots — full serialized state, one per action (supports undo)
export const gameSnapshots = pgTable('game_snapshots', {
  id: serial('id').primaryKey(),
  gameId: uuid('game_id').references(() => games.id),
  version: integer('version').notNull(),       // Monotonic action counter
  state: jsonb('state').notNull(),             // Serialized full GameState
  event: jsonb('event'),                       // The action/event that produced this snapshot
  createdAt: timestamp('created_at').defaultNow(),
});

// users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').defaultNow(),
});

// game_players — join table
export const gamePlayers = pgTable('game_players', {
  gameId: uuid('game_id').references(() => games.id),
  userId: uuid('user_id').references(() => users.id),
  seatIndex: integer('seat_index').notNull(),
  color: text('color').notNull(),
}, (t) => ({
  pk: primaryKey(t.gameId, t.userId),
}));
```

### 3.3 Serialization & Deserialization

The entire in-memory `Game` object is serializable to a JSON blob (`GameStateDto`). This DTO captures every piece of state needed to reconstruct the game:

```typescript
interface IGameStateDto {
  gameId: string;
  version: number;
  seed: string;
  rngState: number[];
  round: number;
  phase: EPhase;
  currentPlayerId: string;
  startPlayerId: string;
  hasRoundFirstPassOccurred: boolean;
  rotationCounter: number;

  solarSystem: ISolarSystemDto;
  planetaryBoard: IPlanetaryBoardDto;
  techBoard: ITechBoardDto;
  sectors: ISectorDto[];
  alienState: IAlienStateDto;

  mainDeck: ISerializedDeck;
  discardPile: string[];      // Card IDs
  cardRow: string[];
  endOfRoundStacks: string[][];

  players: IPlayerStateDto[];
  eventLog: IGameEventDto[];

  milestones: IMilestoneStateDto;
  goldScoringTiles: IGoldTileDto[];
}
```

**Serializer/Deserializer** are standalone pure functions — no coupling to DB or framework:

```typescript
function serializeGame(game: IGame): IGameStateDto;
function deserializeGame(dto: IGameStateDto): Game;
```

### 3.4 Undo System

**Snapshot-based undo.** Every time a player confirms a main action, the server persists a snapshot *before* applying the action. Undo = load the previous snapshot and deserialize.

```
Snapshot v0 (setup complete)
  → Player A acts → Snapshot v1
  → Player B acts → Snapshot v2
  → Player B requests undo → restore v1
```

Rules:
- Only the **last acting player** may undo, and only if the next player hasn't acted yet.
- Undo restores the full `Game` from the prior snapshot — no partial rollback.
- Free actions within a turn accumulate; undo rolls back the entire turn.
- Undo depth is configurable (default: 1 action).

---

## 4. In-Memory Game Engine

The engine is a **pure-logic layer** with zero framework dependencies. It references `@seti/common` for card data and shared types but has no knowledge of NestJS, Drizzle, or Socket.IO.

### 4.1 Game — Aggregate Root

```typescript
interface IGame {
  readonly id: string;
  readonly options: Readonly<IGameOptions>;
  readonly players: ReadonlyArray<IPlayer>;

  phase: EPhase;
  round: number;                    // 1-5
  activePlayer: IPlayer;
  startPlayer: IPlayer;

  solarSystem: SolarSystem;
  planetaryBoard: PlanetaryBoard;
  techBoard: TechBoard;
  sectors: Sector[];

  mainDeck: Deck<ICard>;
  cardRow: ICard[];                 // 3 open cards
  endOfRoundStacks: ICard[][];      // 4 stacks

  alienState: AlienState;
  milestoneState: MilestoneState;
  goldScoringTiles: GoldScoringTile[];

  deferredActions: DeferredActionsQueue;
  eventLog: EventLog;
  random: SeededRandom;

  rotationCounter: number;
  hasRoundFirstPassOccurred: boolean;
}
```

**Phase machine:**

```
SETUP
  → PLAY (round 1..5 loop)
       → AWAIT_MAIN_ACTION
       → IN_RESOLUTION (action + deferred drain)
       → BETWEEN_TURNS (milestones, discovery)
       → [next player or END_OF_ROUND]
  → END_OF_ROUND
       → income, advance start player, reset
       → next round or FINAL_SCORING
  → FINAL_SCORING
  → GAME_OVER
```

**Construction:** Private constructor + static factory `Game.create(players, options, seed)`. Factory executes full setup sequence per PRD §5.

### 4.2 Player — Composed Subsystems

```typescript
interface IPlayer {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly seatIndex: number;

  score: number;
  resources: Resources;       // credits, energy
  publicity: number;
  income: Income;             // per-round income tracking
  computer: Computer;         // top/bottom slots, data tokens
  dataPool: DataPool;         // max 6
  pieces: Pieces;             // available/placed figures

  hand: ICard[];
  playedMissions: ICard[];
  completedMissions: ICard[];
  endGameCards: ICard[];
  tuckedIncomeCards: ICard[];
  techs: ITech[];

  passed: boolean;
  probesInSpace: number;
  probeSpaceLimit: number;    // 1 default, 2 with tech

  game: IGame;                // back-reference, set via setup()
  waitingFor?: PlayerInput;
}
```

**Composed subsystem pattern (adapted from reference):**

| Subsystem | Responsibility |
|-----------|---------------|
| `Resources` | Credits + energy. `spend()`, `gain()`, `has()` with validation |
| `Income` | Tracks base income + tucked card income. Computes per-round payout |
| `Computer` | Top-row slots (required for Analyze), bottom slots from tech. `placeData()`, `isFull()`, `clear()` |
| `DataPool` | Bounded container (max 6). `add()` with overflow discard, `remove()` |
| `Pieces` | Tracks available probes, orbiters, landers, sector markers. `deploy()` / `return()` |

### 4.3 PlayerInput — Synchronous Choice

Same continuation-based pattern as the reference. `process(response)` validates + applies, returns further input or `undefined`.

**SETI-specific input types:**

| Input Type | Usage |
|-----------|-------|
| `SelectOption` | Simple confirmations (e.g., "Increase publicity") |
| `SelectCard` | Choose cards from hand, card row, or end-of-round stack |
| `SelectSector` | Choose sector for scan signal marking |
| `SelectPlanet` | Choose planet/moon for orbit/land |
| `SelectTech` | Choose tech to research |
| `SelectGoldTile` | Choose gold scoring tile for milestone |
| `SelectTrace` | Choose which alien to mark trace for |
| `SelectResource` | Choose resource type for exchange |
| `OrOptions` | Pick one of N sub-inputs (main action menu) |
| `AndOptions` | Resolve all sub-inputs (multi-step resolution) |

**Main action menu (built each turn):**

```typescript
buildActionMenu(player: IPlayer): OrOptions {
  const options: PlayerInput[] = [];

  if (canLaunchProbe(player))    options.push(launchProbeInput(player));
  if (canOrbit(player))          options.push(orbitInput(player));
  if (canLand(player))           options.push(landInput(player));
  if (canScan(player))           options.push(scanInput(player));
  if (canAnalyzeData(player))    options.push(analyzeDataInput(player));
  if (hasPlayableCards(player))  options.push(playCardInput(player));
  if (canResearchTech(player))   options.push(researchTechInput(player));
  options.push(passInput(player));  // always available

  return new OrOptions(...options);
}
```

### 4.4 DeferredAction — Queued Effect System

Priority-ordered queue. Same pattern as reference — `execute()` returns `PlayerInput | undefined`.

**SETI priority order:**

```typescript
enum EPriority {
  COST = 0,                    // Pay action costs
  ROTATION,                    // Solar system rotation (research/first pass)
  CORE_EFFECT,                 // Main action resolution
  IMMEDIATE_REWARD,            // On-place/on-gain bonuses
  CARD_TRIGGER,                // Mission trigger checks
  SECTOR_COMPLETION,           // Sector majority resolution
  DEFAULT,                     // Standard card effects
  HAND_LIMIT,                  // Discard to 4 on pass
  END_OF_ROUND_CARD,           // End-of-round card selection
  MILESTONE,                   // Gold/neutral milestone resolution
  DISCOVERY,                   // Alien species discovery
  TURN_HANDOFF,                // Advance to next player
}
```

**Resolution pipeline per turn:**

```
1. Player declares main action
2. Validate legality
3. Queue: COST → CORE_EFFECT → IMMEDIATE_REWARD
4. Drain queue (may produce PlayerInputs → pause → resume)
5. Check sector completions → queue SECTOR_COMPLETION
6. Drain
7. Check mission triggers → queue CARD_TRIGGER
8. Drain
9. Between-turn: queue MILESTONE → DISCOVERY
10. Drain
11. TURN_HANDOFF → next player or END_OF_ROUND
```

### 4.5 Cards — Hierarchy & Registration

**Adapting to SETI's card system.** SETI has three card modes (free-action corner, main-action effect, mission/end-game), plus tucked income. The hierarchy:

```
ICard (root)
├── IBaseCard           — normal cards (discard after play)
├── IMissionCard        — conditional or trigger mission
├── IEndGameScoringCard — gold-box end-game scoring
└── IAlienCard          — species-specific cards
```

**Card base class pipeline (from reference, adapted):**

```typescript
abstract class Card implements ICard {
  // Template method
  canPlay(player: IPlayer): boolean {
    if (!this.checkRequirements(player)) return false;
    if (!this.checkBehaviorFeasibility(player)) return false;
    return this.bespokeCanPlay(player);
  }

  play(player: IPlayer): PlayerInput | undefined {
    if (this.behavior) {
      getBehaviorExecutor().execute(this.behavior, player, this);
    }
    return this.bespokePlay(player);
  }

  protected bespokeCanPlay(player: IPlayer): boolean { return true; }
  protected bespokePlay(player: IPlayer): PlayerInput | undefined { return undefined; }
}
```

**Behavior DSL (SETI-adapted):**

```typescript
interface IBehavior {
  gainResources?: Partial<IResourceBundle>;   // credits, energy, publicity, data
  spendResources?: Partial<IResourceBundle>;
  gainScore?: number;
  gainMovement?: number;
  gainIncome?: EResource;
  drawCards?: number;
  launchProbe?: boolean;
  orbit?: boolean;
  land?: boolean;
  scan?: IScanBehavior;
  researchTech?: ETech;
  markTrace?: ETrace;
  rotateSolarSystem?: boolean;
  custom?: string;                            // Fallback for unique effects
}
```

**Card registration:** Cards from `@seti/common` provide static data (id, name, cost, effects). The server-side `CardRegistry` maps each card ID to a `CardFactory` that produces the runtime `Card` instance with executable behavior.

```typescript
class CardRegistry {
  private factories = new Map<string, () => ICard>();

  register(id: string, factory: () => ICard): void;
  create(id: string): ICard;
  createAll(ids: string[]): ICard[];
}
```

Base game cards and alien cards each have their own manifest, registered at startup.

### 4.6 Board Components

#### SolarSystem

Not a hex grid — the SETI solar system is concentric rings with rotating discs.

```typescript
class SolarSystem {
  spaces: SolarSystemSpace[];      // All traversable spaces
  discs: [Disc, Disc, Disc];       // Top, middle, bottom (rotatable)
  adjacency: Map<string, string[]>;

  rotate(discIndex: number): void; // Rotate disc, move probes, grant publicity
  getAdjacentSpaces(spaceId: string): SolarSystemSpace[];
  getSpacesOnPlanet(planet: EPlanet): SolarSystemSpace[];
  getProbesAt(spaceId: string): IProbe[];
}
```

**Rotation mechanics:** Disc rotation shifts probe positions. Probes on the rotating disc move with it. Bumped probes advance to the next valid space. Publicity icons are granted during movement.

#### Sector

```typescript
class Sector {
  id: string;
  color: ESector;
  dataSlots: (DataToken | null)[];          // Fixed capacity
  markerSlots: { playerId: string }[];      // Signal markers
  overflowMarkers: { playerId: string }[];
  winnerMarkers: { playerId: string; reward: number }[];
  completed: boolean;

  markSignal(playerId: string): { dataGained: DataToken | null; vpGained: number };
  resolveCompletion(): ISectorCompletionResult;
  reset(secondPlaceId: string | null): void;
}
```

#### PlanetaryBoard

```typescript
class PlanetaryBoard {
  planets: Map<EPlanet, PlanetState>;

  // Per planet:
  // - orbit slots (unlimited, first-orbit bonus tracking)
  // - landing slots (unlimited for planets, single for moons)
  // - first-lander bonus data tracking
  // - moon availability (default locked, tech/effect unlocks)
}
```

#### TechBoard

```typescript
class TechBoard {
  stacks: Map<ETech, TechStack>;   // 12 stacks (4 per color × 3 colors)

  // Per stack:
  // - tiles in order (face-down)
  // - 2VP tile availability (first-take bonus)
  // - who has taken what (duplicate prevention)
}
```

### 4.7 Alien Species — Plug-in Modules

Following the reference architecture's expansion pattern (composition, not inheritance):

```typescript
interface IAlienModule {
  readonly type: EAlienType;

  onDiscover(game: IGame, discoverers: IPlayer[]): void;
  onTraceMark?(game: IGame, player: IPlayer, trace: ETrace): void;
  onRoundEnd?(game: IGame): void;
  onGameEndScoring?(game: IGame, player: IPlayer): number;

  getAlienCards(): ICard[];
  getAlienBoardState(): IAlienBoardState;
}
```

**Guard pattern (from reference):**

```typescript
class AlienModule {
  static ifDiscovered<T>(
    game: IGame,
    alienType: EAlienType,
    cb: (module: IAlienModule) => T,
  ): T | undefined {
    const mod = game.alienState.getDiscoveredModule(alienType);
    return mod ? cb(mod) : undefined;
  }
}
```

Each alien species is a separate class implementing `IAlienModule`, registered in `AlienRegistry`. Loaded into the game on discovery — the core engine never references species-specific logic directly.

### 4.8 Scoring System

```typescript
class MilestoneState {
  goldMilestones: { threshold: number; claimed: { playerId: string; tileId: string }[] }[];
  neutralMilestones: { threshold: number; markers: number }[];

  checkAndQueue(game: IGame, player: IPlayer): void; // After each turn
}
```

**Gold scoring tiles** are stored with their active side (randomized at setup). Final scoring iterates all scoring sources in order:

```
1. End-game scoring cards (gold-box)
2. Gold scoring tiles (formula-based)
3. Alien-specific scoring hooks
4. Sum → highest VP wins, ties remain ties
```

### 4.9 Event Log

Every state mutation emits a typed event for auditing, replay, and client display:

```typescript
type TGameEvent =
  | { type: 'ACTION'; playerId: string; action: string; details: unknown }
  | { type: 'RESOURCE_CHANGE'; playerId: string; resource: string; delta: number }
  | { type: 'SCORE_CHANGE'; playerId: string; delta: number; source: string }
  | { type: 'SECTOR_COMPLETED'; sectorId: string; winnerId: string }
  | { type: 'ALIEN_DISCOVERED'; alienType: EAlienType }
  | { type: 'ROTATION'; discIndex: number }
  | { type: 'ROUND_END'; round: number }
  | { type: 'GAME_END'; finalScores: Record<string, number> };
```

---

## 5. Data Flow

### 5.1 Action Lifecycle

```
Client                  Gateway                  Engine                  Persistence
  │                       │                        │                        │
  │── game:action ───────>│                        │                        │
  │                       │── validate session ────>│                        │
  │                       │                        │── snapshot before ─────>│ (undo point)
  │                       │                        │── validate legality     │
  │                       │                        │── queue deferred actions │
  │                       │                        │── drain queue           │
  │                       │                        │   (may pause for input) │
  │<── game:waiting ──────│<── PlayerInput ────────│                        │
  │── game:input ────────>│── InputResponse ──────>│                        │
  │                       │                        │── continue drain        │
  │                       │                        │── milestone/discovery   │
  │                       │                        │── turn handoff          │
  │                       │                        │── snapshot after ──────>│
  │<── game:state ────────│<── project view ───────│                        │
  │                       │                        │                        │
```

### 5.2 State Projection (Per-Player View)

```typescript
function projectGameState(game: IGame, viewerId: string): IPublicGameState {
  return {
    round: game.round,
    phase: game.phase,
    currentPlayerId: game.activePlayer.id,

    // Public board state (full visibility)
    solarSystem: serializeSolarSystem(game.solarSystem),
    planetaryBoard: serializePlanetaryBoard(game.planetaryBoard),
    techBoard: serializeTechBoard(game.techBoard),
    sectors: game.sectors.map(serializeSector),
    cardRow: game.cardRow.map(serializePublicCard),

    // Per-player: own hand is visible, others show count only
    players: game.players.map(p => ({
      ...serializePublicPlayer(p),
      hand: p.id === viewerId ? p.hand.map(serializeCard) : undefined,
      handSize: p.hand.length,
    })),

    // Hidden until discovered
    aliens: game.alienState.discovered.map(serializeAlienBoard),

    // Scores, milestones, events (public)
    milestones: serializeMilestones(game.milestoneState),
    goldTiles: game.goldScoringTiles.map(serializeGoldTile),
    recentEvents: game.eventLog.recent(20),
  };
}
```

---

## 6. Engineering Concerns

### 6.1 Seeded RNG

All randomness (shuffle, setup, alien selection) flows through a `SeededRandom` instance initialized from a captured seed. This enables:
- **Deterministic replay** from seed + action sequence
- **Debug reproducibility**
- **Anti-cheat verification**

### 6.2 Testing Architecture

#### Framework: Vitest

选择 Vitest 作为单测框架：

- **ESM 原生支持** — 项目使用 `"type": "module"`，Vitest 零配置即可运行
- **与 Turbo 集成** — 已有 `turbo run test` pipeline，Vitest 直接对接
- **TypeScript 原生** — 无需 babel/ts-jest 转换层，直接运行 `.ts`
- **兼容 Jest API** — `describe`/`it`/`expect` 语法一致，迁移成本为零
- **内置 coverage** — `vitest --coverage` 通过 `@vitest/coverage-v8` 即可生成覆盖率报告

配置：

```typescript
// packages/server/vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/engine/**'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
  resolve: {
    alias: { '@seti/common': path.resolve(__dirname, '../common/src') },
  },
});
```

#### 1:1 单测文件规则

**每个源文件必须有对应单测文件**，放在同目录下，命名为 `<SourceFile>.test.ts`：

```
src/engine/
├── Game.ts
├── Game.test.ts                    ← 对应 Game.ts
├── player/
│   ├── Player.ts
│   ├── Player.test.ts              ← 对应 Player.ts
│   ├── Resources.ts
│   ├── Resources.test.ts           ← 对应 Resources.ts
│   ├── Computer.ts
│   ├── Computer.test.ts
│   ├── DataPool.ts
│   ├── DataPool.test.ts
│   ├── Income.ts
│   ├── Income.test.ts
│   ├── Pieces.ts
│   └── Pieces.test.ts
├── board/
│   ├── SolarSystem.ts
│   ├── SolarSystem.test.ts
│   ├── Sector.ts
│   ├── Sector.test.ts
│   ├── PlanetaryBoard.ts
│   ├── PlanetaryBoard.test.ts
│   ├── TechBoard.ts
│   └── TechBoard.test.ts
├── actions/
│   ├── LaunchProbe.ts
│   ├── LaunchProbe.test.ts
│   ├── Orbit.ts
│   ├── Orbit.test.ts
│   ├── Land.ts
│   ├── Land.test.ts
│   ├── Scan.ts
│   ├── Scan.test.ts
│   ├── AnalyzeData.ts
│   ├── AnalyzeData.test.ts
│   ├── PlayCard.ts
│   ├── PlayCard.test.ts
│   ├── ResearchTech.ts
│   ├── ResearchTech.test.ts
│   ├── Pass.ts
│   └── Pass.test.ts
├── freeActions/
│   ├── Movement.ts
│   ├── Movement.test.ts
│   ├── ...（每个 free action 同理）
├── input/
│   ├── PlayerInput.ts
│   ├── PlayerInput.test.ts
│   ├── OrOptions.ts
│   ├── OrOptions.test.ts
│   ├── ...（每个 input type 同理）
├── deferred/
│   ├── DeferredAction.ts
│   ├── DeferredAction.test.ts
│   ├── DeferredActionsQueue.ts
│   ├── DeferredActionsQueue.test.ts
│   ├── Priority.ts
│   ├── Priority.test.ts
│   ├── ...（每个 deferred action 同理）
├── cards/
│   ├── Card.ts
│   ├── Card.test.ts
│   ├── CardRegistry.ts
│   ├── CardRegistry.test.ts
│   ├── Behavior.ts
│   ├── Behavior.test.ts
│   ├── BehaviorExecutor.ts
│   ├── BehaviorExecutor.test.ts
│   ├── Requirements.ts
│   ├── Requirements.test.ts
│   ├── base/
│   │   ├── CardXxx.ts
│   │   └── CardXxx.test.ts        ← 每张卡牌一个单测
│   └── alien/
│       ├── ...（同理）
├── alien/
│   ├── AlienRegistry.ts
│   ├── AlienRegistry.test.ts
│   ├── Anomalies.ts
│   ├── Anomalies.test.ts
│   └── ...（每个 alien module 同理）
├── scoring/
│   ├── Milestone.ts
│   ├── Milestone.test.ts
│   ├── GoldScoringTile.ts
│   ├── GoldScoringTile.test.ts
│   ├── FinalScoring.ts
│   └── FinalScoring.test.ts
├── deck/
│   ├── Deck.ts
│   ├── Deck.test.ts
│   ├── MainDeck.ts
│   ├── MainDeck.test.ts
│   ├── AlienDeck.ts
│   └── AlienDeck.test.ts
├── event/
│   ├── GameEvent.ts
│   ├── GameEvent.test.ts
│   ├── EventLog.ts
│   └── EventLog.test.ts
└── ...

src/persistence/
├── serializer/
│   ├── GameSerializer.ts
│   ├── GameSerializer.test.ts
│   ├── GameDeserializer.ts
│   └── GameDeserializer.test.ts
├── repository/
│   ├── GameRepository.ts
│   ├── GameRepository.test.ts      ← 需要 DB mock
│   └── ...

src/gateway/
├── game.gateway.ts
├── game.gateway.test.ts            ← NestJS testing module
└── ...

src/lobby/
├── lobby.controller.ts
├── lobby.controller.test.ts
├── lobby.service.ts
└── lobby.service.test.ts

src/shared/
├── rng/
│   ├── SeededRandom.ts
│   └── SeededRandom.test.ts
└── errors/
    ├── GameError.ts
    └── GameError.test.ts
```

#### 测试分层策略

| 层级 | 测试类型 | 覆盖目标 | 说明 |
|------|---------|----------|------|
| **Engine 纯逻辑** | 单元测试 | 每个类/函数的独立行为 | 无外部依赖，直接 `new` 构造，断言状态变化 |
| **Actions** | 单元测试 | 合法性校验 + 解析执行 + 边界条件 | 每个 main action / free action 覆盖合法/非法/边界三类场景 |
| **Cards** | 单元测试 | `canPlay` / `play` / `bespokePlay` / VP 计算 | 每张卡牌至少一个测试用例 |
| **Board** | 单元测试 | 旋转、邻接、放置、sector 结算 | 使用固定 seed 确保确定性 |
| **Deferred/Input** | 单元测试 | 队列排序、优先级、PlayerInput 流程 | 验证 continuation 链正确性 |
| **Scoring** | 单元测试 | 里程碑、金色计分、终局计算 | 用固定分数状态断言结果 |
| **Serialization** | Round-trip 测试 | serialize → deserialize → 状态一致性 | 覆盖所有 DTO 字段 |
| **全流程仿真** | 集成测试 | 完整 5 轮游戏模拟 | 固定 seed + 预编排 action 序列，验证最终分数 |
| **Gateway/REST** | 集成测试 | WebSocket 事件收发、HTTP 接口 | 使用 NestJS `Test.createTestingModule` + Socket.IO client |
| **Repository** | 集成测试 | DB 读写 + snapshot undo | 使用 testcontainers 或内存 PG |

#### 测试辅助工具

```typescript
// test/helpers/TestGame.ts — 快速构造测试用 Game 实例
function createTestGame(options?: Partial<IGameOptions>): IGame {
  const seed = 'test-seed-deterministic';
  const players = [createTestPlayer('Alice'), createTestPlayer('Bob')];
  return Game.create(players, { ...DEFAULT_OPTIONS, ...options }, seed);
}

// test/helpers/TestPlayer.ts — 快速构造测试用 Player
function createTestPlayer(name: string, overrides?: Partial<IPlayerInit>): IPlayer;

// test/helpers/ActionRunner.ts — 简化 action 执行并自动 drain 队列
class ActionRunner {
  constructor(private game: IGame) {}

  executeMainAction(player: IPlayer, action: MainAction): void;
  executeFreeAction(player: IPlayer, action: FreeAction): void;
  respondToInput(player: IPlayer, response: InputResponse): void;
  drainAll(): void;
  advanceToRound(round: number): void;
  runFullGame(actions: ActionSequence[]): IGame;
}
```

#### 全流程仿真测试示例

```typescript
describe('Full game simulation', () => {
  it('completes a 2-player 5-round game with deterministic seed', () => {
    const game = createTestGame({ playerCount: 2 });
    const runner = new ActionRunner(game);

    // Round 1: Alice launches probe, Bob scans, ...
    runner.executeMainAction(game.players[0], { type: 'LAUNCH_PROBE' });
    runner.executeMainAction(game.players[1], { type: 'SCAN', sector: ESector.RED, discardCardIndex: 0 });
    // ... pre-scripted action sequence ...

    // After 5 rounds
    runner.advanceToRound(5);
    // ... final actions ...

    expect(game.phase).toBe(EPhase.GAME_OVER);
    expect(game.players[0].score).toBe(expectedScore0);
    expect(game.players[1].score).toBe(expectedScore1);
  });
});
```

#### PRD QA 检查表覆盖（PRD §18）

以下每一项都需要对应具体的 test case：

| QA 项 | 对应测试文件 |
|-------|------------|
| Setup 合法性与随机约束 | `Game.test.ts`, `GameSetup.test.ts` |
| 每个 main action 合法/非法边界 | `actions/*.test.ts` |
| Scan tie-break (latest marker wins) | `Scan.test.ts`, `Sector.test.ts` |
| Sector reset (second-place retention) | `Sector.test.ts` |
| Analyze 合法性 (top-row full only) | `AnalyzeData.test.ts` |
| Research 始终触发旋转 (含卡牌授予的 tech) | `ResearchTech.test.ts`, `SolarSystem.test.ts` |
| 每轮第一个 pass 触发旋转 | `Pass.test.ts` |
| 多玩家同窗口 milestone 顺序 | `Milestone.test.ts` |
| Discovery 在 milestone 之后 | `ResolveDiscovery.test.ts` |
| Overflow trace 计分和计数 | `MarkTrace.test.ts` |
| 终局计算公式 (每个 gold tile side) | `GoldScoringTile.test.ts`, `FinalScoring.test.ts` |
| Serialization round-trip | `GameSerializer.test.ts` |
| Undo restore 正确性 | `GameRepository.test.ts` |

#### CI 集成

```yaml
# turbo.json 已有 test pipeline，Vitest 直接对接
# packages/server/package.json:
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

覆盖率门禁：engine 层要求 **90%+ statements/lines/functions**，**85%+ branches**。CI 中 `vitest run --coverage` 未达标则失败。

### 6.3 Reconnection & Resilience

- On disconnect, the player's WebSocket session is marked stale but the game continues (other players see a "disconnected" indicator).
- On reconnect, the server pushes the full projected state to the reconnected client.
- If the disconnected player has a pending `PlayerInput`, a configurable timer starts. On timeout, the server either auto-passes or auto-selects a default.

### 6.4 Spectator Mode

Spectators join the game room via WebSocket and receive the same `game:state` events but with all hands hidden. No action permissions.

### 6.5 Rate Limiting & Validation

- NestJS `ThrottlerGuard` on REST endpoints
- Per-player action rate limiting on WebSocket (prevent spam)
- All inputs validated server-side — client is untrusted

### 6.6 Common Package Integration

The server imports `@seti/common` for:
- Card static data (`IBaseCard`, `baseCards`, `alienCards`, etc.)
- Shared enums (`ESector`, `EResource`, `ETrace`, `ETech`, `EAlienType`, etc.)
- Type definitions shared between client and server

New shared types needed for client-server communication (e.g., `IPublicGameState`, `IPlayerInputModel`, action DTOs) should be added to `@seti/common` or a new `@seti/shared` package.

### 6.7 Dependency Summary

```json
{
  "dependencies": {
    "@nestjs/core": "^11.x",
    "@nestjs/common": "^11.x",
    "@nestjs/platform-socket.io": "^11.x",
    "@nestjs/websockets": "^11.x",
    "drizzle-orm": "^0.41.x",
    "drizzle-kit": "^0.30.x",
    "pg": "^8.x",
    "@seti/common": "workspace:*",
    "socket.io": "^4.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "bcrypt": "^5.x",
    "jsonwebtoken": "^9.x"
  },
  "devDependencies": {
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "typescript": "^5.x",
    "tsup": "^8.x",
    "@types/node": "^22.x"
  }
}
```

---

## 7. Decision Points (Pending Confirmation)

### Decision 1: WebSocket Library

| Option | Pros | Cons |
|--------|------|------|
| **A. Socket.IO** (recommended) | Auto-reconnect, room abstraction, fallback transport, broad client support | Slightly heavier than raw WS |
| B. Raw `ws` | Minimal overhead | No built-in rooms, reconnect, or fallback; more boilerplate |

**Recommendation:** Socket.IO — the room/namespace model maps perfectly to game sessions, and auto-reconnect is critical for multiplayer UX.

### Decision 2: Database

| Option | Pros | Cons |
|--------|------|------|
| **A. PostgreSQL** (recommended) | JSONB for snapshots, mature, Drizzle first-class support | Heavier to set up locally |
| B. SQLite | Zero-config, embedded | JSONB support weaker, concurrency limits |

**Recommendation:** PostgreSQL — JSONB is ideal for game state snapshots, and the project will likely need concurrent access.

### Decision 3: Undo Implementation

| Option | Pros | Cons |
|--------|------|------|
| **A. Snapshot-based** (recommended) | Simple, guaranteed correctness, enables any undo depth | Storage cost per action |
| B. Event-sourcing (reverse each event) | Less storage | Complex reverse logic, hard to guarantee correctness for all card effects |

**Recommendation:** Snapshot-based — simplicity and correctness outweigh storage cost. Snapshots can be pruned after a configurable retention window.

### Decision 4: Shared Types Package

| Option | Pros | Cons |
|--------|------|------|
| **A. Extend `@seti/common`** | No new package, simpler dependency graph | Mixes card data with protocol types |
| B. New `@seti/shared` package | Clean separation of static data vs runtime protocol | One more package to maintain |

**Recommendation:** Start with A (extend `@seti/common`), extract to `@seti/shared` later if the boundary becomes unclear.

### Decision 5: Auth Strategy

| Option | Pros | Cons |
|--------|------|------|
| **A. JWT** (recommended) | Stateless, works across REST + WS, standard | Token refresh complexity |
| B. Session-based | Simpler for WS | Server-side session store needed |

**Recommendation:** JWT — stateless tokens work cleanly with both REST endpoints and WebSocket handshake auth.

### Decision 6: Test Framework

| Option | Pros | Cons |
|--------|------|------|
| **A. Vitest** (recommended) | ESM 原生、TS 零配置、与 Turbo 对接、内置 coverage、API 兼容 Jest | 生态略新于 Jest |
| B. Jest + ts-jest | 最广泛的社区支持 | ESM 配置繁琐 (`"type": "module"` 需要额外 transform 设置)，ts-jest 转换慢 |

**Recommendation:** Vitest — 项目已使用 ESM + TypeScript，Vitest 开箱即用，零额外配置。

### Decision 7: Initial Scope — Alien Species

| Option | Description |
|--------|-------------|
| **A. Base 5 aliens** | Implement all 5 base-game aliens from the start |
| B. Core engine first | Build engine with alien plugin interface but defer species implementations; test with no aliens discovered |

**Recommendation:** B — build the plugin interface first, validate the core engine loop, then implement species one by one.

---

## 8. Implementation Phases (Suggested)

| Phase | Scope | Goal |
|-------|-------|------|
| **P0** | Engine core: `Game`, `Player`, `DeferredActionsQueue`, `PlayerInput`, phase machine, turn loop | A game can run in memory with hardcoded test inputs |
| **P1** | All 8 main actions + 6 free actions with full validation | Action legality is complete per PRD §7-8 |
| **P2** | Cards: base class, behavior system, card registry, ~10 representative cards | Card pipeline works end-to-end |
| **P3** | Board: solar system rotation, sector completion, planetary board | Board mechanics are fully functional |
| **P4** | Scoring: milestones, gold tiles, final scoring | Complete game loop from setup to final score |
| **P5** | Persistence: Drizzle schema, serialization, undo | Games survive server restart |
| **P6** | NestJS: REST lobby + WebSocket gateway + auth | Playable over network |
| **P7** | Alien species: implement 2-3 species, validate plugin system | Expansion system proven |
| **P8** | Polish: reconnection, spectator, rate limiting, full card set | Production-ready |
