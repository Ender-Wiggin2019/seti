# GLYPHIDS

## Raw Layer

### Source Priority
- Conflict rule: `FAQ > PDF > code`

### FAQ Raw
- Generic alien traces/card usage rules from `docs/arch/rule-faq.md` apply:
  - Discovery spaces and overflow spaces count as traces for that species when an effect references traces for a species.
  - When marking alien traces, players may choose any unoccupied matching-color space, including alien boards, undiscovered discovery spaces, and overflow spaces.
  - Alien cards can be used for marking signals only when a tech allows discarding a hand card for signal.
- Space Agencies FAQ Raw (from `docs/arch/spaceAgency/faq.md`):
  - `#ET.1`: There are 7 glyph token types. The gold box scores 3 points for each token of the type the player has the most of. Those tokens still count toward end-game different-token sets.
  - `#ET.3`: First-printing erratum - the mission conditions should use hexagonal orbit/land action icons, meaning the trigger is performing orbit or land.
  - `#ET.9`: There are 7 glyph token types. The gold box scores 1 point for each glyph in the player's largest set of different tokens, up to 7; that set still scores normally at game end.

### PDF Raw (from `docs/arch/spaceAgency/SE2 aliens aid EN 14.pdf`, pages 3-4)
- Components:
  - 1 Glyphids alien board.
  - 1 translation board.
  - 2 strip tiles.
  - 10 Glyphids cards.
  - 35 glyph tokens.
- Discovery and cards:
  - On discovery, shuffle the Glyphids deck and deal cards to players who marked the three discovery spaces.
  - Each player gets 1 Glyphids card per discovery marker.
  - Keep the deck near the Glyphids board.
  - Turn the top card face up and place it beside the deck.
  - Draw icon lets the player draw from the top of the deck or take the face-up card and replace it with the top card.
  - Glyphids cards can be tucked for income or discarded for their free-action effect and count toward hand limit.
- Translation board setup:
  - Attach the translation board to the Glyphids board.
  - Insert the two strips a random side up into the cutouts in the translation board.
  - Shuffle all glyph tokens and randomly place one face up:
    - on each of the 6 designated spaces on the Glyphids board
    - beside each of the 7 planets on the planetary board
    - on each of the 8 sectors
    - on each tech stack that still has its 2-point token on top
  - Place remaining glyph tokens in a face-down stack near the species board.
- Gaining glyph tokens:
  - Gain a glyph token by orbiting or landing at a planet or moon with a token.
  - Gain a glyph token by winning a sector with a token.
  - Gain a glyph token by developing a tech with a token.
  - Gain a glyph token by marking a Glyphids board space that contains a token.
  - When a token is gained, take it; no one else can gain any more tokens from that place.
  - Exception: the top three Glyphids board spaces replenish immediately.
  - If the token supply runs out, an empty top space has no effect.
- Deciphering a glyph:
  - As a free action, place one of your glyph tokens in an empty translation-board slot and gain the associated resource.
  - Top-row slots can be filled only if both slots beneath them are filled.
  - Once a glyph type has been deciphered, no more glyphs of that type can be added to the translation board.
  - Already deciphered tokens can still be collected, but cannot be placed; save them for end-game scoring.
- Glyphs on cards:
  - Glyph icons on Glyphids cards do not give glyph tokens.
  - If the particular glyph has been deciphered, gain its associated resource.
  - If that glyph is not yet deciphered, the card icon has no effect.
- End-game scoring:
  - Unplaced glyph tokens score by sets of different tokens.
  - Each set scores 1 / 3 / 5 / 8 / 11 / 15 / 20 points for 1-7 unique token types.
  - All sets are scored.
- Solo/rival notes:
  - Rival gains glyph tokens the same way as a player.
  - If rival gains an undeciphered token, they immediately place it on the translation board and gain the reward.
  - Rival prefers upper slots when possible and uses the decision arrow to break ties.
  - If the reward is the printed card/reward icon shown in the solo box, rival gains 1 progress instead.
  - If any top Glyphids board space is empty with no token to take, rival ignores it.
  - At game end, rival scores 3 points per glyph token, regardless of type.

### Code Raw
- Alien type key: `EAlienType.GLYPHIDS`
- Type map key: `glyphids`
- Card source: `packages/common/src/data/spaceAgencyAliens.ts`
- Card IDs:
  - `SA.ET.1`
  - `SA.ET.2`
  - `SA.ET.3`
  - `SA.ET.4`
  - `SA.ET.5`
  - `SA.ET.6`
  - `SA.ET.7`
  - `SA.ET.8`
  - `SA.ET.9`
  - `SA.ET.10`
- Current server card registration (`registerSpaceAgencyAliens`) uses generic card handlers and comments that glyph resource accounting is deferred until Glyphids are enabled in setup.
- No dedicated `GlyphidsAlienPlugin` exists in `packages/server/src/engine/alien/plugins`.

## Detailed Layer

### 1. Setup Contract
- Glyphids discovery initializes the standard alien card deck flow.
- Translation board setup must randomize both strip orientation and glyph token distribution.
- Token placement spans four board domains:
  - Glyphids board spaces
  - planets and moons through planet-adjacent token placement
  - sectors
  - top 2-point tech-stack tokens

### 2. Glyph Token Acquisition Contract
- Glyph tokens are one-time pickups tied to their placed location.
- A token is removed when gained and cannot be gained again from that location.
- The top three Glyphids board spaces are replenishing token sources until the supply is empty.

### 3. Translation Board Contract
- Deciphering is a free action and consumes a collected glyph token into the translation board.
- Translation slots are constrained:
  - top-row dependency requires both lower slots
  - each glyph type may appear on the translation board at most once
- Deciphering immediately grants the resource printed for the chosen slot.

### 4. Card Glyph Contract
- Glyph icons on cards are conditional resource effects, not token-gain effects.
- Resolution branch:
  - deciphered glyph: gain translated resource
  - undeciphered glyph: no effect
- Card effects need access to current translation-board state.

### 5. End-Game Scoring Contract
- Only unplaced glyph tokens score the different-token sets.
- Scoring partitions tokens into as many sets as possible; each set scores by its unique-token count.
- FAQ scoring on `SA.ET.1` and `SA.ET.9` does not remove tokens from normal end-game set scoring.

### 6. Implementation Notes for Rule Engine
- Needed state fields:
  - token supply stack
  - placed tokens by planet/moon, sector, tech stack, and Glyphids board space
  - per-player collected unplaced glyph tokens
  - translation-board slot occupancy and glyph type uniqueness
- Recommended events:
  - `onGlyphidsDiscovered`
  - `onGlyphTokenClaimed`
  - `onGlyphDeciphered`
  - `onGlyphCardIconResolved`
  - `onGlyphidsEndGameScoring`
