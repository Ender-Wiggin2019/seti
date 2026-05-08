# Solo / Rival Rules

> Sources:
> - `docs/references/SE_rulebook_EN_36_web.raw.md`, especially rulebook pages 22-27.
> - `docs/references/Rival_Reminders.pdf`.
> - `docs/arch/solo/frontend-reference-data.md` for extracted frontend-reference
>   card/config data.
>
> Source policy: use the rulebook as the primary rule source. Use `Rival_Reminders.pdf`
> as an implementation reminder when it clarifies priority order or edge timing.
> When the two sources differ, the discrepancy is recorded instead of guessed away.

Source map:

- Rulebook page 22: setup, rival deck, advanced cards, objectives stack.
- Rulebook page 23: progress, converted resources, data, publicity, VP, gold
  milestone behavior.
- Rulebook page 24: rival turn flow, tech, launch.
- Rulebook page 25: orbiter/lander, telescope, life trace priority.
- Rulebook page 26: analyze, species discovery replacement, passing,
  objectives.
- Rulebook page 27: objective task clarifications, end game.
- `Rival_Reminders.pdf`: priority summary for tech, probe, orbiter/lander, life
  traces, telescope, computer, milestones, passing, and objectives.
- `frontend-reference-data.md`: internal rival action cards, objective config,
  initial progress, preferred tech order, and special alien card constraints
  extracted from `frontend-reference` plus existing alien notes.

## 1. Scope

Solo mode is a normal 2-player game where the human player competes against a
scripted rival research institution.

- The human player uses normal multiplayer rules.
- The rival uses a dedicated rival board, rival action cards, progress track,
  simplified resources, simplified tech handling, and optional objective tiles.
- The goal is to have more VP than the rival after round 5.
- If the human has more VP than the rival, the human wins.

## 2. Setup

### 2.1 Base Setup

Set up the game as a 2-player game.

Rival setup:

1. Give the rival all pieces of one color.
2. Place one rival marker on the starting space of the rival progress track.
3. Randomly determine starting player.
4. The first player starts at 1 VP; the other starts at 2 VP.
5. Set both publicity counters to 4.
6. Choose a difficulty from 1 to 5 stars and give the rival the matching rival
   board. The 1-star and 2-star difficulties share a board.
7. The starting-player marker passes between the human and the rival after each
   round, as in a 2-player game.

Implementation notes:

- The rival does not receive the human starting income card, starting credits,
  starting energy, or starting hand.
- Board-specific setup data must include:
  - progress-track starting space
  - objective stack composition
  - rival computer slot rewards
  - analyze reward printed on the rival board
  - preferred-tech mapping around the progress track
- Confirmed extracted setup data is listed in
  `docs/arch/solo/frontend-reference-data.md`.

### 2.2 Rival Action Deck

The rival acts through a rival action deck.

1. Shuffle the 4 basic action cards `S.1-S.4` face down to form the starting
   rival action deck.
2. On 3-star difficulty or higher, randomly select one advanced action card from
   `S.5-S.15` and shuffle it into the starting rival action deck.
3. Keep the rest of the shuffled advanced action cards nearby. The rival can add
   those cards during the game.
4. Set the 5 alien species special action cards aside. When a relevant species
   is discovered, some rival action cards are replaced by the corresponding
   special alien action card.

### 2.3 Objectives Stack

Skip this whole section on 1-star difficulty.

Objective tiles have 3 levels: I, II, and III.

1. Shuffle each level separately.
2. Build the objectives stack with level III on the bottom, level II in the
   middle, and level I on top.
3. Use the rival board to determine how many objective tiles of each level are
   included.
4. Reveal the top 3 objective tiles. The human always has 3 available objectives
   until the objective stack runs out.

Objective stack composition visible in the rulebook/rival board imagery:

| Difficulty | Level I | Level II | Level III | Notes |
| --- | ---: | ---: | ---: | --- |
| 1-star | 0 | 0 | 0 | No objectives. Ignore objective penalties and end-game objective VP. |
| 2-star | 2 | 3 | 5 | Shares the 1-star/2-star rival board; 1-star still skips objectives. |
| 3-star | 2 | 4 | 6 | Starts with one random advanced action card. |
| 4-star | 2 | 6 | 7 | Starts with one random advanced action card. |
| 5-star | 2 | 7 | 8 | Starts with one random advanced action card. |

This matches the captured frontend-reference setup data.

## 3. Rival State Model

The rival needs these state areas:

