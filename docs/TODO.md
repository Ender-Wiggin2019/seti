# TODO

## Blue tech place-data downward slot bug - 2026-05-12

Assumptions:
- "blue tech 可以向下延伸" refers to Computer tech bottom slots created under a filled top slot.
- Top-row data still fills left-to-right, but an unlocked bottom slot only requires its own top slot to be filled; the whole top row does not need to be complete.
- The protocol currently sends only `slotIndex`, so the server should infer a bottom placement when the requested index is an available bottom slot and not the next top slot.
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.

Success criteria:
- With top slots 0-3 filled, a blue tech bottom slot under column 0 can be filled even when next top slot is 4.
- Omitting `slotIndex` still fills the next top slot by default.
- Requesting the next top slot still fills top row left-to-right.
- Requesting a non-next top slot that is not an available bottom slot still throws the existing left-to-right error.
- The free-action place-data dialog exposes available bottom slots alongside the next top slot.

Plan:
- [x] Add focused failing server regression tests for bottom placement before the whole top row is full.
- [x] Add focused failing client layout test for place-data dialog options.
- [x] Implement the minimal server/client logic change.
- [x] Run focused tests, typecheck/static checks as needed, and record evidence.

Review:
- Confirmed root cause: `PlaceDataFreeAction.execute` rejected every explicit `slotIndex` except `nextTopIndex` while any top slot remained empty, so a valid blue-tech bottom slot under an already-filled top slot hit `Top row must be filled left-to-right`.
- Server now treats an explicit `slotIndex` that matches an available bottom slot as bottom placement before falling back to the next-top-slot default.
- Client free-action dialog now lists available bottom slots together with the next top slot, so the action bar path exposes the same valid choice as the player-board computer row.
- Regression tests failed before implementation and passed after: server `PlaceData.test.ts` and client `GameLayout.test.tsx`.
- Verification passed: focused server/client tests, server typecheck, client typecheck, touched-file Biome check, and `git diff --check`.

## Client card input and move overlay UI - 2026-05-12

Assumptions:
- "player input select card row / pick card when pass" refers to client pending card inputs, especially `END_OF_ROUND` pass-pile selection, because generic `CARD` input already uses `HandView -> CardRender` like tuck income.
- The fix should stay client-only: no server/common rule behavior changes.
- Clicking a hand card should still inspect the card, but the detail dialog should expose a large `Play Card` entry when that specific hand card can be played through the same main-action rules as the action panel.
- Move selection overlays should only be raised while selected/reachable so normal text-mode cell labels and board pieces keep their existing visual hierarchy outside movement selection.

Success criteria:
- End-of-round/pass card selection renders real `CardRender` cards, not text-only rows.
- Focused tests prove the card-selection UI uses the same card renderer path in image/text mode and still submits the same input payloads.
- Clicking a hand card opens the existing detail dialog, and the dialog provides a prominent `Play Card` button for playable hand cards.
- The dialog play button dispatches `EMainAction.PLAY_CARD` with the clicked card's current hand index and is disabled/absent when the action panel would not allow playing a card.
- In text mode, selected/reachable move hotspots render above text-mode solar cell labels.
- Verification covers focused client tests, client typecheck, touched-file static checks, browser smoke where feasible, and `git diff --check`.

Plan:
- [x] Add failing tests for pass/end-of-round card selection rendering through `CardRender` while preserving submit payload.
- [x] Add failing tests for hand-card detail dialog `Play Card` behavior and availability.
- [x] Add failing text-mode `SolarSystemView` z-index regression for reachable/selected move hotspots above text labels.
- [x] Implement the smallest client changes in the affected components only.
- [x] Run focused tests, typecheck/static checks, browser verification, and record review evidence here.

Review:
- `SelectEndOfRoundCardInput` now renders pass/end-of-round choices with the shared client `CardRender`, preserving the same `END_OF_ROUND` input response payload.
- `CardDetail` accepts a playable-hand-card action and shows a large `Play Card` CTA only when allowed; `GameLayout` wires that to `EMainAction.PLAY_CARD` using the clicked card's current hand index and the existing main-action availability rules.
- `SolarSystemView` raises visible move overlays to z-index 90 when selected/reachable or when the current player's probe is selectable in move mode, keeping them above text-mode cell labels.
- Red/green evidence: focused tests initially failed for missing `CardRender`, missing detail `Play Card`, and z-index `0 <= 75`; after implementation, `SelectEndOfRoundCardInput`, `CardDetail`, `GameLayout`, and `SolarSystemView` focused client tests passed 4 files / 63 tests.
- Verification passed: `packages/client` TypeScript check, touched-file Biome, `git diff --check`, and browser smoke at `/debug/game` with debug routes enabled. Browser smoke confirmed end-of-round cards had `card-render` + `text-card`, the hand-card detail dialog showed the play-card CTA, and reachable move hotspots computed z-index 90 while text labels maxed at 75.

## DescTextRender - 2026-05-12

Assumptions:
- This is for pure text-mode card copy, not image-mode icon rendering.
- Existing common desc parsing should be reused where possible so `<br>` and `{token}` syntax stays consistent with `DescRender`.
- Token output in text mode should stay textual and safe; it should not use `dangerouslySetInnerHTML`.

Success criteria:
- A reusable client `DescTextRender` renders `<br>`, `<br/>`, and `<br />` as actual line breaks.
- Desc tokens such as `{credit}` and `{score-2}` render as readable inline text without raw braces.
- `TextCard` uses `DescTextRender` for effect, mission, end-game, and note text.
- Focused tests fail before implementation and pass after the minimal component change.

Plan:
- [x] Add focused failing tests for `DescTextRender` line breaks and token text.
- [x] Wire the renderer into `TextCard` desc display paths.
- [x] Run focused tests, typecheck/static checks, and record evidence.

