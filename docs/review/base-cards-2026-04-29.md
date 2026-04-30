# Code Review: Base Cards Runtime Audit

**Date:** 2026-04-29
**Scope:** All base cards in `packages/common/src/data/baseCards.ts` and their server runtime implementations.
**Reviewer:** AI Code Review Skill + Card Creator Skill

## Summary

| Severity | Count |
|----------|-------|
| Critical | 9 |
| Warning | 7 |
| Suggestion | 0 |

**Overall assessment:** Base card registration is broadly complete: all 140 base card data entries are registered, and no runtime `behavior.custom` entries remain. However, the audit found several rule-breaking card behaviors, mostly around card-contained actions, mission trigger/reward gaps, and deferred-action timing.

## Methodology

- Used source priority from Card Creator: `baseCards.ts`, English locale text, `rule-simple.md`, `rule-faq.md`, then server patterns.
- Split the batch review across movement/landing, scan/signal/observation, tech/resource/income/trace, and mission/endgame scopes.
- Treated the existing dirty working tree as pre-existing user/generated work. This report is review-only.

## Verification

| Check | Result |
|-------|--------|
| Base card inventory | PASS: 140 data entries, all registered |
| Runtime custom behavior inventory | PASS: no remaining `behavior.custom` at runtime |
| `pnpm --filter @seti/server test -- __tests__/engine/cards/register/registerBaseCards.test.ts __tests__/engine/cards/CardRegistry.test.ts __tests__/engine/cards/base` | PASS: 100 files, 396 tests |
| `pnpm --filter @seti/server typecheck` | PASS |
| `pnpm --filter @seti/server lint` | PASS |

## Critical Issues

### C-01: Card-contained land actions use paid/skippable landing

**Files:** `packages/server/src/engine/cards/base/PerseveranceRoverCard.ts:53`, `packages/server/src/engine/effects/probe/BuildLandPlanetSelection.ts:44`
**Dimension:** Logic Correctness

`rule-simple.md:189-190` says actions contained in a card effect are performed without paying those action costs. `rule-faq.md:6-8` also says performing a main action when a card tells you to cannot be skipped when legal. Card 13 `Perseverance Rover` currently collects targets through `player.canLand`, executes `player.land`, and adds `skip-land`, so the card requires/spends energy and lets the player decline.

Current anchors:

```ts
if (player.canLand(planet, { isMoon: false })) { ... }
const result = context.player.land(target.planet, { isMoon: target.isMoon });
{ id: 'skip-land', label: 'Skip landing', ... }
```

Suggested fix: introduce a cost-free card landing path that still performs the board conversion, rewards, trace events, and mission events. Use it for card-contained LAND effects and remove skip options when at least one legal target exists. Add tests with zero energy, unchanged energy after resolution, and no skip option when a land target exists.

### C-02: Several card effects execute after same-turn card checks

**Files:** `packages/server/src/engine/Game.ts:569`, `packages/server/src/engine/deferred/DeferredActionsQueue.ts:7`, `packages/server/src/engine/cards/base/SquareKilometreArrayCard.ts:43`
**Dimension:** Logic Correctness

The turn pipeline enqueues card-trigger checks, sector completion, and quick-mission checks before or at `EPriority.DEFAULT`. Card bespoke effects that are pushed during `PLAY_CARD` with the same `DEFAULT` priority are appended after the existing quick-mission check. That means their own signal placements can miss same-turn sector completion checks and quick-mission completion prompts.

Affected `EPriority.DEFAULT` base card effects include:

- `AnySignalQuickMissionCard.ts:89`
- `ObservationQuickMissionCard.ts:80`
- `ObservationEndGameCard.ts:74`
- `HerschelSpaceObservatoryCard.ts:55`
- `DragonflyCard.ts:32`
- `SquareKilometreArrayCard.ts:43`