- `score`: normal VP marker.
- `publicity`: tracked normally and spent on some tech actions.
- `progress`: rival-only progress marker moving clockwise.
- `actionDeck`: draw pile containing basic and gained advanced action cards.
- `playedActionCardsThisRound`: revealed action cards that have been resolved.
- `advancedActionDeck`: shuffled reserve of advanced action cards not yet gained.
- `specialAlienActionCards`: set-aside species cards.
- `probe`: at most one rival probe in play.
- `computer`: 6-slot rival computer plus unlimited data pool.
- `techTiles`: stored by tech type; tech abilities do not apply normally.
- `objectives`: revealed row, draw stack, and completed-objective pile.

The rival does not track credits, energy, hand cards, normal income, or normal
card choices.

## 4. Rival Resources

### 4.1 Victory Points

Whenever the rival gains VP, move its score marker normally.

The rival triggers neutral milestones and gold milestones as a player would.

### 4.2 Publicity

Whenever the rival gains publicity, advance its publicity counter.

The rival spends publicity only for rival tech actions that require 6 publicity.

### 4.3 Progress

The rival progress marker always moves clockwise.

Progress can be gained from:

- printed progress effects on rival action cards
- credit / energy / card rewards converted to progress
- income-increase rewards converted to progress
- objective penalties
- passing card removal
- computer tech bonus during Analyze
- crossing progress-track effects can add advanced action cards

When the progress marker crosses the advanced-card icon:

1. Add 1 random advanced action card face down to the top of the rival action deck.
2. It becomes a permanent part of the rival deck.
3. If the rival has already passed this round, the added card will not be drawn
   until a later round.

### 4.4 Credits, Energy, and Cards

The rival does not keep credits, energy, or cards.

Whenever an effect gives the rival any of these, gain 1 progress per credit,
energy, or card instead.

This includes:

- printed credit rewards
- printed energy rewards
- printed card rewards
- cards gained from passing
- cards gained from helping discover an alien species

### 4.5 Income Increase

When the rival would gain an income increase, gain 4 progress instead.

This usually happens when the rival places an orbiter.

### 4.6 Data

Whenever the rival gains a data token:

1. Add it directly to the rival computer if there is an empty computer slot.
2. Fill the computer immediately when data is available.
3. If the computer is full, put the data token in the rival data pool instead.
4. The rival data pool has no limit.
5. When data is placed on a computer slot with a printed benefit, resolve that
   benefit immediately.

Implementation notes:

- Computer fill order should follow the printed rival computer slots, left to
  right.
- Data in the rival computer and data in the rival data pool are separate.
- Analyze clears only the computer, not the data pool.

## 5. Rival Tech

The rival does not use tech abilities like a player. Rival tech tiles are a
resource that can be discarded to improve specific rival actions.

Tech type bonuses:

| Tech type | Rival use |
| --- | --- |
| Probe / orange tech | Can be discarded to prioritize landing on an available moon. |
| Telescope / red tech | Can be discarded during Telescope to mark one extra signal from the card row. |
| Computer / blue tech | Can be discarded during Analyze for 3 VP and 1 progress. |

When the rival gains a tech:

1. Rotate the solar system as usual.
2. Look at the rival's current progress-track position. It shows the preferred
   tech.
3. Starting at that position, find the nearest tech stack whose top tile still
   has a 2 VP tile. Take that tech.
4. If no tech stack has a 2 VP tile, take the first available tech starting from
   the current progress-track position.
5. Store the tech on the rival board by tech type.
6. Give the rival all printed tech-tile bonuses, including the 2 VP bonus if
   present.
7. Exception: the rival never gains Probe Launch or 2 Data bonuses from tech.

Board-derived preferred-tech order, captured frontend stack-index order, and
difficulty-specific initial progress values are in
`docs/arch/solo/frontend-reference-data.md`.

Rival action cards can grant tech in two ways:

- Paid tech: spend 6 publicity. If the rival has less than 6 publicity, skip this
  action candidate.
- Free tech: no publicity cost.

## 6. Rival Turn Flow

The rival takes turns like the other player in a 2-player game.

On the rival turn:

1. If the rival action deck has at least one card, reveal the top rival action
   card.
2. Resolve exactly one action candidate on that card.
3. Check action candidates from top to bottom.
4. Use the first candidate that is possible.
5. If a candidate is impossible, skip it and check the next candidate.
6. After one candidate resolves, the rival turn ends.
7. If the rival action deck is empty at the start of its turn, the rival passes.