Review:
- Added reusable `DescTextRender` for client text-mode desc output. It reuses `@seti/common/utils/desc.extractDesc`, renders `<br>` variants as real line breaks, renders tokens like `{credit}` / `{score-2}` as readable inline text, and keeps literal HTML escaped.
- Wired `TextCard` effect, mission, end-game, and note text through `DescTextRender`.
- The new TextCard regression failed first against the old raw-string output, then passed after the component integration.
- Verification passed: `DescTextRender` + `TextCard` focused client tests 2 files / 11 tests, `packages/client` TypeScript check, touched-file Biome, `git diff --check`, and browser smoke at `/debug/game` in text mode. Browser smoke found 10 text-card bodies, 2 rendered desc breaks, 6 desc tokens, and 0 raw `<br` occurrences in card body text.

## Solar board zoom controls - 2026-05-12

Assumptions:
- "solar board" refers to `SolarSystemView`, used by both image mode and text mode.
- Shrinking should affect the rendered board container, not the underlying solar coordinate/probe/sector calculations.
- The existing `gameViewStore.zoom` is intended for board zoom and can be used instead of adding another store field.
- Follow-up bug report: if zoom only changes `max-width`, users can see no visual change when the parent layout already constrains the board. The zoom must change the actual reserved panel/frame width.

Success criteria:
- Solar board defaults smaller than the current 760px max visual size in both image mode and text mode.
- The board header exposes compact `-` / `+` zoom controls with a visible percentage readout.
- Controls clamp to a reasonable zoom range and update the actual board max width without changing movement/input semantics.
- The outer solar board panel shrinks with the board, allowing content below to move upward and leaving open space to the right.
- Clicking zoom updates concrete `width` on the panel/frame, not only `max-width`, so the layout visibly changes even inside constrained scroll containers.
- Focused tests fail on the old layout and pass after implementation.
- Verification covers focused board tests, client typecheck, touched-file static checks, browser smoke, and `git diff --check`.

Plan:
- [x] Add focused SolarSystemView tests for default smaller size and zoom controls.
- [x] Implement board zoom with existing view store and compact header controls.
- [x] Run focused tests, typecheck, static checks, browser smoke, and record evidence.
- [x] Add regression coverage for zoom changing concrete layout width, then fix and re-verify.

Review:
- Reused `gameViewStore.zoom` for solar board zoom and changed its default to 90%, reducing the board max width from 760px to 684px.
- Added compact header zoom controls with a magnifier glyph, `-` / `+` buttons, and a visible percentage readout.
- Applied zoom by changing the board frame `max-width`, so image mode and text mode both shrink without changing percentage-based wheel, sector, probe, and input geometry.
- Follow-up correction moved the zoom boundary to the whole solar board panel: the panel now uses board width plus its horizontal padding, and the board tab column is compact/left-aligned instead of centered at 800px.
- Controls clamp through the component to 72%-108% in 6% steps.
- Focused tests first failed against the old fixed 760px layout, then passed after implementation; the follow-up panel/column tests also failed before the correction and passed after it.
- Final verification passed: TextCard + SolarSystemView + GameLayout client tests 3 files / 58 tests, `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game`: image mode showed 90% with panel/frame `708px / 684px` by default, `+` changed to 96% with `754px / 730px`, and two `-` clicks changed to 84% with `662px / 638px`; the board tab column rendered as `w-fit max-w-full`.
- Follow-up bug fix: changed panel/frame sizing from `max-width` to concrete `width`, because `max-width` can be visually inert when the parent container already constrains the board. New regression tests now require `width` and reject leftover inline `max-width`.
- Follow-up browser smoke checked real `getBoundingClientRect()` values: default `708px / 684px`, `+` `754px / 730px`, and `-` from default `662px / 638px`.

## Text card sections and hand readability - 2026-05-12

Assumptions:
- Mission container means only `MISSION_QUICK` / `MISSION_FULL` effects.
- End game container means `END_GAME` effects should be separated from generic Effect text.
- The too-small hand cards are the bottom hand dock previews, currently scaled down from the intrinsic card renderer.

Success criteria:
- Text cards do not render a Mission section unless at least one quick/full mission exists.
- Text cards render End Game effects in their own bordered section.
- Hand dock card previews are at least twice the previous visible size on desktop, using the same wrapper for text and image mode.
- Focused tests fail before implementation and pass after the minimal component changes.
- Verification covers focused card/hand tests, typecheck, touched-file Biome, browser smoke, and `git diff --check`.

Plan:
- [x] Add failing TextCard tests for conditional Mission and End Game sections.
- [x] Add failing HandView dock-size test for unified text/image preview scaling.
- [x] Implement the minimal TextCard and HandView changes.
- [x] Run focused tests, typecheck, static checks, browser smoke, and record evidence.

Review:
- TextCard now renders Mission only when the card has `MISSION_QUICK` or `MISSION_FULL` effects.
- TextCard now filters `END_GAME` out of generic Effect and renders it in a separate bordered End Game section.
- Hand dock previews now use a shared 158px by 220px wrapper with a 1.05 scale around the intrinsic 150px by 209px `CardRender`, so text mode and image mode grow together.
- Focused tests failed before implementation and passed after: TextCard conditional mission/end-game tests and HandView dock-size text/image test.
- Verification passed: related client tests 4 files / 48 tests, `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game`: image-mode hand preview measured 158px by 220px; text-mode hand preview also measured 158px by 220px; text cards without mission such as `110`, `28`, and `16` no longer had mission sections.

## Text card price badge - 2026-05-12

Assumptions:
- This applies only to `TextCard`.
- `C` means credit and `E` means energy; other price types fall back to their raw text.

Success criteria:
- Price renders in the card's top-left corner as `number + compact resource code`, for example `3 C`.
- The number is visually stronger/larger than the resource code.
- The previous right-side `#id` / full `priceType` stack is removed from the header.
- Focused tests fail before implementation and pass after the component change.

Plan:
- [x] Add focused TextCard tests for credit and energy price badges.
- [x] Implement the header change with minimal layout impact.
- [x] Run focused tests, typecheck/static checks, and record evidence.

Review:
- TextCard price now renders as a top-left compact readout, e.g. `4 C` / `3 E`.
- The price number uses a larger bold style; the resource code uses a smaller uppercase style.
- Removed the previous right-side `#id` plus full `priceType` stack from the text-card header.
- Focused price tests failed before implementation and passed after it; related TextCard/HandView/SelectCardInput tests passed 3 files / 13 tests.
- Verification passed: `packages/client` TypeScript check, touched-file Biome, and `git diff --check`.
- Browser smoke passed at `/debug/game` in text mode: a hand card rendered `2 C`, with the number at `text-[15px] font-bold` and the resource code at `text-[8px]`.

