---
name: board-game-architecture
description: Architecture patterns for building turn-based tabletop/card game servers using OOP. Use when designing or implementing a board game, card game, or turn-based game engine. Covers game lifecycle, player state, player input, deferred actions, card systems, board topology, deck/draft, and modular expansion integration.
---

# Board Game Architecture

A general-purpose OOP architecture for turn-based tabletop and card games, distilled from a production implementation (~5000+ source files). Focuses on game logic — not framework concerns like auth, DB, or serialization.

## Full Architecture Map

```
Game (aggregate root, session lifecycle)
├── Board (hex graph, spaces, adjacency, placement rules)
│   └── BoardBuilder (fluent map construction)
├── Decks (generic Deck<T> with draw/discard/reshuffle)
│   └── Draft (template-method drafting system)
├── Players[]
│   ├── Stock (current resource holdings)
│   ├── Production (per-generation resource income)
│   ├── Tags (tag counting with substitutions)
│   ├── Colonies (fleet/trade state)
│   ├── Hand / Tableau (PlayedCards)
│   └── WaitingFor → PlayerInput (pending decision)
├── DeferredActionsQueue (priority-ordered effect queue)
│   └── DeferredAction<T> (queued effect, may yield PlayerInput)
├── Cards
│   ├── ICard hierarchy (IProjectCard, ICorporationCard, IPreludeCard, ...)
│   ├── Card base class (bespokePlay/bespokeCanPlay pipeline)
│   ├── Requirements (compiled, inequality-based satisfaction)
│   ├── Behavior (declarative effect DSL)
│   │   └── BehaviorExecutor (singleton interpreter)
│   └── ModuleManifest + GameCards (registration & filtering)
├── PlayerInput types (SelectCard, OrOptions, SelectSpace, ...)
├── Global Parameters (temperature, oxygen, Venus, ...)
└── Expansion Data (optional per-module state + static façade)
```

## Key Principles

1. **Interface-first**: `IGame` / `IPlayer` interfaces narrow dependencies. Concrete classes implement them.
2. **Aggregate root**: `Game` owns all shared state. Players hold a back-reference.
3. **Two interaction systems**: `PlayerInput` = synchronous choice (what the player sees). `DeferredAction` = queued effect (what the engine schedules). Separated by concern.
4. **Continuation-based flow**: `execute()` returns `PlayerInput | undefined` — return input to pause, undefined to continue.
5. **Declarative card behaviors**: `Behavior` data + `BehaviorExecutor` interpreter. `Card` base class provides `bespokePlay`/`bespokeCanPlay` extension points.
6. **Expansion via composition**: `ModuleManifest` registries + static façade guard patterns. No `Game` subclassing.
7. **Composed player state**: `Stock`, `Production`, `Tags`, `Colonies` are extracted subsystems sharing a `BaseStock` base.
8. **Generic deck + template-method draft**: `Deck<T>` handles any card type. `Draft` abstract class defines the drafting algorithm; subclasses configure direction, draw count, and end-round behavior.

## Reference Index

| Component | Description | Reference |
|-----------|-------------|-----------|
| **Game** | Session lifecycle, phase machine, aggregate root | [references/game.md](references/game.md) |
| **Player** | Per-player state, composed subsystems, action loop | [references/player.md](references/player.md) |
| **PlayerInput** | Synchronous choice types, composite pattern | [references/input.md](references/input.md) |
| **DeferredAction** | Queued effects, priority system, action queue | [references/deferred-action.md](references/deferred-action.md) |
| **Cards** | Hierarchy, base class, requirements, behavior, registration | [references/cards.md](references/cards.md) |
| **Board** | Hex graph, spaces, adjacency, builder, map variants | [references/board.md](references/board.md) |
| **Deck & Draft** | Generic deck abstraction, template-method drafting | [references/deck-draft.md](references/deck-draft.md) |
| **Expansion** | 5-layer composition pattern, guard façades | [references/expansion.md](references/expansion.md) |

## Design Patterns Summary

| Pattern | Where | Purpose |
|---------|-------|---------|
| Aggregate Root | `Game` | Single owner of all shared mutable state |
| Interface Segregation | `IGame` / `IPlayer` | Narrow dependency surface for cards and subsystems |
| Composite | `OrOptions` / `AndOptions` | Nested decision trees from simple input primitives |
| Command / Continuation | `DeferredAction` → `PlayerInput` | Async multi-step card resolution without deep stacks |
| Priority Queue | `DeferredActionsQueue` + `Priority` | Correct ordering of costs, effects, reactions |
| Template Method | `Card` (bespokePlay), `Draft` (draw/endRound) | Shared pipeline with extension points |
| Abstract Factory / Registry | `ModuleManifest` + `CardFactorySpec` + `GameCards` | Pluggable card pools per expansion |
| Interpreter | `Behavior` + `BehaviorExecutor` | Declarative card effect DSL |
| Static Façade + Guard | `MoonExpansion.ifMoon()`, `Turmoil.ifTurmoil()` | Safe expansion entry points |
| Composed State | `Stock`, `Production`, `Tags`, `Colonies` | Player subsystems with shared base class |
| Fluent Builder | `BoardBuilder`, `BasePlayerInput.andThen()` | Readable construction of maps and input chains |
| Generic + Typed Subclass | `Deck<T>` → `ProjectDeck`, `CorporationDeck`, ... | Reusable deck logic, type-safe card handling |