Every rival action card also has a decision arrow. Use this arrow whenever a
rule says to choose leftmost or rightmost.

Implementation shape for action cards:

```ts
type RivalActionCard = {
  id: string;
  decisionArrow: "left" | "right";
  candidates: RivalActionCandidate[];
};
```

Each candidate should be data-driven. The rulebook defines how to resolve action
types, but the exact candidate list, planet order, move count, and printed
benefits belong to the rival action card data.

Extracted frontend-reference candidate data is documented in
`docs/arch/solo/frontend-reference-data.md`. Its `Ref ID` values are internal
frontend card ids; do not assume they are printed S-numbers without checking
card art.

## 7. Rival Actions

### 7.1 Launch

Place a rival probe on Earth.

If the rival already has a probe on Earth, skip this action candidate.

Reminder note:

- `Rival_Reminders.pdf` states that the rival can only have 1 probe in play at a
  time. For implementation, enforce at most one rival probe anywhere in play.

### 7.2 Tech

Resolve the tech-gain procedure from section 5.

If the action requires 6 publicity and the rival has less than 6 publicity, skip
this action candidate.

### 7.3 Orbiter / Lander

This action moves the rival probe from Earth directly to a planet, then converts
it into an orbiter or lander.

Requirements:

- The rival must have a probe on Earth.
- At least one planet in the card's printed planet priority list must be
  reachable with the printed movement amount.
- Leaving asteroids costs 1 extra movement, as in normal movement.

Planet selection:

1. Read the printed planets left to right from the action card.
2. Choose the first planet that is reachable with the printed movement amount.
3. If no printed planet is reachable, skip this action candidate.

Path selection:

- If multiple paths can reach the chosen planet, choose the path that gives the
  most publicity from visiting planets and comets.
- Give the rival all publicity earned from visiting planets and comets during
  that path.

Final conversion priority:

1. If the planet has an available moon space and the rival can discard a Probe /
   orange tech, discard one such tech and land on a moon.
2. If multiple moon spaces are available, choose leftmost or rightmost by the
   decision arrow.
3. If no moon landing happens, the rival tries to take a planet orbiter or lander
   result.
4. If exactly one of the first orbiter / first lander bonus spaces is available,
   choose the available one.
5. If both first spaces are available, use the action card's printed
   orbiter-vs-lander priority.
6. If neither first space is available, still use the action card's printed
   orbiter-vs-lander priority and place the corresponding orbiter/lander without
   first-space bonus.

After placement:

- Give the rival any VP, resource rewards, and life traces earned from the chosen
  orbiter or lander result.
- Apply rival resource conversion rules for credits, energy, cards, and income
  increases.

### 7.4 Telescope

Mark signals for the rival as printed by the action card.

Card-row signals:

1. If the signal comes from the card row, use the decision arrow to choose from
   the left or right side of the row.
2. Discard each selected card.
3. Use the selected card's sector color for the signal.
4. After all card-row signals are resolved, refill the card row from the deck.

Earth-sector signals:

- If the action marks an Earth signal, mark a signal in Earth's sector.

Telescope tech:

- If the rival has a Telescope / red tech, discard one to mark one extra signal
  from the card row.

Sector choice when a signal color can be marked in multiple sectors:

1. Choose a sector where marking the signal would win the sector.
2. If none, choose a sector where marking the signal would score points for the
   second signal in that sector.
3. If none, choose the sector where the rival already has the most markers.
4. For ties at any step, choose the larger sector, meaning the sector that can
   contain the most data.

The rulebook says Telescope is always possible.

### 7.5 Life Trace Placement

Whenever the rival gains a life trace:

1. For the gained trace color, inspect that trace column for each alien species.
2. The rival marks the lowest available space in that column.
3. Ignore overflow spaces below the column unless all other spaces for that
   trace color are full.
4. For a universal trace, consider all available trace columns.
5. If candidate spaces are equally low, choose leftmost or rightmost by the
   decision arrow.
6. Resolve the marked space reward.

The rival can contribute to species discovery through these markers.

### 7.6 Analyze

Analyze is possible only if the rival computer is full.

If the computer is not full, skip this action candidate.

When Analyze resolves:

1. Remove all data tokens from the rival computer.
2. Do not remove data tokens from the rival data pool.
3. Resolve the benefit printed on the action card.
4. The rival also gains the blue trace shown on the rival board.
5. If the rival data pool has any data afterwards, place as much as possible into
   the computer immediately, resolving slot benefits as data is placed.
6. If the rival has at least one Computer / blue tech, discard exactly one of
   them to gain 3 VP and 1 progress.