## Client Storybook component tests - 2026-05-12

Assumptions:
- "image mode" means the default client render path where `useTextMode()` is false.
- "text mode" means the debug render path controlled by `useTextMode()`.
- Core coverage should prioritize client components that accept projected state or card data and produce visible/clickable output, not full server rule execution.
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.
- Active goal continuation is treated as confirmation to implement after recording this plan.

Success criteria:
- Client has React Storybook configured for the Vite app and can render client stories with the same global CSS/card CSS used by the app.
- Core component stories exist for card rendering, card row/hand interactions, and text/image mode render paths.
- Storybook stories include interaction assertions that validate visible output and callback/input payloads.
- Existing Vitest can execute the Storybook stories as portable component tests, so CI-style verification does not rely on manually opening Storybook.
- Text mode and image mode are both covered by direct assertions for the important client components.
- Verification covers the focused Storybook tests, client typecheck, Storybook build, touched-file static checks, and `git diff --check`.

Plan:
- [x] Add Storybook dependencies/config/scripts with shared app styles and a mode-reset decorator.
- [x] Add focused stories with play assertions for `CardRender`/`TextCard`, `CardRowView`, and `HandView`.
- [x] Add a Vitest story test harness that composes and runs the stories.
- [x] Run the story tests red/green, fix minimal issues, then run type/static/build verification.
- [x] Audit the objective against concrete artifacts and record final evidence.

Review:
- Added Storybook 9.1.20 to the client with `storybook`, `build-storybook`, and `test:storybook` scripts. Version 10.3.6 was checked first but rejected locally because it hard-blocks Node 22.11.0; 9.1.20 supports the current Node line and Vite 7 peer range.
- Added `.storybook/main.ts` with the client aliases used by Vite and `.storybook/preview.tsx` that imports app/card CSS plus i18n and resets `useTextMode()` from story parameters.
- Added portable Storybook tests through `vitest.storybook.config.ts` and `__tests__/storybook/coreStories.test.tsx`; this setup deliberately avoids the existing `test/setup.ts` card-render mock so image-mode stories exercise the real `@seti/cards` renderer.
- Added core stories with play assertions for `CardRender`, `CardRowView`, `HandView`, `PlanetaryBoardView`, and `RivalPanel`. The stories assert text-mode visible content, image-mode render path, selected state, and callback/input payloads.
- Verification passed: initial story test failed before Storybook deps were installed; final `pnpm --filter @seti/client test:storybook` passed 1 file / 5 tests; focused related client tests passed 5 files / 33 tests; `pnpm --filter @seti/client typecheck` passed; `pnpm --filter @seti/client build-storybook` passed; touched-file Biome passed; `git diff --check` passed.
- Browser smoke passed: Storybook served at `http://localhost:6006/`; the `Client / Cards / CardRender / Text Mode Complex Card` story loaded with `Signal Analysis`, and the `Client / Board / PlanetaryBoardView / Text Mode Planet Summary` story exposed `first data 2 / 1` inside the iframe.
- Residual risk: Storybook build emits the existing large-chunk warning for the generated iframe bundle; `pnpm install` still reports pre-existing peer warnings for `@testing-library/dom` and `react-html-parser`.

## Text-mode card readability pass - 2026-05-12

Success criteria:
- Text-mode game cards keep the same 150px by 209px envelope as image-mode cards.
- Title, free-action/sector metadata, and income stay in fixed regions; only the middle effect/mission region scrolls when content is long.
- Text-mode cards present effects and missions as readable sections, using existing card effect data without changing rule semantics.
- Focused tests fail on the old layout and pass after the component change.
- Verification covers the focused card tests plus client type/static checks for touched files.

Plan:
- [x] Add focused TextCard tests for fixed dimensions, section order, mission rows, and middle-region scrolling.
- [x] Refactor `TextCard` to a fixed-height section layout with compact metadata and a scrollable effect/mission body.
- [x] Run focused client tests, typecheck, touched-file static checks, and `git diff --check`.
- [x] Record final evidence and residual risk.

Pre-implementation notes:
- The repository uses `docs/TODO.md` rather than lowercase `docs/todo.md`; this entry is appended here to avoid duplicate task files.
- Scope is limited to the client text-mode card renderer and its tests. Shared card rendering, image-mode card CSS, and game-rule logic are out of scope.
- Under the current Codex default workflow, implementation proceeds after recording this plan rather than waiting for a separate confirmation round.

Review:
- Added focused `TextCard` regression coverage for fixed card dimensions, fixed title/meta/income regions, scrollable effect/mission body, and readable mission rows.
- Refactored text-mode cards to a fixed 150px by 209px shell: title and cost at top, free-action/sector metadata below, scrollable Effect/Mission/Note body, and fixed Income footer.
- Mission effects are split out of the generic effect list and rendered as one `req -> reward` row per branch; non-mission effects remain in the Effect section.
- Verification passed: initial focused TextCard test failed against the old layout, then passed after the implementation; card-related client tests passed 4 files / 12 tests; `packages/client` TypeScript check passed; touched-file Biome check passed; `git diff --check` passed for touched files.
- Browser smoke passed at `http://127.0.0.1:5173/debug/game` with debug routes enabled: text mode showed real hand cards, `text-card-115` had `width: 150px; height: 209px;`, and its body used `overflow-y-auto`.
- Follow-up adjusted metadata readability: Free Action and Sector now render as separate fixed metadata rows.
- Follow-up made Mission more visually distinct with a rounded hairline border and darker surface fill inside the scrollable card body.
- Follow-up verification passed: focused TextCard test first failed against the single-line metadata / top-border-only mission layout, then passed after the update; card-related client tests passed 4 files / 12 tests; `packages/client` TypeScript check passed; touched-file Biome check passed; `git diff --check` passed for touched files; browser smoke confirmed `text-card-free-action-115`, `text-card-sector-115`, and bordered mission class on `/debug/game`.
- Residual risk: visual smoke covered the existing desktop debug route only; no new Playwright E2E was added because the change is isolated to the text-mode card renderer and covered by component assertions.

