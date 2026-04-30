# SETI PRD - Rule Spec (Client/Server Oriented)

## 1. Document Purpose

This document defines a code-ready rule specification for the SETI base game (multiplayer mode), intended for implementation planning.

- Source baseline:
  - `docs/rule.md` (structured quick-rule backbone)
  - `docs/SE_rulebook_EN_36_web.raw.md` (full extracted rulebook text)
- Goal:
  - Preserve original rule meaning as faithfully as possible
  - Translate tabletop rules into deterministic digital game logic
  - Separate client responsibilities from server responsibilities
- Out of scope:
  - UI style, animation, audio, account, matchmaking, monetization
  - Solo mode AI logic (rulebook pages 22+), except extensibility notes
  - Alien-specific sub-rule sheets (loaded when species is discovered)

---

## 2. Product Rule Scope

### 2.1 Supported Mode

- Base competitive game (2-4 players)
- 5 rounds fixed
- Hidden alien species: 2 selected from 5

### 2.2 Rule Fidelity Target

- Action legality, resolution order, and scoring must match rulebook behavior
- Tie-breaking and trigger timing are first-class requirements
- When text ambiguity exists, server must implement one deterministic policy and mark it in logs/rule config

---

## 3. Responsibility Split

## 3.1 Client Responsibilities (Presentation + Input)

- Render all board zones and components:
  - solar system rings/discs/sectors/stars
  - planetary board, orbits, landing spots, moons
  - tech board stacks, round-card stacks, milestones
  - player boards (computer, tech slots, data pool, resources, score/publicity)
- Show legal action affordances from server-provided legal moves
- Collect player choices for branch points:
  - which card to discard/select
  - which sector/alien/trace/tech/target to choose
  - optional mission completion and optional trigger uses
- Display event timeline and rule explanations for each resolution step
- Show hidden/public information boundaries:
  - hidden deck order, hidden alien boards before discovery
  - visible discard, visible board state, visible scores/resources (as configured)

### 3.2 Server Responsibilities (Authority + Rules Engine)

- Own canonical state and RNG
- Validate all actions and reject illegal commands
- Resolve all effects deterministically in rule order
- Manage turn/round lifecycle and passed-player skipping
- Execute all triggers:
  - milestones
  - sector completion
  - species discovery
  - immediate rewards from placement/effects
- Compute all VP changes, resource changes, and final scoring
- Produce auditable event log

---

## 4. Core Game Model (Server Canonical State)

### 4.1 Global State

- `gameId`
- `playerCount` (2-4)
- `round` (1-5)
- `currentPlayerId`
- `startPlayerId`
- `turnStatus` (`await_main_action`, `in_resolution`, `turn_end`)
- `rotationCounter` (which disc rotates next)
- `rotationReminderRoundStackIndex` (for first-pass reminder)
- `hasRoundFirstPassOccurred` (bool)
- `isGameEnded` (bool)

### 4.2 Board State

- Solar system topology:
  - disc positions
  - sector layout mapping
  - adjacency graph (non-diagonal moves)
  - asteroid flags, publicity icons, planet occupancy spaces
- Nearby stars:
  - per-sector data slot capacity
  - current data tokens in slot
  - placed markers in slot + overflow markers
  - winner markers beside star (first/later win slots)
- Planetary board:
  - per-planet orbit occupancy list
  - per-planet landing occupancy list
  - first-orbit bonus taken flag
  - first-land data bonus taken flags (Mars has two)
  - moon occupancy (single-slot each)

### 4.3 Alien State

- `candidateSpecies` (2 selected hidden species)
- For each hidden/discovered species:
  - discovery spaces (3 trace-color spaces)
  - overflow spaces markers
  - discovered flag
  - species-specific board state (loaded on discovery)

### 4.4 Card/Tech State

- Main deck draw pile
- Main discard pile
- Card row (3 open cards)
- End-of-round stacks (4 stacks, players+1 cards each)
- Per-player:
  - hand
  - played missions (face up)
  - completed missions (face down)
  - end-game scoring cards in play
  - tucked income cards
- Tech:
  - 12 tech stacks with top order
  - 2 VP tile availability per stack

### 4.5 Player State

- `score`
- `publicity`
- `credits`
- `energy`
- `probesInSpaceCount` (default max 1 unless tech raises to 2)
- `probeSpaceLimit` (1 default, 2 with probe tech)
- pieces:
  - available figures/markers
  - placed orbiters/landers/probes/sector markers