Suggested fix: card effects that are printed as the card's main effect should normally enqueue at `EPriority.CORE_EFFECT` or another priority before `CARD_TRIGGER`, `SECTOR_COMPLETION`, and the play-card quick-mission check. Add a regression test where a played card's signal completes a sector or satisfies its quick mission in the same play-card resolution.

### C-03: Card 50 Square Kilometre Array never awards its printed VP

**Files:** `packages/server/src/engine/cards/base/SquareKilometreArrayCard.ts:25`, `packages/common/src/data/baseCards.ts:1812`, `packages/common/locales/en/seti.json:241`
**Dimension:** Logic Correctness

The data and locale say Card 50 marks three card-row signals and scores 2 VP for each unique sector where a signal is marked. The runtime only calls `mark(CARD_ROW, 3, ...)` and discards the returned placement detail, so the scoring clause is completely missing.

Suggested fix: resolve the three card-row signal placements through a path that reports sector ids, count unique sectors actually marked, then score `2 * uniqueSectorCount`. Add tests for 3 unique sectors, duplicate sectors, and no-data/excess signal cases.

### C-04: Card 83 Wow! Signal marks any sector instead of Earth's sector

**Files:** `packages/server/src/engine/cards/register/registerBaseCards.ts:343`, `packages/common/src/data/baseCards.ts:2130`, `packages/common/locales/en/seti.json:259`
**Dimension:** Logic Correctness

Card 83 is registered as a generic card even though its signal effect has `desc.card-83`, which constrains both signals to the sector with Earth. Generic `SIGNAL_ANY(2)` lets the player choose any sector/color path and ignores the Earth-sector text.

Suggested fix: add a dedicated `WowSignalCard` that keeps the publicity gain and marks two signals in the current Earth sector. Add a test that rejects/does not offer non-Earth sectors.

### C-05: Card 88 Chandra Space Observatory cannot complete its printed quick mission

**Files:** `packages/server/src/engine/cards/register/registerBaseCards.ts:230`, `packages/server/src/engine/missions/MissionCondition.ts:142`, `packages/common/src/data/baseCards.ts:358`
**Dimension:** Logic Correctness

Card 88 has a custom quick mission requirement: "Have a signal in 4 different sectors". The generic custom quick-mission condition handler only recognizes several alien desc ids and returns false for `desc.card-88-req`, so the mission cannot complete. Its signal placement mode also re-prompts after each signal, so two printed signals "in a sector with one of your probes" can be split across different probe sectors.

Suggested fix: give Card 88 a dedicated class or reusable condition equivalent to Card 134's sector-count logic. For the signal effect, choose one valid probe sector first, then mark both signals there. Add tests for exactly four distinct sectors and for keeping both card signals in the same selected sector.

### C-06: Generic full missions miss trace and empty/custom trigger requirements

**Files:** `packages/server/src/engine/missions/IMission.ts:36`, `packages/server/src/engine/missions/MissionCondition.ts:57`, `packages/common/src/data/baseCards.ts:1193`
**Dimension:** Logic Correctness

Cards 77 and 107 define full mission branches with trace requirements (`TRACE_RED`, `TRACE_YELLOW`, `TRACE_BLUE`), but `EMissionEventType` has no trace-marked event and `matchesSingleEventReq` has no trace cases. Those branches can never trigger. Special edition Card `SE EN 02` is also generic with empty req arrays and descriptive trigger text, while `matchesFullMissionTrigger` returns false for empty req arrays.

Suggested fix: record trace-marked mission events and match trace reqs, or implement the trace cards as dedicated mission classes. Implement `SE EN 02` with bespoke trigger matching for Mars orbit/land and cards mentioning Mars in flavor text. Add tests that each affected branch can trigger after the printed event.

### C-07: Mission rewards silently drop signal and launch rewards

**Files:** `packages/server/src/engine/missions/MissionReward.ts:30`, `packages/common/src/data/baseCards.ts:1902`, `packages/common/src/data/baseCards.ts:2161`
**Dimension:** Logic Correctness