## Real game creation log verification - 2026-05-12

Success criteria:
- Start the real client and server with the repository E2E harness.
- Register real users through the UI, create a room through the UI, launch a real game, and enter `/game/{gameId}`.
- Perform a real user action that creates a log event.
- Assert the game page shows the compact board log and the desktop drawer log with readable text.
- Record screenshots or test artifacts through Playwright where available, and document any route/server blockers.

Plan:
- [x] Add a focused real-ui E2E spec for creating a game and checking game log UI.
- [x] Run the spec through `scripts/run-e2e-local.sh`.
- [x] Fix any log-specific failures found by the real game flow.
- [x] Record final evidence and residual risk.

Review:
- First real-game E2E run created a real room/game and exposed a compact-log gap: the full drawer showed `Pass`, but the compact board log showed later internal `Milestone Check` / `Action Reward` entries instead.
- Fixed compact log selection to prefer user-facing, non-debug events while preserving the complete event stream in the full dialog.
- Added a focused client regression test for that event ordering so the compact log keeps showing the readable player action and the dialog still shows all entries.
- Final verification passed: `pnpm --filter @seti/client test -- __tests__/features/log/EventLog.test.tsx` (9 tests), `./scripts/run-e2e-local.sh tests/game-log-real-game.spec.ts` (1 real UI game test, 9.3s), `pnpm --filter @seti/client typecheck`, E2E tsconfig check via `packages/client/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit`, touched-file Biome, and `git diff --check`.
- Residual risk: Vite still warns that local Node 22.11.0 is below its preferred 22.12+ floor, but the local server/client started cleanly and the real-game Playwright flow passed.

## Game log post-review confidence loop - 2026-05-12

Success criteria:
- Every server/common/client log requirement from the refactor has direct code and test evidence, not just a passing smoke check.
- Confirmed loopholes are fixed with focused regression tests before production edits where feasible.
- Event history cannot silently lose initial/reconnect logs, undo logs, input sub-step logs, or seeded recent events through ordering/dedupe mistakes.
- Client rendering avoids raw backend tokens in normal log text, handles card references without hidden crashes, and keeps the mobile compact log persistent and expandable.
- Verification includes targeted tests, broader affected package tests where practical, type checks, format/static checks, and a written residual-risk statement.

Plan:
- [x] Audit shared event protocol and server event producers/transport for structured event completeness and lifecycle gaps.
- [x] Audit client event ingestion/rendering/layout for stale closures, duplicate handling, raw token leakage, dialog/scroll behavior, and accessible interaction.
- [x] Add focused regression tests for any confirmed loophole, then implement minimal fixes.
- [x] Run targeted and broader checks; repeat audit after fixes until no known in-scope loopholes remain.
- [x] Record final review evidence and residual risk.

Review:
- Confirmed and fixed event-history dedupe risk by adding stable event ids and making client merge id-first with no-op state preservation.
- Confirmed and fixed compact-log interaction conflicts: card-reference clicks no longer expand the full log, dialog log uses a taller scroll area, and newest-first logs stay at the top.
- Confirmed and fixed readability gaps for score source / alien enum display, plus scan debug logging no longer breaks lightweight game doubles.
- Full verification passed: common 13 files / 142 tests, client 63 files / 227 tests, server 298 files / 1898 tests, common/server/client typechecks, touched-file Biome, and `git diff --check`.
- Browser smoke passed for the Vite app shell at `http://127.0.0.1:5173/`; `/debug/game` still redirects to `/`, so authenticated/live game visual validation remains covered by automated component/layout/hook/gateway tests rather than a browser route.
- Detailed report: `docs/review/game-log-post-review-2026-05-12.md`.

## Game log readability refactor confidence loop - 2026-05-12

Success criteria:
- Server emits distinct structured log entries for main actions, free actions, inputs/sub-steps, and undo, with `info`/`debug` levels instead of encoding categories in backend strings.
- Main action logs include useful details, especially `PLAY_CARD` card id/name and scan sector-mark sub logs.
- Client renders log actions and card ids as readable UI text/components, with no raw `ACTION:...` / `FREE_ACTION:...` backend strings visible in normal entries.
- Desktop keeps an event log in the side intel area; mobile keeps a short, always-present log below the solar-system board tab area, independent of tab switching, and opens a scrollable full log dialog on click.
- Focused tests fail on the old behavior and pass after implementation; targeted type/tests prove common/server/client consistency.

Plan:
- [x] Add red server tests for structured main/free/input/undo logs, play-card card details, and scan sector-mark debug entries.
- [x] Add red client tests for readable log rendering, card-id dialog behavior, and mobile/board-area persistent short log placement.
- [x] Implement shared event protocol fields and server helper functions with minimal call-site changes.
- [x] Replace raw client log strings with mapping/render components and card lookup from visible game state.
- [x] Move/add log UI so the desktop side area remains available and the board tab has a compact persistent summary plus dialog.
- [x] Run focused server/client tests and type checks, then audit every objective item against real evidence.

Pre-implementation notes:
- The repository has `docs/TODO.md` rather than lowercase `docs/todo.md`; this section is appended here to avoid duplicate task files.
- The active thread goal explicitly asks to continue implementation. That supersedes a separate interactive confirmation round for this plan, but the plan and verification gates remain recorded here.

Review:
- Server log protocol now carries structured `info`/`debug` levels, separate `ACTION` / `FREE_ACTION` / `INPUT` / `UNDO` event shapes, and timestamps across the shared common type.
- Main actions now log debug cost/reward entries without `ACTION:...` string encoding; free actions log as `FREE_ACTION`; successful input responses log as debug input entries; undo appends and broadcasts an `UNDO` event.
- Play-card logs include `cardId`, `cardName`, destination, price, and price type. Scan sector marking emits a debug `SECTOR_MARKED` sub log with sector id/color and gained reward metadata.
- Client log entries map main/free action tokens to readable labels, hide backend event type badges, render card ids as card-name buttons that open a dialog, and seed/dedupe history from `gameState.recentEvents`.
- Mobile/tablet board area now has an always-present compact log below the tab content (`lg:hidden`) showing one or two recent entries and opening a scrollable full log dialog; desktop side intel drawer remains available.
- Verification passed: server event/integration/gateway target suite 5 files / 87 tests; client log/layout target suite 2 files / 40 tests; common/server/client typechecks; touched-file Biome check with diagnostic-level error; `git diff --check`.