### 7.7 Species Discovery Replacement

Some rival action cards begin with a check for whether a specific alien species
has been discovered.

If the required species has been discovered:

1. Remove the current action card from the game.
2. Replace it with the corresponding special action card for that species.
3. Resolve the new special action card immediately.

If the required species has not been discovered:

1. Skip this action candidate.
2. Try the next candidate on the current card.

The rulebook extraction identifies these species cards. The raw text does not
preserve every icon cleanly, so implementation should use the species-mapped
frontend-reference sequence plus the FAQ/alien notes:

| Printed card | Species | Rulebook/FAQ semantic check | Frontend-reference sequence |
| --- | --- | --- | --- |
| `S.15` | Mascamites | Take a random sample from the planet and place it face up on the species board, ignoring the sample reward. | Ref `15`: `launch(publicity)` -> `probe(5, Saturn > Jupiter, lander, discardBug)` |
| `S.16` | Anomalies | If the rival is not winning the next anomaly, mark a trace of that anomaly color for this species and gain the printed reward. | Ref `19`: `trace(Anomalies)` -> `tech(free, progress)` |
| `S.17` | Oumuamua | If the rival can reach the Oumuamua tile within 4 moves, place there; otherwise resolve the Oumuamua telescope signal action. | Ref `16`: `probe(4, Oumuamua, lander)` -> `look(oumuamua)` |
| `S.18` | Centaurians | If the rival still has a message tile in reserve and none on the scoring track, place one ahead of its current score, then resolve the printed follow-up. | Ref `18`: `startCountdown(15)` -> `look(default)` |
| `S.19` | Exertians | Count rival played Exertian cards plus rival traces on the Exertians board. If total is less than 5, the rival secretly plays an Exertian card. | Ref `17`: `dangerCard(5)` -> `look(earth)` |

Important implementation note:

- Special-card implementation should combine extracted frontend-reference action
  data with the species notes summarized in
  `docs/arch/solo/frontend-reference-data.md`.
- If frontend-reference internal action data conflicts with `docs/arch/aliens/*`
  or `docs/arch/rule-faq.md`, use the alien/FAQ rule and record the mismatch.
- Frontend-reference Ref IDs are internal `cardId` values; map special cards by
  species, not by assuming the Ref ID equals the printed `S` number.

## 8. Passing

If the rival starts a turn with no cards left in its action deck, it passes.

Rulebook flow:

1. Remove the top card from the current end-of-round stack.
2. The removed card counts as a card gained by the rival, so the rival gains
   1 progress.
3. If the rival is the first to pass that round, rotate the solar system.

Confirmed interpretation:

- Use the rulebook version: remove the top card.
- Ignore the `random card` wording from `Rival_Reminders.pdf` for implementation.

End-of-round action cards:

- At round transition, shuffle revealed/used rival action cards back into the
  rival action deck.
- Do not shuffle back cards permanently removed by species discovery replacement.

## 9. Objectives

Objectives are used on 2-star difficulty and higher.

### 9.1 Objective Tasks

Each objective tile has one or more tasks.

- When the human completes a task, mark it.
- When all tasks on an objective are marked, the objective is completed.
- Most tasks use symbols from triggerable missions.
- If a task has a slash (`/`), mark the task when either side is accomplished.
- Just like triggerable missions, only one marker can be placed from a single
  trigger. If one trigger satisfies multiple objectives, choose one objective to
  mark.

Tasks with explicit rulebook clarifications:

| Task | When to mark |
| --- | --- |
| Reach 16 VP | Mark when the human reaches 16 VP. If already at 16 or more when revealed, mark immediately. |
| Have at least 5 data tokens in data pool | Mark when the human has at least 5 data tokens in the data pool. If already at 5 or more when revealed, mark immediately. Data on computer spaces does not count. |
| Reach 9 publicity | Mark when the human reaches 9 publicity. If already at 9 or more when revealed, mark immediately. |
| Probe visits asteroids | Mark when the human probe visits asteroids after this task is revealed. |
| Probe visits a comet | Mark when the human probe visits a comet after this task is revealed. |
| Play a card costing exactly 3 credits | Mark when the human plays a card for its effect with exactly 3 credits cost. Free-action discard use does not count. |
| Complete a mission | Mark when the human completes a mission after this task is revealed. |

### 9.2 Objective Refresh

At the end of the human player's turn:

1. Move all completed objectives into the completed-objectives pile near the
   human board.
