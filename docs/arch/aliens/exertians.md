# EXERTIANS

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw (from `docs/arch/rule-faq.md`)
- Species-specific:
  - Exertian cards are not missions and not end-of-game scoring cards for the gold tile that counts those cards.
  - Exertian card scoring condition yields printed points at most once per card, even if threshold is exceeded multiple times.
- Generic alien cards rule:
  - Exertian cards cannot be discarded by any means.

### PDF Raw (from `SETI_Alien_rule_sheets_(EN).pdf`, pages 9-10)
- Discovery distribution:
  - Shuffle Exertian deck.
  - Deal 3 cards to each player.
  - Players with discovery markers gain +1 card per marker.
  - Return remainder to box (deck not used later).
- Immediate discovery plays:
  - On species discovery, each player may play one Exertian card per discovery marker.
  - Cards played face down; reveal at game end.
- Hand/discard status:
  - Exertian cards are not considered in hand size.
  - Cannot be discarded in any way.
- Exertian milestones:
  - Place one milestone 20 points ahead of leading player.
  - Place second milestone 40 points ahead of leading player.
  - Crossing milestone may allow playing additional face-down Exertian card.
  - At second milestone, this extra play costs 1 credit and cannot be deferred if unpaid.
- Danger system:
  - Each Exertian card has hidden danger value (0..9).
  - Board markings also add danger: bottom tier +3, middle +2, top +1.
  - Endgame: reveal played Exertian cards, sum total danger.
  - Player(s) with most danger lose one-tenth of total points (round down).
  - Ties for most danger: all tied players lose points.
  - Danger penalty is applied after all other scoring, including Exertian card points.
- Solo/rival notes:
  - Rival only draws/plays Exertian cards via species action card; ignores Exertian milestones.
  - On discovery, rival does not draw/play cards, but advances progress for discovery markers.
  - Endgame rival Exertian cards are treated as successfully completed.

### Code Raw (from `packages/common/src/data/alienCards.ts`)
- Alien type key: `EAlienType.EXERTIANS`
- Card IDs and names:
  - `ET.52` Automated Lab
  - `ET.50` Casette Deployment
  - `ET.45` Core-breach Exoplanet
  - `ET.42` Deflector
  - `ET.43` Expender Core
  - `ET.51` Extractor
  - `ET.47` Fission-sun Exoplanet
  - `ET.49` Generative Infrastructure
  - `ET.54` Nanowielder Node
  - `ET.53` Neuralab
  - `ET.48` Oscillating Probes
  - `ET.44` pierced Exoplanet
  - `ET.41` Razor-edge Shuttle
  - `ET.55` Stratoelevator
  - `ET.46` Vortex Exoplanet

## Detailed Layer

### 1. Deck Lifecycle Contract
- Exertian deck is finite setup-only distribution.
- After setup dealing, no ongoing draw loop from this deck.

### 2. Hidden Commitment Mechanic
- Face-down Exertian play encodes two hidden dimensions:
  - private danger contribution
  - conditional VP objective
- Hidden info is revealed only at endgame.

### 3. Milestone-Granted Additional Plays
- Discovery markers grant immediate additional play opportunities.
- Global Exertian milestones grant further opportunities on score crossing.
- Second milestone adds strict credit gate with no delayed payment fallback.

### 4. Danger Penalty Contract
- Aggregate danger = sum(card danger + board danger).
- Penalty target set = all players tied for maximum danger.
- Penalty formula per targeted player:
  - `floor(total_points / 10)`
- Penalty timing is after all positive scoring is finalized.

### 5. FAQ-Constrained Clarifications
- Exertian cards are neither mission objects nor endgame scoring-card objects.
- Per-card score is boolean (condition met or not), not multiplicative with excess progress.
- Cards are non-discardable in all contexts.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - concealed Exertian card plays per player
  - Exertian milestone thresholds and pass tracking
  - danger accumulation channels (cards + board)
- Recommended events:
  - `onExertianDiscovered`
  - `onExertianMilestoneCrossed`
  - `onEndGameRevealAndDangerSettlement`