## Global error management confidence loop - 2026-05-11

Success criteria:
- Common protocol carries enough error semantics for server/client to distinguish silent, warning/business, error, and blocking failures.
- Server WebSocket and HTTP boundaries map known business/auth/not-found/system errors into the shared error payload without leaking unexpected internal messages.
- Stale or duplicate game input responses are silent at the client boundary and do not mutate/persist state; ordinary illegal game actions are warnings, not error toasts.
- Client global error handling uses shared semantics: silent errors are ignored, warning/business errors render warning toasts, blocking errors stay visible until dismissed.
- Focused tests fail on the old behavior and pass after the implementation; final review records any residual risk.

- [x] Add failing common tests for error classification defaults and explicit payload normalization.
- [x] Add failing server tests for missing game mapping, stale input silence, GameError payload metadata, and sanitized internal websocket errors.
- [x] Add failing client tests for silent/warning/blocking `game:error` handling and warning toast rendering.
- [x] Implement shared protocol/error classification and server/client boundary mapping with minimal API changes.
- [x] Run targeted common/server/client tests and type checks, then re-review loopholes.

Review:
- 新增 common 错误语义：`EErrorSeverity` / `EErrorCategory` / `EErrorDisplay`、`CONNECTION_ERROR`、`STALE_INPUT_RESPONSE`、`classifyErrorCode`、`normalizeErrorPayload`。默认分类将 stale input 设为 silent，游戏规则拒绝设为 warning/business，transport/auth/not-found/internal 设为 blocking。
- 修复 server 边界：`GameError` 现在携带 normalized payload；WebSocket auth/handler 错误统一发 shared payload；未知 WS/HTTP 异常脱敏为 `Internal server error`；`GameManager.getGame` 返回 `GAME_NOT_FOUND`；外部 input 无 prompt 或 inputId mismatch 返回 silent `STALE_INPUT_RESPONSE` 且不推进 version/persist。
- 修复 HTTP 边界：新增 `HttpErrorFilter` 并在 `main.ts` 全局挂载，Nest exceptions / `GameError` / unknown errors 都映射为 shared payload。
- 修复 client 展示：`useGameError` 按 shared classification 处理 silent/warning/blocking；toast 支持 `warning` 与 persistent `duration: null`；HTTP interceptor 优先展示 server payload message；Socket.IO connect/reconnect failure 映射为 blocking `CONNECTION_ERROR`；`GameLayout` 本地游戏内业务阻断从 error toast 改为 warning toast。
- 验证通过：common 全量 13 files / 142 tests；server 全量 298 files / 1887 tests；client 全量 62 files / 213 tests；common/server/client typecheck；本轮 touched files Biome check；`git diff --check`。client 全量测试仍输出既有 jsdom `window.scrollTo` warning，但测试通过，且与本轮错误系统无关。

## Rule FAQ implementation confidence loop - 2026-05-11

Success criteria:
- Every ruling in `docs/arch/rule-faq.md` is mapped to concrete implementation and/or test evidence, or explicitly marked not implemented/out of scope with reason.
- Every confirmed mismatch has a minimal proposed fix and a focused regression test/check that would fail on the old behavior.
- The fix plan is recorded before production changes; any skipped confirmation gate is explicitly noted.
- After confirmed fixes, targeted tests/type checks prove the FAQ behavior; any residual risk is explicitly recorded.

- [x] Read `docs/arch/rule-faq.md` line-by-line and convert it into a checklist by rules domain.
- [x] Compare Actions/Land/Scan/Analyze/Probe/Tech FAQ rulings with server/common/client implementation and tests.
- [x] Compare Missions/Milestones/Gold scoring/Cards FAQ rulings with implementation and tests.
- [x] Compare Alien species/Solo FAQ rulings with implementation and tests.
- [x] Aggregate all loopholes, separate confirmed bugs from unimplemented/out-of-scope features, and propose minimal fixes/tests.
- [x] Record the implementation plan before production code; explicit confirmation was superseded by the active-goal continuation instruction.
- [x] Implement confirmed fixes only, with focused regression coverage.
- [x] Run targeted verification, repeat the review loop, and record final confidence/review result.

Pre-implementation review:
- 当前实现还不能 100% 确认符合 `rule-faq.md`。已确认的行为差异包括：income/tuck 有手牌时被强制执行；card orbit effect 提供 `skip-orbit`；card launch/tech 不可执行时会让整张多效果卡不可打，而不是只跳过该 effect；generic card effect 以固定 priority/字段顺序解析，并且 tech-without-ROTATE 会旋转，和 project note 不一致。
- Scan 存在两个确认漏洞：基础 Scan 在执行 `MARK_EARTH` 后就提供 `DONE`，可跳过 card-row signal；Scan interruption 用任意 OPTION prompt 放行 free action，可能在一个 free action 或子交互未完成时再次插入 free action。
- Orbiter/lander 的真实状态在 `planetaryBoard`，但若干计分/卡牌路径使用 `player.pieces.deployed(ORBITER/LANDER)`；真实 orbit/land effect 没有同步 deploy。影响 gold `other/A`、通用 end-game per-orbit/land 计分，以及依赖 piece inventory 的 return-card 类路径。
- Solo gold milestone 没有限制 Rival 只能占 gold tile 第一格；当所有第一格已被占时，当前筛选仍可让 Rival 占第二格。S.17 Oumuamua 只配置/跟随 lander placement，在 landing 不可用但 orbit 可用的场景可能错误 fallback 到 scan。
- 需要补强但未必是生产逻辑错误的风险：S.15 Saturn/Jupiter movement 配置都为 5，FAQ 写 Saturn up to 4/Jupiter up to 5；S.15 empty sample pool / no reward isolation、S.16 既有人类 marker 的 leading 判定、solo objective 与 triggerable mission 同动作双标记、full mission skip 后再触发、Computer tech arbitrary column 的既有测试稳定性，都需要 focused regression 覆盖。