`MissionReward.applyBaseReward` handles resources, movement, cards, traces, and exofossils, then silently ignores unsupported reward types. Card 101 rewards `SIGNAL_YELLOW`, `SIGNAL_RED`, and `SIGNAL_BLUE`; Card 117 rewards `LAUNCH`. Those printed rewards are currently dropped when the mission branch resolves.

Suggested fix: mission rewards need to return or enqueue `PlayerInput` for interactive effects such as signal placement and launch, rather than being purely void. Add tests for Card 101 branch rewards marking the matching signal and Card 117 launching a probe.

### C-08: Cards 91/92/93 copy the played card into income while also discarding it

**Files:** `packages/server/src/engine/cards/base/FusionReactorCard.ts:50`, `packages/server/src/engine/cards/base/NasaImageOfTheDayCard.ts:53`, `packages/server/src/engine/cards/base/GovernmentFundingCard.ts:50`, `packages/server/src/engine/actions/PlayCard.ts:96`
**Dimension:** Logic Correctness

The locale says these cards increase income "with this card". `PlayCardAction` removes the card from hand, runs the card effect, then discards normal immediate cards. The bespoke effects call `addTuckedIncomeFromCard(this.id)`, which adds a copied card id to income rather than moving the played card out of the normal discard lifecycle. This can leave the same card id represented in both discard and tucked income, and it bypasses the normal immediate income reward path in `TuckCardForIncomeEffect`.

Suggested fix: give these cards a dedicated play destination or post-play hook that moves the actual played card to tucked income instead of discarding it. Reuse the normal income gain semantics for the card's income type. Add tests asserting discard does not contain the card and the immediate income reward is applied.

### C-09: Card 119 PIXL blocks all effects when computer tech is unavailable

**Files:** `packages/server/src/engine/cards/base/PixlCard.ts:15`, `packages/server/src/engine/cards/BehaviorExecutor.ts:100`, `docs/arch/rule-faq.md:10`
**Dimension:** Logic Correctness

PIXL is modeled with `rotateSolarSystem: true` and `researchTech: ETech.COMPUTER`. `BehaviorExecutor.canExecute` rejects the whole card if the tech part cannot execute. FAQ says if one effect cannot be resolved, it is skipped and other effects still resolve, specifically including rotation even if the tech cannot be taken.

Suggested fix: implement PIXL as a bespoke left-to-right sequence: always rotate, attempt computer tech if possible, then score 1 VP per publicity. Add tests for "already has all computer techs" or "no computer tech available" where rotation and VP still happen.

## Warnings

### W-01: Card 126 Euclid skips mandatory rotation if neither tech branch is available

**File:** `packages/server/src/engine/cards/base/EuclidTelescopeConstructionCard.ts:30`
**Dimension:** Logic Correctness

Card 126 is printed as `ROTATE + TECH_PROBE OR ROTATE + TECH_SCAN`. If neither branch is available, the implementation returns `undefined` before rotating. Rules say tech-from-card effects rotate first and skip only the unavailable tech portion.

Suggested fix: always perform the rotation for the chosen/available effect context, and define deterministic behavior if neither tech can be taken. Add a test where all probe/scan techs are exhausted or already owned.

### W-02: Observation cards broaden the printed star target when the star cannot resolve

**Files:** `packages/server/src/engine/cards/base/ObservationQuickMissionCard.ts:54`, `packages/server/src/engine/cards/base/ObservationEndGameCard.ts:48`
**Dimension:** Logic Correctness

Observation cards are printed as marking signals at a named nearby star. If the star lookup fails, the runtime falls back to `markByColorChain`, allowing any sector of that color. A missing setup lookup should not broaden the target beyond the printed star.

Suggested fix: treat unresolved star setup as no legal target or a recoverable engine error. Add a test with a setup missing the named star to prove it does not mark an arbitrary sector.