- computer:
  - top row slots (required for Analyze)
  - bottom slots from computer tech
  - data tokens placement
- `dataPool` (max 6)
- pass status per round

---

## 5. Setup Specification

### 5.1 Shared Setup

Server must execute:

1. Build board composite.
2. Select 2 alien species hidden from 5.
3. Randomize solar-system discs + 4 sector boards under validity constraint:
   - exactly 8 sectors
   - each sector has 1 nearby star
4. Shuffle main deck and reveal 3 to card row.
5. Fill each sector data slot with initial data per star capacity.
6. Place 4 gold scoring tiles with random side up.
7. Place neutral milestone markers:
   - 2p: two markers at 20 and two at 30
   - 3p: one at 20 and one at 30
   - 4p: none
8. For each of 12 tech types:
   - shuffle 4 tiles into stack (face-down side)
   - add 2 VP tile on top
9. Build 4 end-of-round stacks, each `playerCount + 1` cards.
10. Place rotation reminder tokens at:
   - tech-board reminder space
   - round-1 end-of-round stack

### 5.2 Player Setup

For each player:

- Set publicity to 4.
- Give 4 credits, 3 energy, 5 drawn cards.
- Force one card to be tucked as initial income conversion.
- Initialize score markers by seat order:
  - first player score 1, second 2, third 3, fourth 4.

---

## 6. Turn, Phase, and Resolution Order

### 6.1 Turn Contract

- Exactly one main action per turn.
- Any number of legal free actions may occur during the turn.
- After main action + free actions finish, server resolves between-turn systems:
  1. milestone resolutions
  2. species discovery resolutions
- Then pass turn clockwise to next non-passed player.

### 6.2 Round End Contract

- Round ends when all players have pass flag = true.
- End-of-round sequence:
  1. all players gain income from base + tucked cards
  2. start player advances one seat left
  3. rotation reminder moves to next round stack
  4. clear pass flags, initialize next round state
- After round 5 completes, trigger final scoring and end game.

---

## 7. Main Actions (Validation + Resolution)

## 7.1 Launch Probe

Validation:
- player has >=2 credits
- `probesInSpaceCount < probeSpaceLimit`

Resolution:
- spend 2 credits
- place one figure on Earth ring space
- increase in-space probe count

### 7.2 Orbit

Validation:
- player has >=1 credit and >=1 energy
- at least one own probe on non-Earth planet space

Resolution:
- spend resources
- move chosen figure from ring to planet orbit (planetary board)
- decrease in-space probe count
- grant orbit bonus above planet
- if first orbit slot not claimed:
  - claim it
  - +3 VP
- no hard cap on orbiters per planet

### 7.3 Land

Validation:
- at least one own probe on non-Earth planet space
- energy >= cost, where:
  - 3 normally
  - 2 if any orbiter already at that planet

Resolution:
- spend energy
- move chosen figure from ring to planet or moon landing slot
- decrease in-space probe count
- apply landing rewards:
  - planet center reward (includes life trace + VP)
  - first-lander bonus data if still available
  - Mars has two first-lander bonus slots
- moon rules:
  - normally cannot land unless enabled by effect/tech
  - each moon allows one lander only

### 7.4 Scan Nearby Stars

Validation:
- credits >=1 and energy >=2

Resolution core:
- spend 1 credit + 2 energy
- perform scan substeps in any order:
  1. mark signal in Earth sector
  2. discard one card from card row, mark one signal in matching sector
  3. optionally activate telescope tech sub-effects (order chosen by player; pay each cost)

Signal marking operation:
- remove leftmost data token in target sector slot (if exists), add to player's data pool
- place marker into next marker position
- if marker occupies second data-slot position: +2 VP immediately
- if placing excess marker beyond available data positions:
  - no data gained
  - marker still counts for majority

Sector completion:
- when last data token removed, sector is flagged complete
- after main action ends, resolve all completed sectors in chosen order:
  - winner = most markers
  - tie breaker = latest placed marker wins
  - all contributors gain +1 publicity
  - winner places persistent win marker near star and gains shown reward
  - determine second place similarly; second leaves marker on first slot
  - return all other slot markers, refill data tokens to capacity

### 7.5 Analyze Data

Validation:
- energy >=1
- all top-row computer spaces are filled

Resolution:
- spend 1 energy
- discard all data tokens from computer (top + bottom spaces)
- keep data in data pool untouched
- mark one blue life trace for chosen species target

### 7.6 Play Card

Validation:
- chosen card in hand
- player can pay main-action cost