Proposed minimal fix plan:
- 修正 card effect 执行语义：card `canPlay` 不因 launch/tech 当前不可执行而拒绝整张卡；单个 launch/tech/land/orbit effect 在不可执行时跳过并继续；orbit 有可选目标时不提供 skip；tuck-for-income 在 card effect 场景允许 0 张跳过，但 setup tuck 仍保持强制。
- 修正 card effect 顺序/旋转：至少让 generic card-granted tech 使用 `skipRotation: true`，只由显式 ROTATE effect 旋转；为当前数据中的 rotate+tech、tech-without-rotate、launch-impossible-plus-resource 等路径加回归测试。若左到右顺序需要彻底保证，再把 generic behavior 从聚合字段改为保留 effect sequence 的队列。
- 修正 Scan：`DONE` 只有在 `MARK_EARTH` 和可执行的 `MARK_CARD_ROW` 都完成后才出现；free action interruption 只允许在 Scan action-pool menu 上发生，不能在 SpendSignalToken / MarkSectorSignal / PlaceData 等嵌套输入中再次插入。
- 修正 orbiter/lander 计数来源：以 `planetaryBoard` 作为计分权威来源，替换 gold `other/A` 与 end-game per orbit/land/per orbit-or-land 计数；同时修复 return-card 对真实 board lander/orbiter 的处理，避免依赖未同步的 piece deployed 计数。
- 修正 Solo：Rival gold options 只包含 `claims.length === 0` 的 tile；S.17 对 Oumuamua 使用 land-or-orbit 选择，landing 不可用但 orbit 可用时执行 orbit；为 S.15/S.16/solo objective-mission 并行触发补回归测试。
- 验证：先写能在旧实现失败的 targeted tests，再跑相关 server/common 测试集与 TypeScript check；根据失败继续下一轮 review，直到每个 FAQ 条目都有代码或测试证据。

Review:
- 修复 Actions/Card 语义：income tuck 可选择 0 张跳过，setup tuck 仍强制；card `canPlay` 不再因单个 launch/tech 不可执行而拒绝整张卡；不可执行的 launch/tech effect 执行时跳过并继续；orbit effect 可执行时不再提供 skip；通用 `behaviorFromEffects` 保留 left-to-right effect sequence；card-granted tech 只在显式 ROTATE effect 存在时旋转。
- 修复自由行动时机：主行动解析中的 pending input 可被 free action 中断，并在 free action 自身输入完成后恢复原主行动输入；free action interruption wrapper 防止 free action 嵌套 free action；Scan pool 保持 card-row/base mark mandatory，不允许在 MARK_EARTH 后提前 DONE。
- 修复 probe/orbiter/lander 权威状态：orbit/land effect 同步 deployed piece；gold `other/A`、通用 final scoring、Exertians 条件计数以 `planetaryBoard` 为权威并包含 moon occupants；Sample Return 支持真实 board lander/moon occupant。
- 修复 Solo/alien FAQ：Rival gold 只占 gold tile 第一格；S.15 拆为 Saturn 4/Jupiter 5 并保持 sample pool 为空时跳过、样本奖励不发给 Rival；S.16 以最近非 neutral occupant 判断 Rival 是否 leading；S.17 在 Oumuamua landing 不可用但 orbit 可用时执行 orbit；S.19 danger 计数只统计真实 danger slots + face-down cards。
- 补强 mission/objective 证据：triggerable mission 一个 checkpoint 只能 claim 一个 branch；skip 当前 trigger 后必须靠后续 trigger 再 claim；solo objective 与 triggerable mission 可由同一动作同时标记；mission 在卡牌主效果完全解析后才在 played mission 区生效的既有测试保持通过。
- 验证通过：server 全量 297 files / 1882 tests 通过；`pnpm --filter @seti/server typecheck` 通过；common 全量 12 files / 138 tests 通过；`pnpm --filter @ender-seti/common typecheck` 通过；本轮 touched 25 个 TS/TSX 文件 Biome check 通过；`git diff --check` 对本轮 touched 文件通过。
- 残余说明：本轮未改动已有 client/transport dirty files、`bk.config.yml`、`.playwright-mcp/` 等前序工作区改动；未发现剩余可复现的 `rule-faq.md` mismatch。

## Data-driven view/interaction confidence loop - 2026-05-11

Success criteria:
- Server owns canonical game state and projects all client-visible board/player/alien/solo data per viewer, without leaking hidden information.
- Server pending interactions are serialized as `IPlayerInputModel`; client submits only typed `IInputResponse` / action payloads and does not invent rule state outside `common` helpers.
- Client text mode and image mode differ only in presentation assets/layout. Both modes must consume the same projected state and preserve the same click/submit semantics.
- Every confirmed loophole has a focused failing test or observable assertion before production changes.
- Targeted type/tests/lint prove the reviewed contract; any residual risk is explicitly recorded.

- [x] Review server projection and websocket/input lifecycle for stale prompts, hidden data leaks, and missing public fields.
- [x] Review common protocol/types/helpers used by both client and server for duplicated or divergent rule logic.
- [x] Review client board/player/card/solo renderers for data-driven state consumption and text/image mode parity.
- [x] Review existing unit/E2E coverage and identify assertions that would fail if the strategy regressed.
- [x] Confirm the fix plan before changing production code.
- [x] Implement only confirmed minimal fixes, with regression tests.
- [x] Run targeted checks, re-review loopholes, and write the final review result.

Pre-implementation review:
- 当前策略还不能 100% 确认。最大漏洞是 transport response 没有关联 `inputId`：server pending input model 有 `inputId`，但 client 提交的 `IInputResponse` 没有带 id，server 也只校验 response type。过期点击、重复点击或迟到响应只要类型和 payload 符合新 prompt，就可能被当作当前交互处理。
- client `usePlayerInput.respond` 在发送后立即清空 pending input。如果 server 拒绝、网络失败或 stale input 被拦截，客户端会丢掉可重试的 prompt，掩盖真实状态。
- debug server 模式没有复用 websocket 路径的 card normalization。live server state 中部分 card 仍可能是 id string；debug REST 获取后直接 set state/input，可能让数据驱动视图收到未归一化 card。
- text mode / image mode 本轮未发现确认的规则分叉：主要分支集中在 presentation assets/layout，点击与提交语义仍来自同一份 server projection 和 pending input。修复重点应放在交互契约和 debug 数据入口。

