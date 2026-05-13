# ARKHOS

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw
- Generic alien traces/card usage rules from `docs/arch/rule-faq.md` apply:
  - Discovery spaces and overflow spaces count as traces for that species when an effect references traces for a species.
  - When marking alien traces, players may choose any unoccupied matching-color space, including alien boards, undiscovered discovery spaces, and overflow spaces.
  - Alien cards can be used for marking signals only when a tech allows discarding a hand card for signal.
- `docs/arch/spaceAgency/faq.md` currently has no Arkhos-specific clarification.

### PDF Raw (from `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf`, pages 1-2)
- Components:
  - 1 Arkhos alien board.
  - 9 exploration cards.
  - 4 sets of security cards.
- Discovery and exploration deck setup:
  - On discovery, shuffle the 9 exploration cards face down.
  - Set 4 exploration cards aside.
  - The remaining 5 cards form the exploration deck.
  - Players who marked the three discovery spaces gain minor exploration rewards, 1 reward per marker.
  - For each discovery-space marker, reveal one exploration card and that marker's owner gains its minor exploration reward.
  - Keep revealed exploration cards in a discard pile beside the exploration deck.
- Security cards setup:
  - Deal 3 security cards in front of each player with the life trace side face up.
  - Each player gets 1 random security card with each trace color.
  - In games with fewer than 4 players, return remaining security cards to the box without looking at them.
- Exploration reward icons:
  - Arkhos board effects and security cards can grant rewards from exploration cards.
  - Minor exploration reward: reveal the next exploration card and gain its minor reward.
  - Major exploration reward: reveal the next exploration card and gain its major reward.
  - When the exploration deck runs out, shuffle all revealed exploration cards together with the 4 set-aside cards, create a new 5-card exploration deck, and set the remaining 4 aside again.
- Species board access:
  - The Arkhos board represents the ship and is divided into 4 security levels.
  - Initially, only the top 3 spaces in Level 0 are markable.
  - Marking an overflow space below the Arkhos board lets the player breach the security card with the corresponding trace.
  - Breaching takes that security card into the player's hand.
  - 1 breached card gives access to Level 1.
  - 2 breached cards give access to Level 1 and Level 2.
  - Breaching all 3 security cards gives access to all spaces on the Arkhos board.
  - Once the player has no security cards in front of them, they may mark any Arkhos board space.
- Using security cards:
  - Once breached into hand, a security card counts toward hand limit and can be used like a regular card.
  - Discarding a security card for its free-action corner effect gives a minor exploration reward.
  - Playing a security card as a main action costs 2 credits and gives a major exploration reward.
  - A player does not lose access to deeper Arkhos levels after discarding or playing a breached security card.
- Solo/rival notes:
  - When Arkhos is discovered, rival gains the contribution reward and 3 security cards like a player.
  - If rival would gain the printed Arkhos card/reward icon shown in the solo box, rival gains 1 progress instead.
  - Rival breaches security cards only by playing the Arkhos alien action card.
  - Ignore Arkhos board spaces rival cannot access yet.
  - When choosing where to mark a trace, if both species have equally low available spaces, rival prefers Arkhos.

### Code Raw
- No canonical `EAlienType.ARKHOS` exists in `packages/common/src/types/BaseCard.ts`.
- `packages/common/src/constant/alien.ts` contains an `ark` placeholder button entry, but no typed Arkhos alien option.
- No Arkhos alien cards exist in `packages/common/src/data/alienCards.ts` or `packages/common/src/data/spaceAgencyAliens.ts`.
- `frontend-reference` contains a WIP option named "Exploring Space Ship", but current common/server code does not expose a matching Arkhos plugin or state model.

## Detailed Layer

### 1. Setup Contract
- Arkhos discovery initializes two card systems:
  - shared exploration deck: 5 active cards plus 4 set-aside cards
  - per-player security cards: 3 face-up trace-matched cards per player
- Security cards are not in hand at setup; they sit in front of the player until breached.

### 2. Exploration Deck Contract
- Exploration cards are reward carriers, not a normal player hand deck.
- Every minor/major exploration reward reveals exactly the next exploration card and resolves the corresponding reward band.
- Deck reset is deterministic in shape:
  - combine revealed discard pile with the 4 set-aside cards
  - shuffle
  - build a new 5-card deck
  - set the remaining 4 cards aside

### 3. Security Access Contract
- Arkhos board spaces are gated by a per-player access level.
- Access level is derived from how many of that player's security cards have ever been breached, not how many remain in hand.
- Marking Arkhos overflow is the breach trigger, and the overflow trace color selects which security card is breached.

### 4. Security Card Lifecycle
- Lifecycle:
  - dealt face up in front of player
  - breached into hand
  - later discarded for minor exploration or played for 2 credits for major exploration
- Breached security cards count against hand limit after entering hand.
- Playing/discarding a security card does not revoke Arkhos board access already unlocked.

### 5. Solo/Rival Contract
- Rival needs per-species access state like a player.
- Rival cannot breach from generic overflow behavior unless the Arkhos alien action card says so.
- Rival trace-choice priority has an Arkhos tie-breaker when both species offer equally low spaces.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - exploration draw pile, revealed pile, and set-aside pile
  - per-player security cards by trace color and zone (`front`, `hand`, `used`)
  - per-player breached security count / accessible Arkhos levels
  - Arkhos board space occupancy and level metadata
- Recommended events:
  - `onArkhosDiscovered`
  - `onArkhosOverflowMarked`
  - `onArkhosSecurityCardBreached`
  - `onArkhosExplorationRewardResolved`
