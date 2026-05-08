# Solo Frontend Reference Data

> Source:
> - `frontend-reference/czech-gaming-online.herokuapp.com/api/table-open/1J!N6iXP5.html`
> - `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/setup.js`
> - `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/automa.js`
> - `docs/arch/aliens/*.md`
> - `docs/arch/rule-faq.md`
>
> Use this as implementation reference data, not as a replacement for the
> rulebook. When frontend-reference behavior conflicts with FAQ/spec notes, use
> the FAQ/spec notes and record the mismatch in tests.

## 1. Confirmed Decisions

- Passing removes the top card from the current end-of-round stack.
- At round transition, revealed/used rival action cards are shuffled back into
  the rival action deck, except cards permanently removed by species replacement.
  Treat this as a shuffle reset, not as fixed-order restoration for tests.
- Full rival action card data can be extracted from `deckData.automaActions`.
- Special alien card behavior should use the alien spec notes below in addition
  to frontend-reference action data.

## 2. Difficulty and Board Config

Frontend option values map to displayed difficulty like this:

| `soloDiffic` option | Displayed difficulty |
| --- | --- |
| `0` | 1-star |
| `1` | 2-star |
| `2` | 3-star |
| `3` | 4-star |
| `4` | 5-star |

Initial rival progress from `setup.js`:

| Difficulty | Board asset | Initial progress | Initial marker slot | Extra advanced cards at setup | Starting preferred tech |
| --- | --- | ---: | ---: | ---: | --- |
| 1-star | `automaBoard1.jpg` | 0 | 0 | 0 | computer / blue, single-dot |
| 2-star | `automaBoard1.jpg` | 0 | 0 | 0 | computer / blue, single-dot |
| 3-star | `automaBoard2.jpg` | 12 | 0 | 1 | telescope / pink, single-dot |
| 4-star | `automaBoard3.jpg` | 15 | 3 | 1 | computer / blue, four-node |
| 5-star | `automaBoard4.jpg` | 19 | 7 | 1 | computer / blue, four-node |

`Initial marker slot` is `initialProgress % 12`. `Extra advanced cards at
setup` is `Math.floor(initialProgress / 12)`.

Objective stack composition from `setup.js`:

| Difficulty | Level I | Level II | Level III |
| --- | ---: | ---: | ---: |
| 1-star | 0 | 0 | 0 |
| 2-star | 2 | 3 | 5 |
| 3-star | 2 | 4 | 6 |
| 4-star | 2 | 6 | 7 |
| 5-star | 2 | 7 | 8 |

Rival computer slot rewards from `dataSheet.automaComp`:

| Slot index | Reward |
| ---: | --- |
| 0 | none |
| 1 | 1 publicity |
| 2 | none |
| 3 | 4 progress |
| 4 | none |
| 5 | none |

Board-derived preferred-tech order:

Use progress marker slot `0`, then follow the printed arrows clockwise. Within
each color group, the icon order is: single-dot, infinity, three-node,
four-node.

| Board asset | Difficulty | Slots 0-3 | Slots 4-7 | Slots 8-11 |
| --- | --- | --- | --- | --- |
| `automaBoard1.jpg` | 1-star / 2-star | computer / blue | telescope / pink | probe / orange |
| `automaBoard2.jpg` | 3-star | telescope / pink | probe / orange | computer / blue |
| `automaBoard3.jpg` | 4-star | computer / blue | telescope / pink | probe / orange |
| `automaBoard4.jpg` | 5-star | probe / orange | computer / blue | telescope / pink |

Captured stack-index order currently used by `automa.js`:

```ts
const techOrder = [4, 7, 5, 6, 1, 0, 2, 3, 11, 8, 9, 10];
```

`techOrder` values are `techOffer` stack indexes. The source code has a local
TODO beside this order, so treat it as captured frontend behavior, not as the
printed board authority. It also does not encode the board-specific preferred
tech rotations shown above. In the captured reference setup, those stacks map as
follows:

| Progress slot | `techOffer` index | Type | Tech number |
| ---: | ---: | --- | ---: |
| 0 | 4 | telescope / `look` | 0 |
| 1 | 7 | telescope / `look` | 2 |
| 2 | 5 | telescope / `look` | 3 |
| 3 | 6 | telescope / `look` | 1 |
| 4 | 1 | probe / `fly` | 0 |
| 5 | 0 | probe / `fly` | 1 |
| 6 | 2 | probe / `fly` | 2 |
| 7 | 3 | probe / `fly` | 3 |
| 8 | 11 | computer / `comp` | 0 |
| 9 | 8 | computer / `comp` | 2 |
| 10 | 9 | computer / `comp` | 3 |
| 11 | 10 | computer / `comp` | 1 |

Visual/config verification:

- `components.js` maps `soloDiffic` `0` and `1` to
  `automaboards/automaBoard1.jpg`, `2` to `automaBoard2.jpg`, `3` to
  `automaBoard3.jpg`, and `4` to `automaBoard4.jpg`.
- The local frontend-reference snapshot contains `automaBoard1.jpg`.
  `automaBoard2.jpg` through `automaBoard4.jpg` were verified from the same
  `storage.googleapis.com/cgo-projects/seti/assets/automaboards/` path referenced
  by `components.js`.
- The four board assets match the board-derived preferred-tech rotations above.
- The six-slot computer strip on each board matches `dataSheet.automaComp`: slot
  1 gives publicity and slot 3 gives 4 progress.

## 3. Normalization Rules

The data below intentionally shows `frontend-reference` source aliases so the
extraction can be audited. Do not use those aliases as final domain names.

Canonical implementation rules:

- Source `automa` means the solo `rival`.
- Source `deckData.automaActions.cards` should become typed
  `RivalActionCardDefinition` data, not generic card-row or player hand card
  data.
- Source `deckData.soloGoals.cards` should become typed solo objective data.
- Rival action cards and objectives must stay separate from the normal
  `mainDeck`, `cardRow`, and `IBaseCard` player action-card pool. They are solo
  control data, even if card art rendering later needs display metadata.
- Source numeric card IDs are `sourceRefId` values until verified against card
  art. Domain card IDs should use printed IDs such as `S.1` through `S.19` once
  verified.
- Source `tier` values normalize to deck tiers:
  - `s` -> basic rival action card
  - `1` -> advanced rival action card
  - `life` -> species special action card
  - `corpExtra` -> corporation extra card, outside the base solo scope unless
    corporations are enabled
- Source `arrow` normalizes to `decisionDirection`.
- Source `pop` means publicity, so use `EResource.PUBLICITY`.
- Source `fly`, `look`, and `comp` tech names normalize to `ETech.PROBE`,
  `ETech.SCAN`, and `ETech.COMPUTER`.
- Source `rover` and `satellite` normalize to lander-priority and
  orbiter-priority placement, respectively.
- Source `bug` / `discardBug` means Mascamites sample conversion; never name this
  mechanic `bug` in project code.
- Source `life*` keys normalize to `EAlienType`:

| Source key | Canonical alien |
| --- | --- |
| `life1` | `EAlienType.MASCAMITES` |
| `life4` | `EAlienType.EXERTIANS` |
| `life5` | `EAlienType.OUMUAMUA` |
| `life6` | `EAlienType.CENTAURIANS` |
| `life7` | `EAlienType.ANOMALIES` |
| `life11` | `EAlienType.AMOEBA` |

Implementation location rules:

- Shared rival definitions and config belong in `packages/common` when the
  client, server tests, or protocol projections need to reference them.
- Rival resolution belongs in `packages/server`; the client must not replay
  `frontend-reference` action logic.
- Deck state should follow the existing server `Deck<T>` terminology:
  `drawPile`, `discardPile`, reserve, and removed cards.

## 4. Action Data Syntax

Action data appears as ordered `action[]` and `args[]` arrays. Candidate order is
the array order.

Action aliases:

| Action | Meaning |
| --- | --- |
| `comp(effects)` | Analyze if rival computer is full; resolve listed effects after clearing computer. |
| `launch(effects)` | Launch rival probe, then resolve listed effects. |
| `tech(effects)` | Research tech. Paid unless `free` is present. Other listed effects resolve after tech gain. |
| `probe(moves, planets, priority, flags)` | Move from Earth to first reachable listed planet, then place orbiter/lander using priority. |
| `look(mode)` | Telescope. Default = 2 card-row signals + 1 Earth signal. `earth` = 1 card-row signal + 2 Earth signals. `oumuamua` = 1 card-row signal + 1 Earth signal + 1 Oumuamua-tile signal. |
| `life(index)` | Species discovery replacement check for face-down species slot index. |
| `trace` | Anomalies special trace action. |
| `traceAny` | Mark any trace using normal rival trace priority. |
| `dangerCard` | Exertians special card play action. FAQ threshold still applies. |
| `startCountdown` | Centaurians message milestone placement. |
| `unlockSecurity` | Exploring Space Ship WIP special action from frontend-reference. |
| `activate3amoeba` | Amoeba special action from frontend-reference. |

Probe priority values:

- `rover` means lander priority before orbiter.
- `satellite` means orbiter priority before lander.

Probe flags:

- `discardBug`: after Mascamites Saturn/Jupiter landing, convert one random
  sample from that planet into a Mascamites board blue space.
- `alphabetOnly`: frontend-reference WIP species behavior; only use if that
  species is in scope.

## 5. Rival Action Cards from Frontend Reference

Important: `Ref ID` is the frontend internal `cardId`. Do not assume it is the
printed S-number without checking card art.

### 5.1 Basic Cards

| Ref ID | Arrow | Candidate order |
| --- | --- | --- |
| `1` | left | `comp()` -> `launch(publicity)` -> `tech(paid)` -> `probe(3, Saturn > Mars > Jupiter > Venus, orbiter)` |
| `2` | right | `comp()` -> `tech(paid)` -> `look(default)` |
| `3` | left | `life(1)` -> `tech(paid)` -> `look(default)` |
| `4` | right | `life(2)` -> `probe(3, Jupiter > Mars > Saturn > Venus, orbiter)` -> `tech(free, progress)` |

### 5.2 Advanced Cards

| Ref ID | Arrow | Candidate order |
| --- | --- | --- |
| `5` | left | `comp(3 VP)` -> `tech(paid, progress)` -> `look(earth)` |
| `6` | left | `tech(paid, progress)` -> `launch(publicity, progress)` -> `look(earth)` |
| `7` | right | `tech(paid, progress)` -> `probe(4, Uranus > Saturn > Mercury > Venus, lander)` -> `look(earth)` |
| `8` | left | `comp(3 VP)` -> `probe(4, Neptune > Jupiter > Mercury > Venus, lander)` -> `look(earth)` |
| `9` | right | `comp(3 VP)` -> `launch(publicity, progress)` -> `probe(4, Uranus > Neptune > Mercury > Venus, orbiter)` |
| `10` | right | `comp(3 VP)` -> `launch(publicity, progress)` -> `look(earth)` |
| `11` | right | `tech(paid, progress)` -> `comp(3 VP)` -> `look(earth)` |
| `12` | left | `tech(paid, progress)` -> `launch(publicity, progress)` -> `probe(4, Mercury > Saturn > Jupiter > Venus, lander)` |
| `13` | left | `probe(4, Neptune > Uranus > Mars > Venus, lander)` -> `comp(3 VP)` -> `look(earth)` |
| `14` | right | `launch(publicity, progress)` -> `tech(paid, progress)` -> `look(earth)` |

### 5.3 Species / Extra Cards

Frontend replacement map from `automa.js`:

| Species key in frontend | Species | Ref ID |
| --- | --- | --- |
| `life1` | Mascamites | `15` |
| `life5` | Oumuamua | `16` |
| `life4` | Exertians | `17` |
| `life6` | Centaurians | `18` |
| `life7` | Anomalies | `19` |
| `life9` | Alphabet WIP | `20` |
| `life10` | Exploring Space Ship WIP | `21` |
| `life11` | Amoeba | `22` |

Species/extra card candidate data:

| Ref ID | Species | Arrow | Candidate order |
| --- | --- | --- | --- |
| `15` | Mascamites | right | `launch(publicity)` -> `probe(5, Saturn > Jupiter, lander, discardBug)` |
| `16` | Oumuamua | left | `probe(4, Oumuamua, lander)` -> `look(oumuamua)` |
| `17` | Exertians | right | `dangerCard(5)` -> `look(earth)` |
| `18` | Centaurians | right | `startCountdown(15)` -> `look(default)` |
| `19` | Anomalies | left | `trace(Anomalies)` -> `tech(free, progress)` |
| `20` | Alphabet WIP | left | `probe(4, Mercury > Neptune > Uranus > Saturn > Jupiter > Mars > Venus, lander, alphabetOnly)` -> `look(earth)` |
| `21` | Exploring Space Ship WIP | right | `unlockSecurity()` -> `traceAny()` |
| `22` | Amoeba | left | `activate3amoeba()` -> `tech(free, progress)` |
| `corpExtra` | corporations extra | left | `traceAny(starProgress)` |

## 6. Species Card Rules from Alien Notes

Use these constraints when implementing the species cards above.

### 6.1 Mascamites

Sources: `docs/arch/aliens/mascamites.md`, `docs/arch/rule-faq.md`.

- The second action is always resolvable: either Saturn is within 4 moves from
  Earth or Jupiter is within 5 moves from Earth.
- Depending on whether the rival landed on Saturn or Jupiter, including moons,
  take 1 random sample tile from that planet.
- The rival does not gain the sample reward.
- Flip the sample face up and place it in the next dedicated Mascamites board
  slot.
- From then on, that sample is markable as a normal blue space.
- If there are no samples left on the landed planet, skip the sample step.

### 6.2 Anomalies

Sources: `docs/arch/aliens/anomalies.md`, `docs/arch/rule-faq.md`.

- Determine the next anomaly color: the anomaly closest counter-clockwise from
  Earth.
- Check who has the highest marked trace of that color on the Anomalies board.
- If the rival is not winning that color, resolve the first action.
- First action: mark the lowest available trace of that anomaly color on the
  Anomalies board.
- The rival gains the marked-space reward plus 3 VP.
- If the rival is already winning that next anomaly color, resolve the bottom
  action instead.

### 6.3 Oumuamua

Sources: `docs/arch/aliens/oumuamua.md`, `docs/arch/rule-faq.md`.

- First action: the rival tries to move to the Oumuamua tile and place a lander
  or orbiter there.
- If the rival has no probe in space, or Oumuamua cannot be reached with up to
  4 moves, resolve the second action.
- When resolving the signal icon with the small Oumuamua depiction, the rival
  always marks the signal on the Oumuamua tile.
- For all other signal icons, the rival never treats the Oumuamua tile as an
  option. If the matching sector contains the Oumuamua tile, mark the sector's
  star system instead.
- The rival can collect exofossils.
- If the rival cannot pay an exofossil-cost space, treat that space as occupied.

### 6.4 Centaurians

Sources: `docs/arch/aliens/centaurians.md`, `docs/arch/rule-faq.md`.

- When Centaurians are discovered, each player places a message tile milestone.
- The rival takes the two remaining message tiles of unused colors and treats
  them as rival tiles.
- The first action is possible only if the rival currently has no message tile
  on the scoring track.
- The rival must reach its current message tile before placing another.
- If the rival has placed all three rival-controlled message tiles, skip the
  first action.
- Rival reward choice uses the decision arrow to choose leftmost or rightmost
  available reward.
- Rival pays data-cost spaces only with a full computer and enough leftover data.

### 6.5 Exertians

Sources: `docs/arch/aliens/exertians.md`, `docs/arch/rule-faq.md`.

- The species action card is the only way the rival can play Exertian cards.
- The rival never takes Exertian cards into hand, including from discovery.
- If instructed to play an Exertian card, take one random card from the Exertian
  deck and play it face down.
- The first action is possible only if:
  - number of rival played Exertian cards
  - plus number of rival traces on the Exertians board
  - is lower than 5.
- For this count, include only Exertian board traces that give danger.
- Do not count discovery spaces or overflow spaces below the Exertians board.
- On discovery, rival discovery markers produce progress, not Exertian card
  draws/plays.
- At endgame, rival Exertian cards are treated as successfully completed.