Proposed minimal fix:
- 在 common `IInputResponse` 契约中加入 optional `inputId`，client 所有 input renderer 与 board shortcut 提交时带上当前 `model.inputId` / `pendingInput.inputId`；嵌套 AND/OR response 同时携带 root 与 nested input id。
- 在 `GameManager.processInput` 这个外部 transport 边界校验 `response.inputId === player.waitingFor.inputId`，缺失或不匹配时在进入 engine 前拒绝，避免 stale response 改变 game state 或清掉 server prompt。
- 调整 `usePlayerInput`：提交时只发送，不乐观清空；收到 authoritative `game:state` 后清空 pending，后续 `game:waiting` 再设置新 prompt。
- 在 `useServerDebugSession` 中复用 `normalizeGameStateCards` / `normalizePlayerInputCards`，让 debug REST 和 websocket 路径一致。
- 为上述每个漏洞补 focused regression tests，再跑 targeted client/server/common checks。

Review:
- 修复 transport input 关联：`IInputResponse` 增加 `inputId`，所有 client input renderer、board shortcut、debug bot/random input response 都带当前 server-projected input id；`GameManager.processInput` 在进入 engine 和递增 snapshot version 之前拒绝 missing/stale `inputId`。
- 修复 pending input 生命周期：`usePlayerInput.respond` 不再乐观清空 prompt，改为在收到 authoritative `game:state` 后清空，后续 `game:waiting` 继续由 server 设置。
- 修复 debug server 数据入口：`useServerDebugSession` 对 REST state 和 pending input 复用 card normalization，debug server mode 与 websocket mode 不再分叉。
- text mode / image mode 复核：本轮没有发现规则或交互语义分叉；相关 board/layout 测试覆盖了 text/image presentation 下的同一 pending input 语义。
- 验证通过：新增红灯覆盖 missing/stale `inputId`、pending prompt retry、debug REST card normalization、root/nested renderer response id；client input/board/layout 目标集 19 files / 91 tests 通过；client text-mode 目标集 5 files / 35 tests 通过；server gateway/debug 目标集 3 files / 27 tests 通过，额外 `GameManager` 16 tests 通过；common/client/server TypeScript checks 全部通过；本轮 touched TS/TSX 文件 Biome check 通过。
- 残余说明：`Game.processInput` 仍允许无 `inputId` 的内部调用，保留给 engine unit tests、Rival 自动解析和测试 fixture；外部 websocket/debug REST transport 统一由 `GameManager` 强制校验。`bk.config.yml` 与 `.playwright-mcp/` 是本轮开始前已有改动，未纳入本次修复。

## Alien implementation confidence loop - 2026-05-11

Success criteria:
- Every implemented alien species and shared alien mechanism is mapped to `docs/arch/aliens/*.md`, `docs/arch/rule-simple.md`, and FAQ constraints where relevant.
- Every confirmed alien bug has a failing unit/E2E check or equivalent observable assertion before production changes.
- Server/common/client alien behavior stays consistent for hidden information, public projection, card economy, discovery, and species-specific resources.
- The final state is backed by targeted tests/type checks, and any residual risk is explicitly recorded.

- [x] Inventory current alien docs, implementation files, tests, and dirty worktree state.
- [x] Review shared alien infrastructure: setup, discovery, trace selection, deck/face-up flow, serialization, and public state.
- [x] Review Anomalies and Centaurians implementations against rules and tests.
- [x] Review Exertians and Mascamites implementations against rules and tests.
- [x] Review Oumuamua implementation against rules and tests.
- [x] Review client rendering/projection and E2E coverage for alien-specific behavior.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat review until no factual gaps remain.

Review:
- 修复 shared alien 流程：discovery 输入完成后会继续解析同一轮后续已 fully marked 的 alien，避免第一个 alien 的交互输入截断发现链。
- 修复 Exertians：solo Rival 发现只按 discovery markers 获得 progress；danger trace 槽不再立即给 VP，游戏结束惩罚从 slot id 解析 danger；所有本轮确认的弃牌路径过滤 Exertian cards。
- 修复 Oumuamua：tile signal 消耗 data token 时给玩家 data；orbit 奖励现在会让玩家选择 sector/tile signal，并在 face-up 与 deck 都可用时选择 alien-card 来源。
- 修复 Mascamites：public sample pools 只投影数量，active capsules 不再投影 hidden sample token id；quick mission 的 comet/asteroid/distance probe 判断包含 Mascamites capsules。
- 修复客户端一致性：Centaurians reward slots 使用现有 desc/icon 渲染链；SelectTraceInput 使用 server-provided title；Mascamites UI 不再展示 active capsule 的 hidden sample id。
- 验证通过：server alien 目标集 11 files / 107 tests；client alien/input 目标集 2 files / 12 tests；common freeActions 1 file / 39 tests；common/server/client TypeScript checks 全部通过；本次相关 21 个文件 Biome check 通过，`GameSerializer.ts` correctness check 通过。
- 残余说明：完整 `@seti/server` lint 仍被既有格式问题阻断，位置在 `GameStateDto.ts`、`GameDeserializer.ts`、`GameSerializer.ts` 的旧格式片段；本轮未做无关格式化。

## Solo implementation confidence loop - 2026-05-11

Success criteria:
- Every confirmed solo bug has a failing test or equivalent observable check before production changes.
- Server/common/client solo behavior agrees with `docs/arch/solo/README.md`.
- The final state is backed by targeted tests, and any residual risk is explicitly recorded.

- [x] Inventory current solo code, docs, tests, and dirty worktree state.
- [x] Review server/common solo rules for impossible-action handling, state mutation, serialization, and rule edge cases.
- [x] Review client solo rendering/projection for hidden information leaks and server-client drift.
- [x] Review solo E2E/unit coverage for assertions that would fail on the identified bugs.
- [x] Patch only confirmed issues with minimal code changes.
- [x] Run targeted tests/type checks and repeat the review loop until no factual gaps remain.