2. Refill the objective row to 3 tiles from the objectives stack, if possible.
3. Continue until the objective stack runs out.

### 9.3 Between-Round Objective Payment

At the end of rounds 1, 2, 3, and 4, before income:

1. Spend completed objectives equal to the round that just ended.
2. Round 1 spends 1 completed objective.
3. Round 2 spends 2 completed objectives.
4. Round 3 spends 3 completed objectives.
5. Round 4 spends 4 completed objectives.
6. For each objective the human cannot spend, the rival gains 3 progress.

On 1-star difficulty:

- No objectives are used.
- The rival does not gain progress for uncompleted objectives between rounds.

### 9.4 End-Game Objective Scoring

At the end of round 5:

1. Count all uncompleted objectives still in the revealed row of three.
2. Count all uncompleted objectives still in the objective stack.
3. The rival gains 5 VP per uncompleted objective.

Completed objectives already moved to the completed pile are not counted as
uncompleted.

On 1-star difficulty, the rival gains no end-game VP from objectives.

## 10. Milestones and Gold Scoring Tiles

The rival triggers neutral and gold milestones as a player would.

Gold milestone handling:

1. The rival claims only the first, most valuable slot on a gold scoring tile.
2. If multiple gold tiles have their first slot available, choose the leftmost or
   rightmost such tile by the current action card's decision arrow.
3. If every gold tile's first slot is already occupied, the rival claims nothing.
4. The rival does not score points for gold scoring tiles.
5. Rival markers on gold tiles still block those first slots from the human.

Neutral milestones:

- Resolve neutral milestone behavior normally for a 2-player game.
- Rival scoring can trigger neutral milestones.
- Neutral markers can contribute to alien discovery as usual.

## 11. End Game

The game ends after 5 rounds as usual.

Human scoring:

- Score the human normally, including end-game scoring cards, gold scoring tiles,
  and alien-specific end-game scoring.

Rival scoring:

- The rival keeps all VP gained during play.
- The rival does not score gold scoring tiles.
- The rival gains 5 VP per uncompleted objective, if objectives are used.
- Some alien species may add extra scoring rules; apply those if the species
  rules say the rival is affected.

Win condition:

- If the human has more VP than the rival, the human wins.

## 12. Implementation Rules

### 12.1 Architecture Boundary

`frontend-reference` is a behavior reference, not an architecture reference.
Implementation must follow this project's current monorepo split:

- `packages/common` owns shared static data, IDs, enums, and protocol-visible
  types. Rival action card definitions, difficulty config, preferred-tech board
  config, and species replacement mapping should be represented here when they
  are needed by both server tests and client rendering.
- Rival action cards are solo control cards, not player action cards. Do not mix
  them into `mainDeck`, `cardRow`, or the normal `IBaseCard` action-card pool
  unless a separate display adapter explicitly needs card art metadata.
- `packages/server` owns all rival rule resolution. Rival turns, card reveal,
  candidate selection, deck mutation, RNG, progress, objectives, special alien
  behavior, and final scoring are server engine logic.
- `packages/client` renders server state and sends normal player input. It must
  not duplicate rival AI, choose rival actions, mutate rival decks, or infer
  hidden rival state from `frontend-reference` data.
- Shared reusable rule concepts should use existing common enums first:
  `EPlanet`, `ETech`, `ETechId`, `ETrace`, `EResource`, `EAlienType`,
  `EMainAction`, `EFreeAction`, and protocol/public-state types.
- If a needed solo/rival concept has no existing common enum, add a small
  purpose-specific common type before implementing server/client code against
  ad hoc strings.

### 12.2 Frontend Reference Usage

Use `frontend-reference` only for:

- card candidate order and printed effect extraction
- board asset/config confirmation
- edge-case behavior hints that can be verified against rulebook, FAQ, or alien
  notes

Do not port:

- frontend state containers such as `activeAutomaCards`
- source-only deck names such as `automaActions`
- generic frontend deck-data bags that mix unrelated decks under one
  `deckData` object
- ambiguous aliases such as `pop`, `fly`, `look`, `comp`, `bug`, `rover`, or
  `satellite`
- source code control flow when it conflicts with this server engine's
  aggregate-root, deck, deferred-action, and protocol model

When `frontend-reference` conflicts with rulebook, FAQ, alien notes, or board
assets, use the rulebook/FAQ/alien/board source and record the mismatch in the
test fixture or rule data comment.

### 12.3 Canonical Naming

Domain code should use rule- and project-level names, not source aliases:

| Source alias | Canonical project concept |
| --- | --- |
| `automa` | `rival` / `Rival*` |
| `deckData.automaActions` | `RivalActionCardDefinition` data |
| `deckData.soloGoals` | `RivalObjectiveDefinition` / solo objective data |
| frontend `cards` object | typed definition map or array; avoid untyped `cards` bags in domain code |
| frontend numeric `cardId` / `Ref ID` | source reference only; verified printed IDs should be `S.1`, `S.2`, etc. |
| `tier: "s"` | `RivalActionCardDeckTier.BASIC` |
| `tier: "1"` | `RivalActionCardDeckTier.ADVANCED` |
| `tier: "life"` | `RivalActionCardDeckTier.SPECIES_SPECIAL` |
| `arrow: "left" / "right"` | `decisionDirection` |
| `pop` | `EResource.PUBLICITY` |
| `fly` | `ETech.PROBE` |
| `look` | `ETech.SCAN` |
| `comp` | `ETech.COMPUTER` |
| `rover` | lander placement priority |
| `satellite` | orbiter placement priority |
| `bug` / `discardBug` | Mascamites sample conversion |
| `life1`, `life4`, `life5`, `life6`, `life7` | `EAlienType.MASCAMITES`, `EXERTIANS`, `OUMUAMUA`, `CENTAURIANS`, `ANOMALIES` |

Suggested common data shape:

```ts
type RivalActionCardDefinition = {
  id: RivalActionCardId;
  sourceRefId?: string;
  deckTier: RivalActionCardDeckTier;
  decisionDirection: "LEFT" | "RIGHT";
  candidates: RivalActionCandidateDefinition[];
};
```

The implementation can choose exact type names, but it should preserve these
semantic boundaries: card identity, deck tier, decision direction, ordered
candidate list, and normalized typed arguments.

### 12.4 Deck and State Model

Use the server's existing `Deck<T>` semantics where possible:

- `drawPile`: unrevealed rival action cards available this round
- `discardPile`: revealed/used rival action cards waiting for round reset
- `rivalActionReserve`: advanced cards not yet gained
- `removedRivalActionCards`: cards permanently removed by species replacement
- `rivalSpeciesSpecialCards`: set-aside special cards, keyed by `EAlienType`

Rival action draw must not use `drawWithReshuffle` mid-round. If the rival action
draw pile is empty at the start of the rival turn, the rival passes. Revealed and
used cards are shuffled back only at round transition.

Progress-card gain uses `Deck.addToTop`: when the rival crosses the printed
advanced-card icon, add 1 random advanced card face down to the top of the rival
action draw pile. This is not a normal discard reshuffle.

Use the existing `endOfRoundStacks` model for passing. The rival pass removes
the top card from the current stack; do not introduce a separate
`cardPassOffer`-style frontend model.

### 12.5 Implementation Checklist

Recommended implementation decomposition:

1. `SoloSetup`
   - difficulty config
   - rival board config
   - rival action deck setup
   - objective stack setup
2. `RivalState`
   - score/publicity/progress/probe/computer/tech/objectives/action cards
3. `RivalResourceResolver`
   - VP
   - publicity
   - progress
   - credit/energy/card conversion
   - income conversion
   - data placement
4. `RivalActionResolver`
   - reveal card
   - candidate selection
   - action-type resolvers
   - decision-arrow tie handling
5. `RivalObjectives`
   - task triggers
   - one-marker-per-trigger
   - refresh
   - between-round payment
   - end-game penalty VP
6. `RivalMilestones`
   - gold tile claim/block behavior
   - neutral milestone integration
7. `RivalAlienSpecials`
   - species replacement cards
   - species-specific special action resolvers

## 13. Confirmed Implementation Decisions

The previously open points are resolved as follows:

1. Passing removes the top card from the current end-of-round stack.
2. Rival action card data is available from `frontend-reference` and extracted in
   `docs/arch/solo/frontend-reference-data.md`.
3. Species action behavior should use the existing alien notes and FAQ
   clarifications, now summarized in `frontend-reference-data.md`.
4. Progress-track start values and preferred-tech order are board/config data;
   the board-derived order and captured frontend stack-index order are
   documented separately in `frontend-reference-data.md`.
5. Revealed/used rival action cards are shuffled back into the rival action deck
   at round transition, except cards removed by species replacement.

Implementation caution:

- Frontend-reference internal `cardId` values are not guaranteed to match printed
  S-numbers. Keep tests focused on action semantics unless card art has been
  separately verified.
