# ANOMALIES

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw (from `docs/arch/rule-faq.md`)
- Generic alien traces rule:
  - Discovery spaces and overflow spaces count as traces for that species.
  - When marking alien traces, players may choose any unoccupied matching-color space, including alien boards, undiscovered discovery spaces, and overflow spaces.
- Generic alien cards rule:
  - Alien cards can be used for marking signals only when a tech allows discarding a hand card for signal.
  - Exception stated in FAQ: Exertian cards cannot be discarded by any means.
- S.16 ANOMALIES action card (solo/rival FAQ):
  - Determine next anomaly color (closest counter-clockwise from Earth).
  - Check who leads that color column on anomaly board.
  - Rival resolves upper/lower action based on whether rival is leading.
  - If rival marks trace, rival marks lowest available matching-color space and gains space reward plus 3 extra points.

### PDF Raw (from `SETI_Alien_rule_sheets_(EN).pdf`, pages 3-4)
- Setup:
  - Place 3 anomaly tokens random side up in outer ring:
    - one in Earth sector
    - one 3 sectors counter-clockwise from Earth
    - one 3 sectors clockwise from Earth
  - If token is in Neptune/Uranus space, place so planet remains visible.
- Discovery & cards:
  - On species discovery: shuffle deck, distribute cards to discovery-space markers (1 card per marker).
  - Keep deck near anomaly board; maintain one face-up card.
  - Draw icon allows top-deck draw or take face-up then refill.
  - Cards may be tucked/discarded like normal alien cards and count toward hand limit.
- Triggering anomalies:
  - Whenever solar system rotates, check if Earth is in same sector as an anomaly.
  - If yes, resolve immediately.
  - Each anomaly has one of 3 colors (matching anomaly board columns).
  - Highest marker in triggered column gains anomaly reward.
  - If no marker in column, no reward.
  - Discovery spaces below board do not count for anomaly reward competition.
  - No probe-visit bonus for anomalies.
- Board detail:
  - Top anomaly space gives 2 points and is always available.
  - Later markers stack above earlier markers on top space.

### Code Raw (from `packages/common/src/data/alienCards.ts`)
- Alien type key: `EAlienType.ANOMALIES`
- Card IDs and names:
  - `ET.20` Amazing Uncertainty
  - `ET.17` Are we Being Observed?
  - `ET.12` Close-up View
  - `ET.13` Concerned People
  - `ET.16` Flooding the Media Space
  - `ET.14` Listening Carefully
  - `ET.18` Message Capsule
  - `ET.19` New Physics
  - `ET.15` Part of Everyday Life
  - `ET.11` Signs of Life

## Detailed Layer

### 1. Setup Contract
- Place exactly 3 anomaly tokens as defined above.
- Token orientation is random side up.
- Setup location offsets are Earth-anchored and symmetric (+3 / -3 sectors).

### 2. Runtime Trigger Contract
- Trigger check point: every solar-system rotation event.
- Trigger condition: Earth sector overlaps an anomaly token sector.
- Trigger timing: immediate resolution at that moment.

### 3. Resolution Contract
- Determine anomaly color from triggered token.
- Compare marker heights only on matching-color anomaly column spaces.
- Winner gains reward printed on triggered anomaly.
- If no eligible marker exists, reward is skipped.
- Discovery-row markers are explicitly excluded from this comparison.

### 4. Card Economy Contract
- Discovery event seeds card flow (1 card per discovery marker).
- Draw source is dual-mode: top deck or shared face-up slot.
- Face-up slot is self-replacing after take.
- Card lifecycle follows general alien-card handling (tuck/discard, hand-limit counted).

### 5. FAQ-Constrained Clarifications
- Trace-count references include discovery and overflow spaces unless the specific effect narrows scope.
- For rival S.16 behavior, next-anomaly color and current lead status are both required inputs.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - anomaly token positions + colors
  - last rotation result / Earth sector index
  - anomaly board column marker stacks
- Recommended event hooks:
  - `onSolarSystemRotated`
  - `onAnomalyTriggered(color)`
- Deterministic tie handling should reuse existing board stacking order rules.