Review:
- 修复 server/common solo 漏洞：probe placement 只能从 Earth probe 出发，跳过不可放置目标时不保留移动/publicity 副作用，probe tech 不提高 Rival 单 probe 发射上限，星球 trace/signal 奖励现在结算，Exertians discovery 卡对 Rival 转为 progress，Rival 金色里程碑输入自动结算，objective stack 先洗后抽样，SOLO.4 阈值改为 9 publicity。
- 修复 client/public projection 漏洞：`IPublicRivalState` 直接投影 Rival tech ids 与 computer slot rewards，`GameLayout` 不再从 public player rows 反推 Rival tech，`RivalPanel` 使用 server 投影的 rewards/techs，image mode objective 显示具体 task marker，data pool 显示完整数量，computer slots 稳定渲染 6 格。
- 覆盖补强：新增/更新 server unit、serializer、client unit、GameLayout 和 solo smoke 断言，确保这些漏洞会先红后绿。
- 验证通过：server 目标集 5 files / 115 tests；client 目标集 2 files / 51 tests；common/server/client/e2e TypeScript checks 全部通过；solo 相关 18 个改动文件 Biome check 通过；solo Playwright smoke/full-flow 3 tests 通过。
- 残余说明：完整 touched set 的 Biome 仍被 `GameSerializer` 既有非空断言和旧格式阻断，本轮未改无关代码。

清理说明：
- 已移除全部已完成任务与历史 Review；需要追溯时查看 git history 或 `docs/review/`。

## Solo interaction review confidence loop - 2026-05-12

Success criteria:
- For every reported solo interaction issue, classify it as a single scenario bug or a systemic implementation bug before production edits.
- Tech selection uses one canonical mapping from visible board slot/image to server tech id, immediate tile bonus, computer slot reward, and client click payload.
- `any card` rewards are not collapsed into deck-only `draw card`; where rules say any card, the user can choose card row or deck and card row refills correctly.
- Place-data rewards that require input, especially tuck-for-income and any-card choice, surface an obvious pending prompt and cannot look like a frozen page.
- Solo rival scan state is projected identically in text mode and image mode: data slots replaced by rival/player color markers stay visible in both modes.
- Focused tests fail on old behavior, pass after fixes, and targeted type/tests prove common/server/client consistency.

Plan:
- [x] Document implementation plan before production code changes. Note: repo has `docs/TODO.md` rather than lowercase `docs/todo.md`, so this entry is appended here to avoid duplicate task files. User explicitly requested fixes and sub-agent support, so implementation proceeded after classification and red tests.
- [x] Add red tests for blue tech visual-slot mapping: first visible computer tech resolves to credit, second to energy, third to any-card choice, fourth to publicity; client tech-board click sends the matching tech id.
- [x] Add red tests for `any card` reward semantics in the shared reward paths touched by this review: tech bonus, computer slot reward, planet orbit/card rewards, mission/card utility paths that currently collapse `CARD_ANY` into deck draw.
- [x] Add red tests for place-data continuation: data placement on a tuck/any-card slot keeps the player waiting on an explicit prompt, hides unrelated free actions first, and the client prompt names the required interaction.
- [x] Add red client tests for image-mode sector signals: rival/player markers produced by scan remain visible as colored markers instead of disappearing from the board.
- [x] Implement minimal shared fixes: separate canonical tech id order from image asset/order, add explicit any-card reward handling, propagate pending input from any-card computer/place-data rewards, and improve card input prompt copy/skip affordance.
- [x] Run targeted common/server/client tests and type checks; use Playwright only if unit coverage cannot prove the image-mode/pending-input behavior.

Pre-implementation review:
- Issue 1 is systemic. `TECH_STACK_LAYOUT` currently uses the visual/legacy computer row order `2,3,1,0`, while `getTechId(layout.tech, layout.level)` treats the same `level` as canonical rule id. This makes the first visible blue image (`techComp3`, credit) submit `comp-2`, whose server reward is card. The same conflation affects owner markers, rival tech order presentation, and blue-tech slot rewards.
- Issue 2 is systemic. There is a correct interactive helper for tech tile `CARD` bonuses (`TechBonusEffect.createAnyCardChoice`), but several reward paths still treat `CARD_ANY` as `drawCard`/deck draw only, including computer bottom rewards and generic mission/card reward helpers. This loses card-row choice and can also drop pending-input continuations.
- Issue 3 is expected rules behavior with a UI/continuation risk. Tuck-for-income itself is already interactive and skippable for non-setup effects, but place-data can create a card-selection prompt after a board click; if the client does not surface the title/skip affordance clearly, it looks like a freeze. The fix should improve prompt visibility and keep server locking behavior intact.
- Issue 4 is a client rendering bug with systemic mode-parity impact. `SectorNodeView` passes `showPlayerSignals={false}` in image mode, so scanned data replaced by rival/player markers is hidden; text mode renders the same data correctly.
- Issue 5 is likely the same pending-input discoverability/system-flow class as issue 3, with possible stale prompt hazards if any-card/tuck continuations are dropped. The fix should be verified through a real place-data path, not only component rendering.

Review:
- Fixed the systemic blue-tech mapping bug by keeping `TECH_STACK_LAYOUT` in canonical rule-id order and moving the computer image asset permutation into a shared client helper.
- Fixed the systemic any-card collapse in core paths: behavior executor, mission rewards, computer bottom rewards, place-data rewards, free-action corners, orbit rewards, and bespoke card utility paths now use `AnyCardChoiceEffect` so card row and deck choices are both available where the surrounding flow can return pending input.
- Fixed the place-data/orbit pending-input visibility class: card-selection prompts render their title, zero-card selections show `Skip`, and free actions are hidden while any pending input must be resolved.
- Fixed the image-mode scan rendering bug by allowing player/rival signal markers to render in image-mode sector slots.
- Verification passed: client focused vitest suite, server focused vitest suite, orbit/research/scan/play-card regression suite, related card regression suite, and `tsc --noEmit` for common/server/client.
