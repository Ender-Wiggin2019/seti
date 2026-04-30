# MASCAMITES

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw (from `docs/arch/rule-faq.md`)
- Generic alien traces/card usage rules apply (discovery/overflow counting, alien-card signal discard with tech).
- S.15 MASCAMITES action card (solo/rival FAQ):
  - Rival's second action is always resolvable via Saturn/Jupiter distance condition.
  - Depending on landing planet/moon, take random sample tile from that planet, no sample reward to rival.
  - Flip sample and place in next dedicated Mascamites board slot; from then it is markable as blue space.
  - If no sample remains on landed planet, skip taking sample.

### PDF Raw (from `SETI_Alien_rule_sheets_(EN).pdf`, pages 1-2)
- Narrative setup:
  - Species associated with Jupiter/Saturn moons and mascot mineral samples.
- Discovery & cards:
  - On discovery: shuffle deck and distribute by discovery markers (1 card per marker).
  - Keep deck near board, maintain one face-up card.
  - Draw icon allows top-deck draw or face-up take + refill.
  - Cards can be tucked/discarded and count to hand limit.
- Samples setup:
  - Shuffle sample tokens face down.
  - Deal 3 samples to Jupiter and 3 to Saturn on solar system board.
  - Place remaining token face up on designated alien board space.
- Collecting samples:
  - Samples are collectable only if a card allows it.
  - On collection, view all tokens at that planet and choose 1.
  - Return others to the planet space.
  - Card can still be played on planets without samples; mission can be completed later.
- Sample capsule:
  - Player marker stacked on chosen sample token becomes a movable capsule.
  - Capsule starts where token was taken.
- Moving samples:
  - Whenever player could move a probe, may move capsule instead.
  - Capsule gains publicity on marked spaces and takes asteroid move-out penalty.
  - Capsule counts as probe for card/tech effects.
  - Capsule cannot become orbiter/lander and does not count toward probe limit.
- Multiple capsules:
  - Multiple capsules allowed.
  - Capsule-to-card lineage tracking not required.
- Delivering samples:
  - If capsule reaches destination of a Mascamite mission card, player may deliver as free action.
  - Delivery removes capsule, reveals token, grants token reward.
  - Keep card as completed mission.
  - Used token goes face up to next dedicated species-board space, becoming new blue space.
- Blue sample spaces:
  - Once sample token is in blue space, any player may mark it like normal blue space and take token reward.

### Code Raw (from `packages/common/src/data/alienCards.ts`)
- Alien type key: `EAlienType.MASCAMITES`
- Card IDs and names:
  - `ET.7` Breeding Sample
  - `ET.10` Computer Simulations
  - `ET.5` Ecosystem Study
  - `ET.1` First Contact
  - `ET.8` Hive Sample
  - `ET.4` Martian Quarantine Lab
  - `ET.3` Mass Sample Collection
  - `ET.9` Orbital Monitoring
  - `ET.2` Rover Exploration
  - `ET.6` The Queen

## Detailed Layer

### 1. Setup Contract
- Initialize dual sample pools on Jupiter and Saturn (3 each) plus one public board sample.
- Discovery seeds standard alien-card deck flow.

### 2. Sample Acquisition Contract
- Acquisition requires enabling card effect.
- Selection at planet is choose-one-from-visible-set, not blind random.
- If no sample at target, movement/landing may still resolve but no acquisition occurs.

### 3. Capsule Entity Contract
- Capsule is a pseudo-probe entity:
  - inherits movement opportunities of probe effects
  - participates in publicity/asteroid movement consequences
  - valid for probe-referencing card/tech effects
- Capsule exclusions:
  - cannot orbit/land transform
  - excluded from launched-probe limit

### 4. Delivery and Board Growth Contract
- Delivery is free-action gated by destination matching mission text.
- Delivery pipeline:
  - remove capsule
  - reveal token reward
  - score/resolve reward
  - convert token into permanent blue-space extension on species board
- Converted sample spaces become globally interactable blue spaces.

### 5. FAQ-Constrained Clarifications
- Rival S.15 flow can generate additional blue spaces through sample conversion.
- If rival sample source is depleted, sample conversion step is skipped.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - per-planet sample token pools
  - per-player capsule positions
  - mission destination matcher for delivery
  - converted-blue-sample slots
- Recommended events:
  - `onMascamiteSampleCollected`
  - `onCapsuleMoved`
  - `onMascamiteSampleDelivered`
