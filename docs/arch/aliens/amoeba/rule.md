# AMOEBA

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw
- Generic alien traces/card usage rules from `docs/arch/rule-faq.md` apply:
  - Discovery spaces and overflow spaces count as traces for that species when an effect references traces for a species.
  - When marking alien traces, players may choose any unoccupied matching-color space, including alien boards, undiscovered discovery spaces, and overflow spaces.
  - Alien cards can be used for marking signals only when a tech allows discarding a hand card for signal.
- Space Agencies FAQ Raw (from `docs/arch/spaceAgency/faq.md`):
  - `#ET.11` / `#ET.12` / `#ET.13`: Marked overflow spaces below the Amoeba board apply for these cards' gold boxes.
  - `#ET.14`: Marked overflow spaces below the Amoeba board count toward the mission condition. Discovery spaces do not.
  - `#ET.14`: The completed-mission reward scores empty spaces on the Amoeba board only; overflow spaces and rare empty discovery spaces below the board do not count.
  - `#ET.19`: The player may remove their marker from an Amoeba board space, a discovery space below it, or an overflow space belonging to Amoeba. Based on that space's color, gain bonuses from all organelle tokens in the matching section and move the tokens as usual.

### PDF Raw (from `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf`, pages 5-6)
- Components:
  - 1 Amoeba alien board.
  - 10 Amoeba cards.
  - 5 organelle tokens.
- Discovery and cards:
  - On discovery, shuffle the Amoeba deck and deal cards to players who marked the three discovery spaces.
  - Each player gets 1 Amoeba card per discovery marker.
  - Keep the deck near the Amoeba board.
  - Turn the top card face up and place it beside the deck.
  - Draw icon lets the player draw from the top of the deck or take the face-up card and replace it with the top card.
  - Amoeba cards can be tucked for income or discarded for their free-action effect and count toward hand limit.
- Organelle setup:
  - Shuffle the 5 organelle tokens.
  - Deal them face up on the marked spaces on the Amoeba board.
- Amoeba board:
  - Marking spaces on the Amoeba board works as usual.
  - In addition to the printed reward of the marked space, the player gains all bonuses on organelles in the section matching the marked space color.
- Amoeba card organelle icon:
  - Many Amoeba cards contain a single organelle icon.
  - That icon lets the player choose a single organelle in the matching section and gain its reward.
- Mutating:
  - Each time a player gains organelle bonuses, whether from marking an Amoeba board space or from a card effect, move all those organelles 1 space in the direction depicted on the board.
  - Outer organelles move clockwise.
  - The inner organelle moves counter-clockwise.
  - If all bonuses from a section are gained, move all organelles that were present simultaneously.
  - If the target space is occupied, skip it and move the organelle to the next empty space.
- Solo/rival notes:
  - When selecting spaces to mark, rival ignores Amoeba spaces with 1 or 0 organelle bonuses.

### Code Raw
- Alien type key: `EAlienType.AMOEBA`
- Type map key: `amoeba`
- Card source: `packages/common/src/data/spaceAgencyAliens.ts`
- Card IDs and names:
  - `SA.ET.11` Biosignature Screening
  - `SA.ET.12` Physical Characterization
  - `SA.ET.13` Genome Characterization
  - `SA.ET.14` Breakthrough Theory
  - `SA.ET.15` Low-gravity Research
  - `SA.ET.16` Automated Analysis
  - `SA.ET.17` Safety Protocols
  - `SA.ET.18` Scientific Papers
  - `SA.ET.19` Extreme Conditions Testing
  - `SA.ET.20` Place of Origin
- Current server card registration (`registerSpaceAgencyAliens`) uses generic card handlers and comments that organelle accounting is deferred until Amoeba is enabled in setup.
- No dedicated `AmoebaAlienPlugin` exists in `packages/server/src/engine/alien/plugins`.

## Detailed Layer

### 1. Setup Contract
- Amoeba discovery initializes the standard alien card deck flow.
- The 5 organelle tokens are randomized and placed face up on the defined Amoeba board positions.
- Organelle token identity and position are persistent board state.

### 2. Board Marking Contract
- Marking an Amoeba board space has a compound reward:
  - printed space reward
  - every organelle bonus in that space's matching color section
- Organelle bonuses are section-based, not tied to the exact marked space.

### 3. Card Organelle Contract
- Single-organelle icons on cards let the player choose one organelle from the matching color section.
- The chosen organelle grants its reward and then participates in mutation movement.
- Card effects need a choice point if multiple organelles are present in the matching section.

### 4. Mutation Contract
- Every organelle reward event is followed by movement for the organelles that just paid out.
- Movement direction depends on organelle lane:
  - outer organelles move clockwise
  - inner organelle moves counter-clockwise
- Simultaneous section payout moves all affected organelles from their original positions as a group.
- Occupied target spaces are skipped until the next empty space.

### 5. FAQ-Constrained Clarifications
- Overflow spaces below Amoeba count for specified card conditions and gold boxes, but discovery spaces may be explicitly excluded by card text/FAQ.
- Empty-space scoring for `SA.ET.14` counts only actual Amoeba board spaces.
- `SA.ET.19` can remove markers from board, discovery, or overflow spaces belonging to Amoeba, then uses the removed space color to select the organelle section.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - organelle token positions and lane/direction metadata
  - Amoeba board occupancy by trace color
  - per-player collected card state for Amoeba deck/row
  - pending organelle choice when a card grants a single-organelle icon
- Recommended events:
  - `onAmoebaDiscovered`
  - `onAmoebaSpaceMarked`
  - `onOrganelleRewardChosen`
  - `onOrganelleBonusesResolved`
  - `onOrganelleMutationMoved`