Resolution:
- pay cost
- resolve card effect atomically
- if card invokes another action type, do that action effect without paying standard action cost
- post-resolution destination:
  - normal card -> discard pile
  - mission / end-game card -> stay in front of player

Mission semantics:
- conditional mission:
  - can complete as free action during player's turns when condition is true
  - if condition already true at play time, immediate completion is optional
  - completion can be delayed
- trigger mission:
  - only events after card enters play may trigger
  - each trigger slot can be used once
  - some triggers may occur outside owner's turn
  - if one event can satisfy multiple trigger options, only one slot may be claimed per event resolution
  - after all slots covered, auto-complete mission

### 7.7 Research Tech

Validation:
- publicity >=6 (unless rule source is a card effect granting free tech)
- at least one valid tech in chosen type not already owned

Resolution:
1. Rotate solar system (always, including card-effect research).
2. Spend 6 publicity only for normal main-action research.
3. Take top tile from chosen stack (no duplicates per player).
4. If first tile from stack:
   - remove stack 2 VP tile
   - score +2 VP
5. Grant immediate printed bonus.
6. Flip/place tile in appropriate slot:
   - probe/telescope fixed families
   - computer tech any computer tech slot
   - placing under existing data is allowed and does not count as data placement

### 7.8 Pass

Pass is a main action; free actions may still happen before pass sequence locks.

Pass resolution order:
1. Discard down to 4 hand cards.
2. If first player passing this round:
   - rotate solar system
   - consume/move reminder token (round 5 still rotates; reminder discarded)
3. Choose one card from current round end-of-round stack.
4. Mark player as passed.

Round closes when last active player passes and final end-of-round card selection resolves.

---

## 8. Free Actions

### 8.1 Movement

- Spend 1 movement per adjacent (non-diagonal) step.
- Leaving asteroid space costs +1 extra movement.
- Entering space with publicity icon grants publicity immediately.
- Moving through sun is illegal (sun is not traversable space).

### 8.2 Convert Energy/Card to Movement

- Spending 1 energy grants 1 movement (free action).
- Discarding cards with movement icon can also provide movement.

### 8.3 Place Data into Computer

- Only during own turn.
- Move data from data pool to computer spaces.
- Top row fills left-to-right.
- Bottom slot requires top slot above it already filled.
- Immediate rewards on covered spaces resolve instantly (publicity, income tuck, VP, etc.).
- Data pool hard cap = 6; overflow gained data is discarded.

### 8.4 Complete Mission

- Conditional missions can be completed as free action when condition true.

### 8.5 Free-Action Corner on Cards

- Discard one hand card to resolve its top-left free action.

### 8.6 Buy Card

- Spend 3 publicity.
- Take one card from card row or top of deck.
- If taken from row, refill immediately.
- If deck empty, reshuffle discard into new deck.

### 8.7 Resource Exchange

- During turn, exchange:
  - 2 cards, or 2 credits, or 2 energy
  - for any 1 card / 1 credit / 1 energy

---

## 9. Solar System Rotation Rules

- Rotation occurs:
  - every research action (main or card effect)
  - first pass each round
- Rotation sequence is cyclic by counter:
  1. top disc
  2. middle disc (top moves with it)
  3. bottom disc (others move with it)
  4. repeat
- Probe movement during rotation:
  - probes on moving disc move with disc
  - probes in cutouts may stay
  - probes can be bumped to next valid space
  - bumped movement is free and grants immediate publicity if icon reached

---

## 10. Milestones and Deferred Resolutions

### 10.1 Trigger Timing

