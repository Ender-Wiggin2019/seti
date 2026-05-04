# CENTAURIANS

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw (from `docs/arch/rule-faq.md`)
- Species-specific:
  - Centaurian cards are not missions.
- Generic milestone timing (relevant to message milestones):
  - Milestones resolve at end of turn when reached/passed.
  - No free actions during/after milestone resolution window.

### PDF Raw (from `SETI_Alien_rule_sheets_(EN).pdf`, pages 7-8)
- Discovery setup:
  - On discovery, each player places a personal message tile milestone 15 points ahead of current score.
- Discovery & cards:
  - Shuffle/distribute species cards by discovery markers (1 card per marker).
  - Keep deck + face-up card beside board.
  - Draw icon supports deck draw or face-up take + refill.
  - Cards may be tucked/discarded and count toward hand limit.
- Core card rule:
  - Centaurian cards cost energy instead of credits.
  - On play: place marker 15 points ahead, resolve white part now, keep card pending.
  - On reaching marker: resolve green part.
- Income conversion:
  - Some cards become uncommon income type after tuck.
  - Gain depicted resource immediately when tucked.
  - Non-income Centaurian cards are discarded normally.
- Multiple pending messages:
  - Stack pending message cards oldest on top, resolve in sent order.
- Reaching message milestone:
  - Choose one available reward on species board and cover it (locks it).
  - Reward spaces cannot be occupied more than once.
  - Available reward spaces:
    - any trace
    - 1 energy + 1 alien card from the Centaurians alien deck/row
    - 3 publicity
    - 8 VP
- Solo/rival notes:
  - Rival places one message milestone and may use leftovers via action card.
  - Rival chooses leftmost/rightmost available reward based on decision arrow.
  - Rival pays data-cost spaces only with full computer and enough leftover data.

### Code Raw (from `packages/common/src/data/alienCards.ts`)
- Alien type key: `EAlienType.CENTAURIANS`
- Card IDs and names:
  - `ET.34` A Message from Afar
  - `ET.36` Alien Schematics
  - `ET.32` Exocomputers
  - `ET.38` Hivemind Concept
  - `ET.33` Infocluster
  - `ET.37` Music of the Spheres
  - `ET.35` Synthesis Instructions
  - `ET.39` Telescope Blueprints
  - `ET.40` Torrent-chain Signal
  - `ET.31` Vessel Designs

## Detailed Layer

### 1. Setup Contract
- Discovery immediately injects delayed-reward milestones per player.
- Baseline offset for message milestones is exactly +15 score from each player's current marker.

### 2. Delayed Message Card Lifecycle
- Play-time phase:
  - Pay energy cost.
  - Resolve white effect immediately.
  - Register delayed effect at +15 milestone.
- Trigger-time phase:
  - At milestone reach/pass, resolve during that turn's end-of-turn milestone window.
  - First choose and cover one available Centaurians reward space.
  - Then resolve the pending message card's green effect.
- Order guarantee:
  - Multiple pending message cards that reach their threshold in the same end-of-turn window resolve one at a time.
  - Resolution order is FIFO by send time (oldest pending message first).

### 3. Board Reward Market
- Species board acts as shared consumable reward market.
- Message milestone claim permanently blocks chosen reward space.
- The four non-repeatable reward spaces are:
  - any trace
  - 1 energy + 1 Centaurians alien card
  - 3 publicity
  - 8 VP

### 4. Reward Occupancy
- Reward spaces are non-repeatable.
- Once a reward space is covered, no later message milestone can claim it.

### 5. FAQ-Constrained Clarifications
- Centaurian cards are never mission objects.
- Milestone timing is strict end-of-turn timing gate.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - per-player pending message queue
  - per-player message milestone position
  - species board reward occupancy
  - data pool vs computer data separation
- Recommended events:
  - `onCentaurianCardPlayed`
  - `onScoreAdvanced`
  - `onEndTurnMilestoneResolution`