### W-03: Hand-discard signal effects can discard Exertian cards

**Files:** `packages/server/src/engine/cards/base/baseSignalBatchCardUtils.ts:140`, `packages/server/src/engine/cards/base/YevpatoriaTelescopeCard.ts:78`, `docs/arch/rule-faq.md:185`
**Dimension:** Logic Correctness

FAQ says Exertian cards cannot be discarded by any means. The optional hand-discard signal inputs enumerate every hand card and remove the selected card without filtering Exertians.

Suggested fix: centralize an `isDiscardableFromHand` rule and exclude Exertian cards from all hand-discard card inputs. Add a test with an Exertian card in hand for Card 67 and Card 114.

### W-04: Cards 27/28/29 do not allow free-action movement before choosing the probe-sector signal

**Files:** `packages/server/src/engine/cards/base/probeSectorSignalCardUtils.ts:40`, `packages/server/src/engine/Game.ts:772`
**Dimension:** Logic Correctness

Cards 27/28/29 grant movement, then mark signal(s) in a sector with one of your probes. FAQ allows free actions during a main action, but the runtime immediately creates or auto-resolves the sector signal input after movement gain. Pending-input interruption is currently special-cased only for Scan.

Suggested fix: add a play-card resolution checkpoint after movement gain and before target generation, or generalize legal free-action interruption during main-action resolution. Add a test where the player uses the gained movement to move a probe into the desired sector before resolving the signal.

### W-05: No-data signal cards do not emit sector-completed turn events

**Files:** `packages/server/src/engine/cards/base/baseSignalBatchCardUtils.ts:285`, `packages/server/src/engine/effects/scan/MarkSectorSignalEffect.ts:69`
**Dimension:** Logic Correctness

Standard signal placement emits a sector-completed turn event when the sector completes. `markOnSectorWithoutData` records the signal mission event and VP, but returns without emitting the sector-completed turn event. Cards 118/136 use no-data signal placement, so effects that look at sector completion this turn may miss these completions.

Suggested fix: mirror `MarkSectorSignalEffect.markOnSector` and emit `emitSectorCompletedTurnEvent` when a no-data signal completes a sector. Add a test that a no-data signal completion satisfies sector-completion turn effects.

### W-06: Card 11 Grant has no observable reveal step

**File:** `packages/server/src/engine/cards/base/GrantCard.ts:27`
**Dimension:** Completion

Grant draws the top card, applies the free-action corner, and puts it into hand. The printed effect says the card is revealed. There is no event/model state for other players or clients to observe that reveal before it enters hand.

Suggested fix: add a public reveal event or explicit card-effect output before pushing the card to hand. Add a test that the revealed card id is visible in the event log/model.

### W-07: Card 122 deck discard does not reshuffle

**File:** `packages/server/src/engine/cards/base/baseSignalBatchCardUtils.ts:187`
**Dimension:** Logic Correctness

Card 122 discards the top deck card three times for its signal. The helper uses `game.mainDeck.draw()` and skips when the draw pile is empty, while other draw paths use `drawWithReshuffle(game.random)`. If normal deck exhaustion should reshuffle the discard pile, this card loses effects at deck boundary.

Suggested fix: use the same deck exhaustion/reshuffle policy as other draw/discard-from-deck effects, or document why top-card discard intentionally does not reshuffle. Add a deck-boundary test.

## Reviewed With No Actionable Issue Found

No actionable issue was found in the reviewed implementations for: launch cards 9/133, removal cards 15/84, asteroid/comet/probe condition cards 17/18/95, visit and movement turn-effect cards 19-26 and 123-125, card 73 row discard/corner rewards, card 120 return-to-hand behavior, scan action cards 52-55, display-card signal cards 45-47, trace cards 75/98/99/100/108, tech cards 71/72/81, and card 90/114 outside the Exertian filtering concern.