- Milestones resolve between turns (after current player's free actions complete).

### 10.2 Gold Milestones (25/50/70)

- On reaching or passing threshold, player marks one gold scoring tile.
- Cannot mark same tile twice.
- First claimant of a tile gets highest value slot; later claimants get lower slots.
- Crossing >100 later laps does not retrigger milestone effects.

### 10.3 Neutral Milestones (20/30, non-4p)

- Resolve by moving neutral marker to leftmost empty discovery space among 6 base discovery slots.
- Can trigger species discovery.
- If all 6 spaces full or markers exhausted, no effect.
- In 4-player games neutral milestones are disabled.

### 10.4 Multiple Milestones in Same Window

- Resolve in seat order starting from player whose turn just ended.
- Neutral milestone always resolves last.

---

## 11. Alien Discovery System

### 11.1 Discovery Condition

- A species is discovered when its 3 discovery spaces are all marked.
- Markers can be player or neutral (in 2p/3p).

### 11.2 Discovery Resolution Timing

- If discovery occurs during a turn:
  - resolve after that turn ends
  - but after pending milestones

### 11.3 Discovery Resolution Steps

1. Reveal species board.
2. Load/apply species rule sheet.
3. Execute species setup and grant rewards tied to discoverers.

### 11.4 Overflow and Further Traces

- Overflow trace spaces are color-specific, available from setup, unlimited, and score 3 VP.
- Overflow markers count for card/effect checks referencing traces.
- Player may choose which species and matching-color space to mark, including overflow.
- Neutral markers never occupy species-board extra research spaces (only base six discovery spaces).

---

## 12. Scoring Specification

### 12.1 Immediate VP Sources

- Orbit first arrival bonus (+3 VP per planet first slot)
- Landing rewards
- Sector second-slot marker (+2 VP)
- Sector win rewards
- Trace claims and overflow trace VP
- Mission/tech/card immediate effects
- Tech-stack first-take bonus (+2 VP)

### 12.2 End-of-Game Sequence

At end of round 5 after final pass:

1. Score all played end-game scoring cards (gold-box cards).
2. Score gold scoring tiles using marked slot values and each side's formula.
3. Apply additional species-specific scoring step if active.
4. Highest VP wins; ties remain ties.

### 12.3 Gold Scoring Tile Formula Notes (from base rulebook)

- Tech tile side variants:
  - sets of 3 techs (one of each type), equivalent to min(typeCounts)
  - or pairs of any 2 techs (floor(totalTechs/2))
- Mission tile variants:
  - completed mission count
  - or sets involving tucked income card types
- Income/Other variants include:
  - most frequent tucked income type (credits vs energy)
  - sets of 3 life traces (one per color; overflow counts)
  - pairing sector wins with orbiters/landers (`min(totalWins, totalOrbitersAndLanders)`)
  - pairs of completed missions/end-game cards

Implementation note:
- Exact active side per tile must be stored in setup state.
- Do not count printed base income values on starting card where rulebook excludes them.

---

## 13. Hidden Information and Determinism

### 13.1 Hidden Information

- Main deck order
- Face-down alien species identity until discovered
- Future end-of-round stack content until selected/revealed by process

### 13.2 Determinism Requirements

- Server RNG seed should be capturable for replay/debug.
- Every state mutation must be represented as event log entries.
- Simultaneous-looking effects must still be linearized by explicit rule order.

---

## 14. Rule Engine Event Queue (Recommended)

Server should process in this priority pipeline:

1. Action declared and validated
2. Action cost payment
3. Action core effect
4. Immediate on-place/on-gain effects
5. Deferred completion checks (sector complete, hand limit, etc.)
6. End-of-turn milestone queue
7. Discovery queue
8. Turn handoff

This queue prevents timing bugs across milestone/discovery/card-trigger interactions.

---

## 15. Client Implementation Notes (Rule-Focused)

- Client should not infer legality locally beyond UX hints; final legality from server.
- For branching effects, client must request explicit choice tokens from server (choice schema).
- Client should present:
  - current pending queue item
  - legal options for that queue item
  - deterministic explanation text (for debugging and QA)

---

## 16. Server Validation Matrix (Minimum)

For each action, validate:

- turn ownership and phase correctness
- resource affordability
- board-position prerequisites
- capacity limits (data pool, moon occupancy, probe-in-space cap)
- once-only constraints (first-orbit slot, first-land data slots, mission trigger circle)
- duplicate prevention (same tech not researchable twice by one player)

On invalid action:
- reject with machine-readable error code + human-readable reason.

---

## 17. Config and Extensibility

- Base rules should be config-driven where practical:
  - player count dependent setup
  - neutral milestone enablement
  - alien species pool
  - scoring tile side definitions
- Alien species rules should be plug-in modules loaded on discovery:
  - `onDiscover`
  - `onTraceMark`
  - `onRoundEnd`
  - `onGameEndScoring`

This enables clean inclusion of species sheets without rewriting core engine.

---

## 18. QA Rule Test Checklist (Core)

- Setup validity and randomization constraints
- Every main action legal/illegal boundaries
- Scan tie-break by latest marker
- Sector reset with second-place retention
- Analyze legality (top-row full only)
- Research always rotates (including card-granted tech)
- First pass rotation per round
- Milestone ordering with multiple players
- Discovery after milestones ordering
- Overflow trace scoring and counting
- End-game formulas per gold tile side

This checklist should be converted into automated deterministic simulation tests.
