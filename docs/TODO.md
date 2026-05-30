# TODO

## 2026-05-30 player board image mode operability follow-up

### Assumptions

- Image-mode player board should be interactive at the same semantic grain as the printed board areas, not just decorative anchors.
- Launch, scan, and analyze data are main actions and should call the same main-action request path as ActionMenu.
- Place data remains a free action and should continue to send `PLACE_DATA` with the selected computer slot index.
- All 12 printed tech slots should be independently addressable hotspots: 4 probe, 4 scan, and 4 computer.

### Plan

- [x] Add failing tests for launch/scan/analyze image hotspots, place-data slot payload, and all 12 tech slot hotspots.
- [x] Extend `PlayerDashboard` props for main-action dispatch and available main-action gating.
- [x] Render paired anchors/buttons for player-board main actions and 12 tech-slot anchors in image mode.
- [x] Wire main-action props from `GameLayout`, layout `PlayerBoardSection`, and `/debug/hotspots`.
- [x] Update `player-board:image` initial hotspot config and rerun focused/full verification plus browser smoke.

### Review

- Player board image mode now exposes clickable main-action hotspots for launch probe, scan, and analyze data; they send the same `IMainActionRequest` path as the top action menu and are gated by turn/phase availability.
- Image-mode computer slots still send the `PLACE_DATA` free action with the selected slot index, so place-data is operable directly from the board surface.
- All 12 printed tech positions are exposed as independent `tech-slot-*` image hotspots, have initial entries in `public/hotspot-overrides.json`, and `/debug/hotspots` Personal Board renders all 12 tech tiles for calibration.
- Verification passed: focused `PlayerDashboard` / `HotspotsDebugPage` tests, full client test suite, client typecheck, client lint, targeted Biome check, JSON parse check, and browser smoke on `http://127.0.0.1:5174/debug/hotspots` with 3 main-action hotspots, 12 tech-slot hotspots, visible place-data hotspot, and no console warnings/errors.

## 2026-05-30 player board image mode

### Assumptions

- Player board image mode should use the supplied board artwork as the coordinate surface instead of a DOM panel with a dim background.
- Text mode should keep the existing readable ResourceBar / TechRow / ComputerRow / IncomeTracker layout.
- Computer slots are the only player-board areas that currently have direct gameplay interaction; other printed areas are calibration anchors/readouts.
- `/debug/hotspots` should render the same image-mode player-board scene and save coordinates under `player-board:image`, separate from `player-board:text`.

### Plan

- [x] Add failing coverage for player-board image mode, computer-slot hotspot interaction, and `/debug/hotspots` player tab.
- [x] Implement the image-mode board surface with state overlays and image/text hotspot variants.
- [x] Add initial `player-board:image` hotspot override configuration for the supplied artwork.
- [x] Run focused tests, typecheck/biome as needed, and browser-smoke `/debug/hotspots`.

### Review

- Player board image mode now renders the supplied `8e4f86f5-9689-4000-88fd-344aa94604eb.png` artwork as the main personal board surface while text mode keeps the previous DOM panel.
- Image mode overlays data pool tokens, acquired probe/scan tech tiles, income/mission readouts, and computer-slot hotspots. Computer slots remain the gameplay interaction surface and send the existing `PLACE_DATA` payload.
- `/debug/hotspots` Personal Board renders the same `player-board:image` scene; initial image-surface coordinates were added to `public/hotspot-overrides.json`.
- Verification passed: focused player/hotspot tests, full client test suite, client typecheck, targeted Biome check, and browser smoke on `http://127.0.0.1:5174/debug/hotspots` with no console warnings/errors.

## 2026-05-30 hotspot percent drag origin fix

### Assumptions

- Hotspots declared with `xPercent` / `yPercent` should drag from the visual percentage position, not from fallback `x` / `y`.
- The fix should apply to both `HotspotAnchor` and `HotspotButton` because debug/hotspots exposes both draggable pure anchors and clickable interaction hotspots.
- Existing saved overrides should continue to take precedence over percentage defaults.

### Plan

- [x] Add failing tests for percent-positioned anchors/buttons dragging from the visual location.
- [x] Make shared hotspot geometry initialization respect percentage defaults before drag/resize calculations.
- [x] Run focused hotspot tests and browser smoke.
- [x] Run client lint/unit tests, then commit the verified changes.

### Review

- Root cause 1: percent-positioned hotspots rendered from `xPercent` / `yPercent`, but drag/resize state still used fallback `x=0` / `y=0`, so organization image markers jumped toward the top-left when edited.
- Root cause 2: Rival image-mode full-board overlay wrappers could intercept pointer events above lower anchors, so `data-pool` could be visible but not draggable.
- `HotspotAnchor` and `HotspotButton` now convert percentage defaults into base geometry before resolving overrides, so drag and resize start from the rendered position.
- Rival computer/data/tech overlay wrappers now use `pointer-events-none`, while their child hotspots keep their own pointer handling.
- RED verification: focused hotspot tests failed with draft coordinates `x: 40, y: 20` instead of the rendered percent position; the RivalPanel wrapper test failed before `pointer-events-none`.
- GREEN verification passed: `pnpm --filter @seti/client test -- HotspotAnchor.test.tsx HotspotButton.test.tsx`; `pnpm --filter @seti/client test -- RivalPanel.test.tsx -t "transparent image overlay wrappers"`.
- Final verification passed: `pnpm --filter @seti/client lint`, `pnpm --filter @seti/client test`, and `pnpm --filter @seti/client typecheck`.
- Browser smoke passed on `http://127.0.0.1:5174/debug/hotspots`: dragging `organization-power-card-helion-assembly` and `rival-board-data-pool-area` each moved exactly `30px/20px`, with no console warnings/errors.

## 2026-05-30 organization card image mode cleanup

### Assumptions

- Image mode should show the original corporation artwork size/aspect, not the text-mode card shell.
- The only visible hotspot on the image should be the use marker; the used badge is redundant in image mode.
- Ability details can stay out of the image surface and remain available through hover/title behavior.

### Plan

- [x] Add regression coverage for image-mode artwork aspect and absence of direct ability text.
- [x] Replace the image-mode organization card shell with the original artwork aspect and a single use marker hotspot.
- [x] Remove the separate image-mode used badge and update the debug-page expectations.
- [x] Run focused client tests, typecheck, biome, and a browser smoke on the debug page.

### Review

- Image-mode organization cards now render at the source artwork aspect ratio (`671x507`) and no longer print ability text directly on the image.
- The image mode now exposes one hotspot per card for the use marker; the separate used badge was removed.
- Verification passed: `pnpm --filter @seti/client test -- PlayerDashboard.test.tsx HotspotsDebugPage.test.tsx`, `pnpm --filter @seti/client test -- HotspotButton.test.tsx HotspotAnchor.test.tsx`, `pnpm --filter @seti/client typecheck`, and targeted `biome check`.
- Browser smoke passed against `http://[::1]:5174/debug/hotspots`: Helion Assembly card box measured `220x166.21875`, card text was only `1X`, marker text was only `1X`, and `organization-used-badge-helion-assembly` was absent.

## 2026-05-29 solar hotspot real-game id follow-up

### Assumptions

- Real game solar spaces use server ids like `ring-1-cell-0`; `/debug/hotspots` should calibrate those same ids.
- Existing saved `space-*` solar calibration should be migrated at load time so prior debug edits are not lost.
- Probe/capsule anchors continue to reuse their occupied space id.

### Plan

- [x] Make the solar hotspot debug fixture use real game solar space ids.
- [x] Add load-time compatibility from legacy `space-*` solar overrides to `ring-*` ids.
- [x] Update focused tests for the shared real-game ids and legacy migration.
- [x] Run focused client tests, typecheck, targeted biome, and real game smoke.

### Review

- Root cause: `/debug/hotspots` generated fake solar ids such as `space-0`, while real game uses server ids such as `ring-1-cell-0`; saved debug calibration therefore missed the game route.
- The debug fixture now uses the same `ring-N-cell-M` ids as real game solar spaces.
- Loading `/hotspot-overrides.json` now maps legacy `space-*` solar overrides to the matching real ids, so previously saved calibration still applies.
- Verification passed: focused client tests, client typecheck, targeted `biome check`, and real game smoke on `http://127.0.0.1:5174/game/{id}`. The smoke confirmed `solar-space-ring-1-cell-0` uses the migrated position and `/debug/hotspots` probe anchor shares the same id/position.

## 2026-05-29 solar hotspot apply/probe follow-up

### Assumptions

- Solar probes/capsules should visually reuse the hotspot calibration of the solar space they occupy, not maintain independent `probe-*` calibration keys.
- Saved hotspot JSON should be loaded for the normal game app, not only for `/debug/hotspots`.
- Debug page save/reset behavior stays unchanged.

### Plan

- [x] Add focused regression coverage for probes reading the calibrated solar space hotspot.
- [x] Add app-provider coverage that shared hotspot overrides load on normal routes.
- [x] Change solar movable-piece anchors to use their `spaceId` hotspot key.
- [x] Load `hotspot-overrides.json` from `AppProviders` so game routes receive saved calibration.
- [x] Run focused client tests, typecheck, targeted biome, and browser smoke.

### Review

- Solar probes/capsules now reuse their occupied solar space hotspot id, so `space-*` calibration moves the probe anchor with the space.
- Normal app routes now load `/hotspot-overrides.json` in `AppProviders`, so saved calibration is available outside `/debug/hotspots`.
- Verification passed: `pnpm --filter @seti/client test -- SolarSystemView.test.tsx AppProviders.test.tsx HotspotsDebugPage.test.tsx`, `pnpm --filter @seti/client typecheck`, and targeted `biome check`.
- Browser smoke passed on `http://127.0.0.1:5174`: `/game/smoke-hotspot` requested `hotspot-overrides.json` before redirecting to auth, and `/debug/hotspots` showed the solar `space-0` hotspot and probe anchor sharing the same hotspot id and position.

## 2026-05-29 solar hotspot ring sliders

### Assumptions

- `/debug/hotspots` 的 Solar System tab 只批量调整已渲染的 solar space interactive hotspots，不调整 sun、probe、alien token 等 anchor。
- Ring slider 表达相对当前坐标的径向像素偏移：负数向太阳中心收缩，正数向外扩张。
- Image Mode 和 Text Mode 继续写入 `solar-system:image` / `solar-system:text`，保存和重置沿用现有 draft/save 流程；单点拖拽仍然可继续微调。

### Plan

- [x] Add Solar System ring slider controls to `/debug/hotspots`.
- [x] Apply slider deltas as draft overrides for every hotspot in the selected ring and current mode namespace.
- [x] Preserve existing Save/Reset behavior and reset slider readouts after save/reset or mode switch.
- [x] Run focused client tests, typecheck, and targeted biome.

### Review

- Solar tab now shows Ring 1-4 radial sliders. Moving a slider writes draft overrides for all matching `solar-system` space hotspots in the active mode.
- Existing single hotspot drag/resize still writes through `setHotspotDraftOverride`; the ring slider only batches the same draft path.
- Verification passed: `pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx HotspotButton.test.tsx`, `pnpm --filter @seti/client typecheck`, and targeted `biome check`.
- Browser smoke passed on `http://127.0.0.1:5174/debug/hotspots`: Ring 1 slider rendered, moving it changed `space-0` position, enabled Save Hotspots, and produced no console warnings/errors.

## 2026-05-29 alien board trace hotspot follow-up

### Assumptions

- Oumuamua 的真实服务端 discovery 已经创建 trace slot；用户看到的缺失主要来自 `/debug/hotspots` fixture 没有按服务端 slot 定义补齐。
- Alien board 上可交互 hotspot 的校准坐标应完全复用同一位置的 anchor key；点击回传仍使用服务端 option/slot id。
- Exertians 版图上的 9 VP + 1 credit 底部行应使用已有的 `slot-1` 校准 key，避免被新生成的 `slot-0` 默认坐标错位。

### Plan

- [x] Add failing regression tests for Oumuamua debug trace bonus, Exertians bottom-row anchor key, and alien-board interactive hotspot anchor-follow behavior.
- [x] Reuse anchor hotspot ids for alien-board interactive trace buttons and Oumuamua planet action buttons while preserving server response ids.
- [x] Populate Oumuamua debug fixture from shared Oumuamua trace slot definitions.
- [x] Apply Exertians trace anchor index offset so the 9 VP + 1 credit row maps to the calibrated bottom anchor.
- [x] Run focused client tests, typecheck, and targeted biome.

### Review

- Oumuamua 的真实 server plugin 已经在 discovery 时创建 trace slots；本次修的是 `/debug/hotspots` fixture，现在直接使用 shared `OUMUAMUA_TRACE_SLOT_DEFS` 生成 3 色 x 5 个 slot，hover 能看到例如 `Trace bonus: 25 VP`。
- Exertians image anchor 仍按 5 个印刷 slot 渲染，但 persisted hotspot id 从 `slot-1` 开始映射，恢复已有校准里的 9 VP + 1 credit 底部行。
- Alien board trace 交互 hotspot 现在使用对应 anchor 的 hotspot id 做定位，同时通过 `data-server-trace-slot-id` 保留真实 server slot id，并且点击仍回传真实 option id。
- Oumuamua orbit/land 交互 hotspot 也改为复用 `orbit-area` / `land-area` anchor 定位 key。
- RED 验证：`pnpm --filter @seti/client test -- AlienBoardView.test.tsx HotspotsDebugPage.test.tsx` 在旧实现下 4 个新增断言失败。
- GREEN 验证通过：`pnpm --filter @seti/client test -- AlienBoardView.test.tsx HotspotsDebugPage.test.tsx`，2 files / 35 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check src/features/board/alienBoards/TraceMarkerOverlay.tsx src/features/board/alienBoards/ExertiansBoardArt.tsx src/features/board/alienBoards/OumuamuaBoardArt.tsx src/pages/game/HotspotsDebugPage.tsx __tests__/features/board/AlienBoardView.test.tsx __tests__/pages/game/HotspotsDebugPage.test.tsx`。

## 2026-05-28 hotspot debug hover info

### Assumptions

- Debug anchors/buttons should remain visible and draggable in hotspot debug mode, but their text info should not be permanently rendered on the board.
- Hover/focus info can be local to `HotspotAnchor` / `HotspotButton`; no new global debug panel is needed.
- Alien trace image anchors should surface trace reward/bonus details when a server trace slot exists, and explicitly identify coordinates that have no backing server slot.

### Plan

- [x] Add failing tests for hidden-by-default hotspot info, hover/focus tooltip display, and trace reward details.
- [x] Update shared hotspot primitives to accept optional debug details and show info only on hover/focus.
- [x] Pass trace slot reward details from alien trace overlays into hotspot debug details.
- [x] Add failing server tests for printed Exertians/Mascamites board trace slots missing from public state.
- [x] Configure printed Exertians/Mascamites species-board trace slots in server/common and align image layouts.
- [x] Verify focused tests, typecheck, targeted lint, and debug page HTTP smoke.

### Review

- 根因确认：`TraceMarkerOverlay` 按服务端 public `traceSlots` 的同色顺序映射到图片坐标；出现多条 `No server trace slot` 说明图片上有校准点但服务端没有对应 trace slot。
- 对照 `docs/arch/aliens/exertians/rule.md`、`docs/arch/aliens/mascamites/rule.md` 和对应 species-board 图，补齐 Exertians 每色 5 个印刷 trace 位，以及 Mascamites 红/黄各 4 个固定 trace 位、蓝色固定位加样本路径。
- Hotspot debug 信息改为 hover/focus 才显示；trace slot hover 现在展示 `Trace bonus: ...`，缺服务端 slot 时才显示 `No server trace slot`。
- `/debug/hotspots` 的 Exertians/Mascamites fixture 已同步补齐 trace slot 奖励，便于调试时直接看到 trace bonus。
- 验证通过：`pnpm --filter @seti/server test -- ExertiansAlienPlugin.test.ts MascamitesAlienPlugin.test.ts`，2 files / 26 tests passed。
- 验证通过：`pnpm --filter @seti/client test -- HotspotAnchor.test.tsx HotspotButton.test.tsx AlienBoardView.test.tsx HotspotsDebugPage.test.tsx`，4 files / 43 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`；`pnpm --filter @seti/server typecheck`。
- 验证通过：client/server targeted `biome check`。
- Debug smoke：用 `pnpm --dir packages/client dev --host 127.0.0.1 --port 5174 --strictPort` 启动后，`curl -I http://127.0.0.1:5174/debug/hotspots` 返回 200。浏览器插件本轮没有可调用工具，因此未做真实浏览器截图 smoke。

## 2026-05-28 alien trace slot interaction coverage

### Assumptions

- Trace slot selection arrives from the server as `EPlayerInputType.OPTION`; each legal trace slot has an option id equal to the slot id.
- Image-mode alien boards should expose a clickable hotspot for every legal option, not just the first/bottom trace slot.
- Pure debug anchors and action hotspots should remain separate: anchors are for calibration, buttons are for gameplay input.

### Plan

- [x] Add a failing component test proving upper trace slots become clickable hotspots when pending input includes them.
- [x] Pass pending input and response callback through `AlienBoardView` renderers.
- [x] Render trace slot `HotspotButton`s for every matching pending trace-slot option on image-mode alien art.
- [x] Update both legacy `GameLayout` and section-based `AlienBoardSection` wiring.
- [x] Verify with focused tests, typecheck, targeted lint, and browser smoke.

### Review

- Added regression coverage for Mascamites blue trace options: an upper image trace slot now renders as an interactive hotspot and sends the matching `EPlayerInputType.OPTION` response.
- `AlienBoardView` now derives selectable trace slot ids from pending option input and passes the selection callback through image alien renderers.
- Shared trace art now renders gameplay `HotspotButton`s for selectable slots while keeping calibration anchors separate; Anomalies uses the same behavior in its custom overlay.
- Wired `pendingInput` and `sendInput` through both `AlienBoardSection` and legacy `GameLayout`.
- Verification passed: `pnpm --filter @seti/client test -- AlienBoardView.test.tsx HotspotsDebugPage.test.tsx`, 2 files / 33 tests passed.
- Verification passed: `pnpm --filter @seti/client typecheck`.
- Verification passed: `pnpm --dir packages/client exec biome check src/features/board/AlienBoardView.tsx src/features/board/alienBoards/TraceMarkerOverlay.tsx src/features/board/alienBoards/AnomaliesBoardArt.tsx src/features/board/alienBoards/MascamitesBoardArt.tsx src/features/board/alienBoards/CentauriansBoardArt.tsx src/features/board/alienBoards/ExertiansBoardArt.tsx src/features/board/alienBoards/OumuamuaBoardArt.tsx src/features/layout/sections/AlienBoardSection.tsx __tests__/features/board/AlienBoardView.test.tsx`.
- Verification passed: `pnpm --dir packages/client exec biome lint src/pages/game/GameLayout.tsx`.
- Browser smoke passed against `http://localhost:5173/debug/hotspots`: Aliens panel rendered 26 alien cards, 5 webp board/back images, and console warning/error count was 0.

## 2026-05-28 alien board visual scale

### Assumptions

- Scale the whole `AlienBoardView` area to about 60% on tablet/desktop, not only board images.
- Keep mobile at full width so the board remains usable on small screens.
- This is a client layout-only change; no server/common rule state changes.

### Plan

- [x] Add a focused layout regression test for the 60% alien board scale.
- [x] Apply the minimal container-width change in `AlienBoardView` so image art and discovery/overflow zones shrink together.
- [x] Confirm undiscovered aliens use the webp back asset and all alien board assets remain webp.
- [x] Run focused tests, typecheck, and targeted formatting/static checks.

### Review

- `AlienBoardView` now keeps full width on mobile and constrains the whole section to `md:w-[60%] md:max-w-[60%]` on larger viewports, so the board image, discovery zone, overflow zone, and deck rail shrink together.
- Added `alien-board-section` test coverage for the desktop 60% layout classes.
- Confirmed undiscovered alien rendering uses `/assets/seti/aliens/back.webp` and added a regression assertion for that exact image path.
- Added asset coverage that `back.webp` plus all alien `board.webp` assets exist under `packages/client/public/assets/seti/aliens`.
- Verification passed: `pnpm --filter @seti/client test -- AlienBoardView.test.tsx HotspotsDebugPage.test.tsx`, 2 files / 31 tests passed.
- Verification passed: `pnpm --filter @seti/client typecheck`.
- Verification passed: `pnpm --dir packages/client exec biome check src/features/board/AlienBoardView.tsx __tests__/features/board/AlienBoardView.test.tsx`.
- Browser plugin returned in-app browser unavailable; Playwright fallback smoke passed against `http://localhost:5173/debug/hotspots`: Aliens tab section width was 835px inside a 1392px panel, ratio `0.6`, console warning/error count 0.

## 2026-05-28 anomalies token sprite

### Plan

- [x] 给 sprite 生成脚本和客户端适配补失败测试。验证：脚本测试能检查 6 个 token 的 sprite 布局，SolarSystemView 测试要求渲染 sprite background，HotspotsDebugPage 测试要求 debug 页覆盖 anomaly token。
- [x] 实现零依赖生成脚本，把 `packages/client/public/assets/seti/aliens/anomalies/tokens/*.png` 合成为一张 sprite 并写出 metadata。验证：运行脚本后生成 `tokens-sprite.png` 和 `tokens-sprite.json`。
- [x] 更新客户端 runtime 使用 sprite metadata 渲染 anomaly token，并在 `/debug/hotspots` 的 Solar System fixture 中加入 6 种 anomaly token。验证：相关测试通过且旧 fallback pill 仍保留。
- [x] 运行 focused tests、typecheck、targeted lint、Browser smoke。验证：在本节 Review 记录命令和结果。

### Review

- 新增 `scripts/build-anomalies-token-sprite.mjs`：零依赖读取 6 张 8-bit RGBA PNG，横向拼成 `tokens-sprite.png`，同时写出 `tokens-sprite.json` 和客户端 generated TS manifest。
- 客户端 `SolarSystemView` 不再为已知 Anomalies token 请求 6 张单图，改用 `tokens-sprite.png` 的 CSS background frame；未匹配组合仍走原 pill fallback。
- `/debug/hotspots` 的 Solar System fixture 现在放入 blue-data、blue-energy、pink-credit、pink-vp、yellow-card、yellow-publicity 六种 anomaly token，方便校准对应热点。
- RED 验证：`pnpm --filter @seti/client test -- buildAnomaliesTokenSprite.test.ts SolarSystemView.test.tsx HotspotsDebugPage.test.tsx` 在旧实现下失败，分别缺少脚本、仍渲染单图 `<img>`、debug solar 页没有 anomaly token。
- GREEN 验证通过：`pnpm --filter @seti/client test -- buildAnomaliesTokenSprite.test.ts SolarSystemView.test.tsx HotspotsDebugPage.test.tsx`，3 files / 41 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check src/features/board/SolarSystemView.tsx src/features/board/anomalyTokenSprite.generated.ts src/pages/game/HotspotsDebugPage.tsx __tests__/scripts/buildAnomaliesTokenSprite.test.ts __tests__/features/board/SolarSystemView.test.tsx __tests__/pages/game/HotspotsDebugPage.test.tsx ../../scripts/build-anomalies-token-sprite.mjs`。
- Browser 插件的 in-app browser 当前返回 `iab` 不可用；用 Playwright fallback 做 smoke：`http://localhost:5174/debug/hotspots` 有 6 个 anomaly token 和 6 个 sprite frame，均指向 `tokens-sprite.png`，首个 frame 可见尺寸约 60x36，console warning/error 为 0。

## 2026-05-26 rival and personal board hotspot follow-up

### Plan

- [x] 给 Rival image board 的 12 个 progress spot 全部暴露为可编辑 anchor。验证：RivalPanel 测试断言 `progress-slot-0..11` 均存在且当前 marker 使用对应 spot。
- [x] 给 `/debug/hotspots` 增加 Personal Board tab。验证：debug page tab 测试能切到该页并看到 `player-board` scene。
- [x] 给 personal player board 的关键板面区域补 `player-board` anchors。验证：PlayerDashboard 测试覆盖 resource/tech/computer/income/mission 区域 anchor。
- [x] 运行 focused tests、typecheck、targeted lint、Browser smoke。验证：在本节 Review 记录结果。

### Review

- 根因：Rival image board 只把当前 progress marker 数据化为 `progress-marker`，没有给 12 个 progress printed spots 各自的 anchor，因此无法逐个校准；Personal Board 没有出现在 `/debug/hotspots`，`PlayerDashboard` 也没有 `player-board` scene。
- 修复：Rival image board 现在渲染 12 个 `progress-slot-0..11` anchor，当前红色 marker 挂在对应 slot 内，保存会写入该 slot 的配置。
- 修复：`/debug/hotspots` 新增 `Personal Board` tab，渲染 `PlayerDashboard`。
- 修复：Personal Board 新增 `player-board` anchors，覆盖 resource row、launch/scan tech 区、data pool、12 个 computer top/bottom slots、analyze、income、mission summary；image/text mode 使用 `player-board:image` / `player-board:text` 分开保存。
- RED 验证：`RivalPanel.test.tsx -t "exposes rival image overlays"` 在旧实现下失败，当前 marker 仍是 `progress-marker`；`PlayerDashboard.test.tsx -t "personal board regions"` 在旧实现下失败，找不到 `player-board` anchors；`HotspotsDebugPage.test.tsx -t "switches tabs"` 在旧实现下失败，找不到 `Personal Board` tab。
- GREEN 验证通过：上述 3 个 targeted tests。
- Focused 验证通过：`pnpm --filter @seti/client test -- RivalPanel.test.tsx PlayerDashboard.test.tsx HotspotsDebugPage.test.tsx`，3 files / 31 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check <本节 6 个 client/test 文件>`。
- 扩展 focused 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx HotspotAnchor.test.tsx debugStore.test.ts SolarSystemView.test.tsx SectorView.test.tsx PlanetaryBoardView.test.tsx TechBoardView.test.tsx AlienBoardView.test.tsx RivalPanel.test.tsx PlayerDashboard.test.tsx HotspotsDebugPage.test.tsx`，12 files / 135 tests passed。
- Browser smoke：在 `http://localhost:5173/debug/hotspots` 中 Rival Board 有 12 个 `progress-slot-*` anchors，拖动 `progress-slot-0` 并 Save 后写入 `rival-board.progress-slot-0`；Personal Board 有 23 个 `player-board` anchors，拖动 `data-pool` 并 Save 后写入 `player-board:image.data-pool`；console warning/error 为 0。

## 2026-05-26 hotspot mode persistence follow-up

### Plan

- [x] 复现用户反馈的 image/text mode 保存隔离路径。验证：浏览器里拖动 image `solar-system/space-0`、Save、刷新、切 text mode 后读取 DOM 和 localStorage。
- [x] 修正 debug 页 mode 控件文案，避免 `Text Mode Off` 被理解成“点击关闭 text mode”。验证：页面测试覆盖明确的 Image Mode / Text Mode segmented control。
- [x] 重新运行 focused tests、typecheck、targeted lint、Browser smoke。验证：在本节 Review 记录结果。

### Review

- 干净复现结果：image mode 下拖动 `solar-system/space-0` 并 Save 后，刷新仍保留 image 坐标；切到 text mode 后仍读取默认 text 坐标，没有写入 `solar-system:text` 或旧的 `solar-system` namespace。
- 根因判断：mode 存储拆分本身有效，但旧按钮文案 `Text Mode Off` 容易被理解成“点击后关闭 text mode”，实际是当前状态提示，导致用户可能在错误模式下编辑；未点击 Save 时刷新丢弃草稿是预期行为。
- 修复：debug 页 mode 控件改成明确的 `Image Mode` / `Text Mode` 分段按钮，并用 `aria-pressed` 表示当前选中项。
- RED 验证：`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx -t "explicit image and text mode controls"` 在旧实现下失败，页面没有 `Image Mode` 按钮，只有 `Text Mode Off`。
- GREEN 验证通过：`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx -t "explicit image and text mode controls"`。
- Focused 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx HotspotAnchor.test.tsx debugStore.test.ts SolarSystemView.test.tsx SectorView.test.tsx HotspotsDebugPage.test.tsx`，7 files / 63 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check <本节 12 个 client/test 文件>`。
- Browser smoke：在 `http://localhost:5173/debug/hotspots` 里 Image Mode 按钮为选中态；拖动 solar `space-0`、Save、刷新后 image 坐标保留，切 Text Mode 后 `space-0` 仍是默认坐标；localStorage 只出现 `solar-system:image.space-0`，没有 `solar-system:text.space-0` 或旧共享 key，console warning/error 为 0。

## 2026-05-26 hotspot text-image config split

### Plan

- [x] 给 hotspot 组件补 mode-aware 存储命名空间测试。验证：同一个 `sceneId + hotspotId` 在 `image` 和 `text` variant 下读取/写入不同 override key。
- [x] 实现 `HotspotButton` / `HotspotAnchor` 的可选 `variant`，默认 `shared`，只改变存储 key，并在 DOM 上暴露 `data-hotspot-variant`。验证：既有 shared scene 测试不需要改语义。
- [x] 在 solar system 和 sector board 的 image/text 两种布局上显式传 `variant`。验证：solar/sector 组件测试能看到对应 variant，并且 image override 不污染 text mode。
- [x] 运行 focused tests、typecheck、targeted lint、Browser smoke。验证：在本节 Review 记录结果。

### Review

- 新增 hotspot `variant`：`shared` 保持旧行为，`image` / `text` 只影响本地 override 存储 key，DOM 仍保留原 `data-hotspot-scene`，并额外暴露 `data-hotspot-variant`。
- `HotspotButton` / `HotspotAnchor` 现在把 `solar-system + space-0 + image` 写到 `solar-system:image.space-0`，把 text mode 写到 `solar-system:text.space-0`，避免同一语义点在两套布局之间互相污染。
- `SolarSystemView` 的 space、probe/token anchor、Oumuamua data/planet anchor、solar alien token、Glyphids sector token 已按当前 `textMode` 传 image/text variant；sun 是 image-only variant。
- `SectorNodeView` 的 sector button 已按 text/image variant 拆分；image-mode sector signal dots 也使用 `sector-board:image`。
- RED 验证：`pnpm --filter @seti/client test -- HotspotButton.test.tsx HotspotAnchor.test.tsx` 在旧实现下失败，缺少 `data-hotspot-variant`。
- GREEN 验证通过：`pnpm --filter @seti/client test -- HotspotButton.test.tsx HotspotAnchor.test.tsx`，2 files / 9 tests passed。
- Focused 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx HotspotAnchor.test.tsx debugStore.test.ts SolarSystemView.test.tsx SectorView.test.tsx HotspotsDebugPage.test.tsx`，7 files / 62 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check <本节 10 个 client/test 文件>`。
- Browser smoke：在 `http://127.0.0.1:5174/debug/hotspots` 分别拖动 solar `space-0` 的 image/text mode 热点并保存，localStorage 中出现 `solar-system:image` 和 `solar-system:text`，没有写入旧的 `solar-system.space-0`；Sectors tab 在 text mode 有 8 个 `sector-board:text` 热点，image mode 有 50 个 `sector-board:image` 热点，console warning/error 为 0。

## 2026-05-26 planet board hotspot completeness

### Plan

- [x] 对照 `frontend-reference` 和 common/server planet 语义确认缺漏来源。验证：能解释 Mercury/Venus、orbit slot、moon slot 为什么没有出现在 `/debug/hotspots` 的 Planet Board tab。
- [x] 新增失败测试覆盖 Planet Board tab 必须显示全部 planet 的 orbit/land/moon hotspot。验证：旧实现下测试应因为 Mercury/Venus 或 orbit 缺失失败。
- [x] 最小修复 `/debug/hotspots` 的 planet fixture/render 入参，优先复用现有 `PLANETARY_BOARD_CONFIG` 定位。验证：测试通过且不改变真实 game flow。
- [x] 运行 focused tests、typecheck、targeted lint、Browser smoke。验证：在本节 Review 记录结果。

### Review

- `frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/components.js` 的 planet board 已包含 Mercury/Venus、每个 planet 的 `Satellite` 轨道坐标、`Rover`/moon 着陆坐标和 `alphabetSign` anchor；common 的 `PLANETARY_BOARD_CONFIG` 已经保留这些坐标。
- 缺漏根因在 `/debug/hotspots` fixture/render：`createPlanetInput()` 没有把 Mercury/Venus 放入调试选项，同时 Planet Board tab 传了 `mainActionPlanetMode={LAND}`，导致所有 orbit slot 被 `getPlanetHotspots()` 过滤。
- 修复后 `/debug/hotspots` 的 Planet Board tab 用 `PLANETARY_PLANETS` 生成调试 input 和空 board state，并不再固定 LAND 模式；因此同一张校准图上同时显示 7 个 orbit slot、17 个 land/moon slot，总计 24 个 interactive hotspot。
- RED 验证：`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx` 在旧实现下失败，缺少配置中的 planet-board hotspot。
- GREEN 验证通过：`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx`，1 file / 5 tests passed。
- Focused 验证通过：`pnpm --filter @seti/client test -- HotspotsDebugPage.test.tsx PlanetaryBoardView.test.tsx hotspotConfig.test.ts HotspotButton.test.tsx HotspotAnchor.test.tsx debugStore.test.ts`，6 files / 34 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check src/pages/game/HotspotsDebugPage.tsx __tests__/pages/game/HotspotsDebugPage.test.tsx`。
- Browser smoke：`http://127.0.0.1:5174/debug/hotspots` 的 Planet Board tab 实际 `planet-board` interactive hotspot 数量为 24，Mercury/Venus orbit/land、Mars orbit、Jupiter/Saturn/Uranus/Neptune moon hotspot 均存在，console warning/error 为 0。

## 2026-05-26 hotspot drag/filter follow-up

### Plan

- [x] 复现 planet board hotspot 无法拖动的根因。验证：新增嵌套 zero-size wrapper 的 `HotspotButton` 失败用例。
- [x] 修复 `HotspotButton` 坐标系选择，让它和 `HotspotAnchor` 一样优先使用 `offsetParent`。验证：planet board 类嵌套结构下拖动能写入 draft。
- [x] 增加 debug 可视过滤：interactive hotspots 和 pure anchors 独立开关。验证：debug page test 覆盖只隐藏 anchors、只隐藏 interactive 的行为。
- [x] 跑 focused tests、typecheck、targeted lint、browser smoke。验证：本节 Review 记录结果。

### Review

- `HotspotButton` 原来使用 `parentElement` 作为拖动坐标系；planet board 的按钮被包在按 planet 分组的空 `div` 内，导致坐标系宽高为 0，所以拖动不会写 draft。现在改为优先使用 `offsetParent`，与 `HotspotAnchor` 保持一致。
- `/debug/hotspots` 新增 `Interactive On/Off` 和 `Anchors On/Off` 两个开关。它们只控制 debug 可视层和编辑命中，不删除真实 gameplay 元素；关闭某一类后对应 label/半透明层不显示，正常元素布局仍保留。
- 验证通过：`pnpm --filter @seti/client test -- HotspotButton.test.tsx HotspotAnchor.test.tsx HotspotsDebugPage.test.tsx debugStore.test.ts`，4 files / 16 tests passed。
- 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx HotspotAnchor.test.tsx debugStore.test.ts RivalPanel.test.tsx AlienBoardView.test.tsx PlanetaryBoardView.test.tsx SolarSystemView.test.tsx SectorView.test.tsx PlayerDashboard.test.tsx HotspotsDebugPage.test.tsx`，11 files / 116 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check <本节 8 个 client/test 文件>`。
- Browser smoke：访问 `http://127.0.0.1:5174/debug/hotspots`，`Anchors Off` 后 `solar sun` label 消失但 `space-0` 仍显示，`Interactive Off` 后 `space-0` label 消失；Planet Board tab 拖动 `planet-board/mars-planet-land-0` 后 Save enabled，Save 前无持久覆盖，Save 后写入 `hotspotOverrides.planet-board.mars-planet-land-0`，console warning/error 为 0。

## 2026-05-26 image-anchor hotspot audit

### Plan

- [x] 静态扫描所有 client game 图片资源上的绝对定位层：重点覆盖 `features/board`、`features/solo`、`features/player`，并按 scene/component 记录已覆盖与缺口。验证：审计表能解释 rival indicator、alien trace、planet token、solar token 等定位层。
- [x] 抽象非交互定位用的 debug anchor：复用 hotspot 坐标、draft/save/reset 机制，但正常模式不改变点击语义。验证：新增组件测试，证明拖拽写 draft、Save 前不持久化。
- [x] 接入明确缺口：rival board 指示物/tech/data/computer 位置、alien board trace/deck/board 位置，以及审计发现的其他 image anchor。验证：focused component tests 断言对应 scene/id 可见。
- [x] 重复扫描 diff 和候选列表，直到所有 in-scope image absolute anchors 都有处理或明确排除理由。验证：在 Review 写出最终矩阵。
- [x] 运行 focused tests、typecheck、targeted lint、Browser smoke。验证：本节 Review 记录命令和结果。

### Review

- 新增 `HotspotAnchor`：非交互图片定位层正常模式保持 `pointer-events-none`，debug 模式显示 label、可拖动/缩放，并与 `HotspotButton` 共享 `hotspotOverrides` / `hotspotDraftOverrides` / Save 语义。
- 已接入 image-anchor scene：rival board 的 progress/readout/computer/data/tech/current card/objective markers；alien image boards 的 Anomalies/Centaurians/Exertians/Mascamites/Oumuamua trace markers；planet board 的玩家 token 与 alien glyph token；solar system 的 sun、probe/capsule、alien token、Glyphids sector token、Oumuamua planet/data pill；sector tile image-mode signal dots；corporation used badge。
- `/debug/hotspots` 的 alien fixtures 已改为真实 alien board shape，并给 trace/token 放入示例 occupant；corporations tab 现在显示 used badge，方便校准非交互 badge 位置。
- 最终静态排除项：text-mode/generated UI（Rival text progress cycle、AlienBoardTraceGrid、PlanetCard text cards、TechStack inline token、Computer/Tech/Resource rows）、debug-only labels/calibration badges、纯布局/背景遮罩与图片本身，不属于“游戏图片资源上的可校准 overlay anchor”。
- 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotAnchor.test.tsx debugStore.test.ts RivalPanel.test.tsx AlienBoardView.test.tsx PlanetaryBoardView.test.tsx SolarSystemView.test.tsx SectorView.test.tsx PlayerDashboard.test.tsx HotspotsDebugPage.test.tsx`，10 files / 110 tests passed。
- 验证通过：`pnpm --filter @seti/client test -- SolarSystemView.test.tsx HotspotsDebugPage.test.tsx`，2 files / 35 tests passed，用于复核后续纳入的 solar sun anchor。
- 验证通过：`pnpm --filter @seti/client test -- GameLayout.test.tsx -t "resolves orbit slot picker"`，确认恢复 `planet-target-mars` 既有 test id 语义后，orbit slot picker 点击仍走 `sendInput`。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check <本节 22 个 client/test 文件>`。
- Browser smoke：用 Vite `127.0.0.1:5174` 访问 `/debug/hotspots`；拖动 `solar-system/space-0` / `solar-system/sun` 后 Save 才写入 `hotspotOverrides`，未 Save 前持久配置为空；点击 Save 后清空 draft；rival、aliens、corporations tabs 能看到 progress/trace/used-badge anchors；console warning/error 为 0。
- 完整 client 测试：`pnpm --filter @seti/client test` 剩余 2 个失败都在 `CreateRoomDialog.test.tsx`，原因是测试查找旧 label `Mission Name`，实际 UI 为 `Mission Callsign`；`GameLayout.test.tsx` 已通过。这不是本节 hotspot 改动涉及的文件。

## 2026-05-26 hotspot save-before-persist

### Plan

- [x] 调整 debug store：新增非持久化 hotspot draft overrides，拖动/缩放只写 draft，Save 才合并到持久 `hotspotOverrides`。验证：store test 覆盖 draft、save、reset。
- [x] 调整 `HotspotButton`：读取持久配置 + draft 的合并结果，编辑时写 draft，不再直接写持久配置。验证：HotspotButton test 断言拖动/缩放只产生 draft。
- [x] 在 `/debug/hotspots` 增加 Save Hotspots 按钮，只有有未保存 draft 时可用；保存后按钮回到 disabled。验证：HotspotsDebugPage test 覆盖按钮状态和保存效果。
- [x] 运行 focused tests、typecheck、targeted lint，并做浏览器 smoke。验证：本节 Review 记录命令和结果。

### Review

- 旧行为是拖动/缩放直接写持久 `hotspotOverrides`，刷新后仍保留；现在改为写非持久化 `hotspotDraftOverrides`，刷新会丢弃未保存改动。
- 新增 `/debug/hotspots` 的 `Save Hotspots` 按钮：无草稿时 disabled；有草稿时 enabled；点击后合并到持久 `hotspotOverrides` 并清空草稿。`Reset Hotspots` 会同时清持久配置和草稿。
- `HotspotButton` 渲染时按“持久配置 + draft 覆盖”的结果显示，编辑时只更新 draft。
- 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx debugStore.test.ts SolarSystemView.test.tsx PlanetaryBoardView.test.tsx TechBoardView.test.tsx SectorView.test.tsx SectorGrid.test.tsx RivalPanel.test.tsx AlienBoardView.test.tsx PlayerDashboard.test.tsx GameDebugPage.test.tsx HotspotsDebugPage.test.tsx`，13 files / 116 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm exec biome check docs/TODO.md packages/client/src/stores/debugStore.ts packages/client/src/features/hotspots/HotspotButton.tsx packages/client/src/pages/game/HotspotsDebugPage.tsx packages/client/__tests__/stores/debugStore.test.ts packages/client/__tests__/features/hotspots/HotspotButton.test.tsx packages/client/__tests__/pages/game/HotspotsDebugPage.test.tsx packages/client/__tests__/features/board/SolarSystemView.test.tsx packages/client/__tests__/features/board/SectorView.test.tsx packages/client/__tests__/features/board/PlanetaryBoardView.test.tsx packages/client/__tests__/features/board/TechBoardView.test.tsx packages/client/__tests__/features/solo/RivalPanel.test.tsx packages/client/__tests__/features/board/AlienBoardView.test.tsx`。
- Browser smoke：访问 `http://localhost:5173/debug/hotspots`，`Save Hotspots` 初始 disabled；拖动 `solar-system/space-0` 后 enabled；点击 Save 后回到 disabled；console warning/error 为 0。

## 2026-05-26 standalone hotspot debug page correction

### Plan

- [x] 用测试固定 `/debug/hotspots` 是独立 UI 校准页，而不是复用 `/debug/game` 流程验证页。验证：新增 `HotspotsDebugPage.test.tsx` 覆盖标题、tab、自动开启 hotspot debug。
- [x] 新增 `/debug/hotspots` route 和页面 tab，覆盖 solar system（probe/move hotspot）、sectors、planet board、tech board、rival board、aliens、corporations。验证：测试断言每个 tab 有对应 component/scene 热区。
- [x] corporations 的 organization power button 接入统一 `HotspotButton`，覆盖 image mode 和 text mode。验证：`PlayerDashboard.test.tsx` 断言 `corporation-board` scene 与原点击 payload 不变。
- [x] 撤掉 `/debug/game` 中专门的 Hotspots / Reset Hotspots 校准入口，让它继续只承担 game flow debug；全局 header switch 保留给普通页面临时查看。验证：`GameDebugPage.test.tsx` 断言流程页不再暴露 hotspot 校准按钮。
- [x] 跑 focused tests、typecheck、targeted lint，并用 Browser 打开 `/debug/hotspots` 做 tab、label、拖动/缩放持久化 smoke。验证：在本节 Review 记录命令和结果。

### Review

- 新增独立 `/debug/hotspots` route 和 `HotspotsDebugPage`，页面默认开启 hotspot debug，提供 Text Mode、Hotspots、Reset Hotspots 控件，以及 solar/sectors/planet/tech/rival/aliens/corporations tabs。
- `/debug/game` 已移除专门的 Hotspots / Reset Hotspots toolbar 按钮，只保留 Text Mode 和流程调试控件；上一节中复用 `/debug/game` 的结论已被本节修正。
- corporations 的 `OrganizationCard` power button 已接入 `corporation-board` scene；image mode 和 text mode 都继续使用原 test id 和原 `USE_ORGANIZATION_POWER` payload。
- 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx debugStore.test.ts SolarSystemView.test.tsx PlanetaryBoardView.test.tsx TechBoardView.test.tsx SectorView.test.tsx SectorGrid.test.tsx RivalPanel.test.tsx AlienBoardView.test.tsx PlayerDashboard.test.tsx GameDebugPage.test.tsx HotspotsDebugPage.test.tsx`，13 files / 114 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm exec biome check docs/TODO.md docs/lessons.md packages/client/__tests__/pages/game/HotspotsDebugPage.test.tsx packages/client/__tests__/pages/game/GameDebugPage.test.tsx packages/client/__tests__/features/player/PlayerDashboard.test.tsx packages/client/src/pages/game/HotspotsDebugPage.tsx packages/client/src/pages/game/GameDebugPage.tsx packages/client/src/features/player/OrganizationCard.tsx packages/client/src/routes.tsx`。
- Browser smoke：访问 `http://127.0.0.1:5173/debug/hotspots`，tab scene 计数为 solar system `sector-board:8 + solar-system:32`、sectors `sector-board:8`、planet `planet-board:15`、tech `tech-board:12`、rival `rival-board:1`、aliens `alien-board:9`、corporations `corporation-board:11`。对 `solar-system/space-0` 执行拖动后 left/top 从 `54.7517%/38.5284%` 变为 `58.2605%/41.16%`，再缩放后 width/height 从 `3.68421%` 变为 `5.78947%`；console warning/error 为 0。

## 2026-05-26 hotspot debug/editor system

### Plan

- [x] 定义统一 hotspot 数据模型与坐标系：每个 scene 使用 `baseWidth` / `baseHeight`，hotspot 使用百分比定位与 px 尺寸，支持 `circle` / `rect`，并带 `color`、`opacity`、`debugLabel`、`action` 元数据。验证：新增 focused unit test 覆盖默认值、最小命中尺寸和 local override 合并。
- [x] 实现共享 `HotspotButton` / overlay 组件：默认圆形，正常模式保持透明命中，debug 模式显示半透明按钮、debug label、拖拽和缩放控制。验证：React test 覆盖点击不被拖拽误触发、debug label 可见、拖动/缩放回写回调。
- [x] 实现 client 本地配置持久化：复用 debug store/localStorage 路径，配置 key 按 scene + hotspot id 存储；后续如需要真实 JSON 文件导出，再在 debug page 增加复制/导出入口。验证：store test 覆盖保存、重载、reset。
- [x] 接入 solar system 与 sectors：替换/包裹现有 solar space button 与 sector selection 命中层，保留现有 movement、pending input 与 text/image override 行为。验证：`SolarSystemView.test.tsx` / `SectorView.test.tsx` focused tests。
- [x] 接入 planet board：替换 image-mode planet/moon target button，并给 text-mode planet card interaction 提供同一 debug overlay 语义。验证：`PlanetaryBoardView.test.tsx` 覆盖 image/text 可交互点与 payload 不变。
- [x] 接入 tech board：为 tech stack selection 增加统一 hotspot wrapper，在 debug 模式下能展示 stack 语义 label；不改变现有 tech stack 展示结构。验证：`TechBoardView.test.tsx` focused test。
- [x] 接入 rival board 与 aliens：rival rules、alien Oumuamua action、alien deck preview 等已有按钮或交互点使用统一 debug wrapper；alien trace/reveal/slot 相关展示保持现有规则，只叠加 debug 可视化。验证：`RivalPanel.test.tsx` / `AlienBoardView.test.tsx` focused tests。
- [x] 接入 hotspot debug 入口：复用现有 `/debug/game` 调试页 tab 和全局 header 控件，新增 Hotspots 开关与 Reset Hotspots；未新增单独 `/debug/hotspots`，因为现有调试页已经能展示 solar/sectors/planet/tech/rival/aliens 的真实游戏组件。验证：Browser 打开真实页面检查 debug labels、拖拽和缩放。
- [x] 完成最终验证和 review 记录：运行 focused client tests、typecheck、Browser smoke；在本节末尾记录证据、未覆盖风险和是否需要后续 JSON 文件导出。

### Review

- 实现了 `HotspotButton` 与 `hotspotConfig`：默认圆形、支持 `rect`、颜色、透明度、debug label、scene/id 数据属性、24px 最小命中区域、debug 下拖拽和边角 resize。
- 配置持久化复用 `useDebugStore` 的 `seti-debug` localStorage，结构为 `hotspotOverrides[sceneId][hotspotId]`；本次没有做真实 JSON 文件导出。
- 已接入的 scene 覆盖：`solar-system`、`sector-board`、`planet-board`、`tech-board`、`rival-board`、`alien-board`。入口覆盖全局 Header Hotspots switch，以及 `/debug/game` 的 Hotspots / Reset Hotspots 控件。
- 修复了真实浏览器发现的 resize handle 命中问题：小圆点放回 hotspot 自身命中盒内，避免边缘被 board frame 抢 hit-test。
- 验证通过：`pnpm --filter @seti/client test -- hotspotConfig.test.ts HotspotButton.test.tsx debugStore.test.ts SolarSystemView.test.tsx PlanetaryBoardView.test.tsx TechBoardView.test.tsx SectorView.test.tsx SectorGrid.test.tsx RivalPanel.test.tsx AlienBoardView.test.tsx`，10 files / 106 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm exec biome check <本次 21 个 client 改动文件>`，只剩既有 `SectorNodeView.tsx` 的 `SHARED_TILE_LAYOUT` unused warning；按精准修改原则未处理该无关死代码。
- Browser smoke：用仓库 E2E Node 23 启动 client，访问 `http://127.0.0.1:5173/debug/game`，Hotspots On 后可见 40 个热点 label；对 `sector-board/north-sector-0` 执行 Reset、resize、drag，localStorage 中写入 `{ width: 146, height: 146 }` 和新的 `x/y` override。未启动 debug server，因此页面有预期的 `/debug/server/session` CORS/network error，不影响本次 hotspot UI 验证。
- 剩余风险：本次没有新增单独 `/debug/hotspots` route，也没有完整 E2E 全套；后续如果需要跨浏览器/跨设备导出调参结果，建议加 JSON copy/export/import 控件。

已完成的历史 checklist 已于 2026-05-25 清理。需要追溯时，优先查看相关 `docs/review/` 文档和 git 历史。

## 2026-05-25 code clean smoke 验收

- [x] 读取 `scripts/smoke-web.sh` 与现有 E2E/启动脚本，确认真实浏览器验收入口和端口策略。
- [x] 运行 `scripts/smoke-web.sh`，验证 `/`, `/card/1`, `/card/39`, `/card/128`, `/prelude` 返回 HTML 200。
- [x] 启动真实 client/server，不使用 mock、debug endpoint、localStorage 注入或 raw websocket action。
- [x] 通过 Browser 真实操作完成登录、创建/进入房间、开始游戏、进入 `/game/{gameId}`。
- [x] 在游戏页执行可见用户动作并检查控制台/页面状态，确认 code clean 未破坏主流程。
- [x] 在本节末尾记录 review 结果、证据和剩余风险。

### Review

- `./scripts/smoke-web.sh 3101` 通过，确认 `/`, `/card/1`, `/card/39`, `/card/128`, `/prelude` 均返回 HTML 200。
- `SKIP_E2E_DB_PREPARE=1 pnpm --filter @seti/e2e exec playwright test tests/browser-smoke.spec.ts --project=chromium --retries=0` 通过，覆盖真实 UI 注册、创建 2 人房、加入、开局、进入游戏页和 PASS 同步。
- Browser 实操复用当前仓库真实 server/client：注册 `browser-smoke-1779704665044-bm1jnu`，创建单人房 `bd31275b-6dcf-47c3-9495-17a36160fd7c`，进入 `/game/bd31275b-6dcf-47c3-9495-17a36160fd7c`。
- Browser 游戏页实操完成：开局收入卡牌选择、卡牌 tab 可见 3 张卡、科技 tab 可见 12 个 tech stack、主行动 `跳过` 生效、事件日志出现第 1 回合结束，随后进入第 2 回合主行动待命。
- Browser console warning/error 检查为空。截图证据位于 `docs/review/browser-smoke-2026-05-25/`。
- 剩余风险：本次没有跑完整 E2E 全套，只跑了脚本路由冒烟、重点双用户 smoke 和 Browser 单局主流程；更深的规则分支仍需依赖已有针对性 E2E/单测。

## 2026-05-27 Lobby redesign from 2223.PNG

### Assumptions

- 参考图只按左侧 Lobby / 任务中心实现；右侧 design system 展示页不做单独页面。
- 允许覆盖当前已暂存的 Home/Lobby 相关草稿、主题草稿、导入素材和 `docs/home-redesign-style.md`。
- `/` 当前承载公开任务中心入口，`/lobby` 是登录后的真实任务大厅；本次优先让两者共享同一套 SETI Mission Hub 视觉语言，避免登录前后体验割裂。
- 本次只改 client 前端、主题 token、复用组件和静态素材，不改 common/server 游戏规则或房间 API 契约。
- 素材优先使用 `packages/client/public/assets/seti/sprites/`，必要时使用已导入的 `refine/2223.PNG` 作为设计参考，不把整张参考图当页面背景。

### Plan

- [x] 盘点当前 UI 与参考图差距。验证：列出需要补齐的组件/主题能力，确认不需要改后端或规则。
- [x] 收敛主题能力：补齐深空背景、金属边框、任务状态语义色、场景图层和低多边形资产 utility。验证：`theme.ts` 与 `globals.css` token 命名一致，旧组件仍有兼容 alias。
- [x] 重做 Mission Hub 页面结构：顶部导航下的 hero 月面场景、三张任务状态卡、筛选 tabs、房间列表，桌面首屏能同时看到标题、CTA、状态卡和列表入口。验证：DOM 内容和响应式结构可检查。
- [x] 重做/补齐共享组件：`RoomCard`、状态卡、空状态、必要的 lobby scene 装饰组件，保持信息完整且不新增无关功能。验证：`RoomCard` 既有测试通过，新增/调整测试覆盖状态标签、玩家数和模块信息。
- [x] 同步 `/lobby` 与 `/` 的视觉入口，或抽出小范围共享组件以减少重复。验证：两条路由不出现视觉和信息结构明显不一致。
- [x] 继续补齐与参考图的剩余差距：`MissionHub` hero / 列表区背景层、`RoomCard` 的 card background、`RoomPage` 的 room background 与共享 mission surface。验证：相关组件 DOM 能看到新增的 scene / panel 标记，信息结构不丢失。
- [x] 运行验证：只跑相关 client tests、typecheck、targeted biome；本轮按用户要求不跑 e2e。验证：在本节 Review 记录命令和结果。
- [x] 在本文件末尾补 Review：记录本轮补齐的视觉能力、验证结果和剩余风险。

### Success Criteria

- 首屏符合参考图左侧 Lobby：深空/月面场景、飞船/地形/人物或等价 sprites、任务中心标题、创建任务按钮、三张状态卡、筛选 tabs 和房间列表入口。
- 青色只用于主操作、选中和可加入；橙色用于进行中/暖色星体；紫色和绿色只作为状态补充。
- 房间卡片可快速扫描：房间名、主持人、状态、玩家数、solo 难度/外星模块/计时信息不丢失。
- 移动端不破坏主要操作：标题、CTA、状态卡、列表均可访问；装饰资产可降级隐藏。
- 没有新增后端契约、游戏规则或不必要抽象。

### Review

- 继续补齐了共享 Mission Hub 视觉能力：新增 `mission-panel` 深色任务面板 utility，并给 `Badge` 补了 `info` / `neutral` 语义标签，避免房间卡和房间页继续靠局部颜色硬写“可加入 / 中性”状态。
- `MissionHubView` 现在把 hero 场景、房间列表容器、底部 assets strip 都拉到同一月面任务中心语言：hero 叠加飞船、宇航员、基地 sprites；房间列表外层改成带场景底图和暖色光晕的 panel；底部素材带改成更接近参考图的陈列区。
- `RoomCard` 现在使用 terrain + object 双层 card background，顶部补 mission id readout，状态标签改成等待玩家青色 / 进行中橙色 / 中性灰；保留主持人、玩家数、solo 难度、外星模块和计时信息。
- `RoomPage` 不再是通用表单页：新增 mission-scene 头图区、三块 mission readout、带 sprites 背景的 crew / settings / actions panels，使 room background 与 Lobby 主视觉一致。
- 组件断言已补：`MissionHub.test.tsx` 断言房间列表 panel 标记，`RoomCard.test.tsx` 断言 card scene 标记，避免这次“只改外观”的工作完全不可验证。
- 验证通过：`pnpm --filter @seti/client test -- RoomCard.test.tsx MissionHub.test.tsx GameSettingsPanel.test.tsx GameSettingsPanel.editable.test.tsx`，4 files / 9 tests passed。
- 验证通过：`pnpm --filter @seti/client typecheck`。
- 验证通过：`pnpm --dir packages/client exec biome check src/components/MissionHub.tsx src/components/RoomCard.tsx src/components/ui/badge.tsx src/pages/lobby/RoomPage.tsx src/styles/globals.css __tests__/components/MissionHub.test.tsx __tests__/components/RoomCard.test.tsx`。
- 本轮按用户要求没有跑 e2e，也没有启动真实浏览器做视觉回归；当前“更接近参考图”的结论来自源码结构、素材使用和 focused tests，而不是 Browser 截图证据。
- 剩余风险：Room 页面没有新增独立页面级测试，视觉层次仍未经过真实桌面/移动浏览器验收；如果下一轮要继续追图片细节，优先看 hero / 列表卡片在真实 viewport 下的间距和资产遮挡关系。

## 2026-05-28 alien board asset replacement

### Assumptions

- `packages/client/public/assets/seti/refine/aliens` is the source of truth for this pass.
- Only source files with clear existing targets are replaced: `back.png -> back.webp`, and `anomalies|centaurians|exertians|mascamites|oumuamua.png -> */board.webp`.
- Existing `amoeba`, `glyphids`, and `arkhos` board images are left unchanged because the refine folder has no matching source image for them.
- Target dimensions stay aligned with the current client art frame: `777x1415`.

### Plan

- [x] Confirm refine alien image sizes and target dimensions. Verification: Pillow reports all refine source dimensions and target output dimensions.
- [x] Add a reproducible Python script for alien image normalization/conversion. Verification: script supports dry-run style reporting and deterministic target mappings.
- [x] Run the script to regenerate alien board and back assets as WebP while preserving target filenames. Verification: target files are WebP and all mapped outputs are `777x1415`.
- [x] Record final review and remaining risks in this section.

### Review

- Refine source audit: `back.png`, `anomalies.png`, `centaurians.png`, `exertians.png`, `mascamites.png`, and `oumuamua.png` are all `929x1693 RGB PNG`; there is no source-size mismatch inside `refine/aliens`.
- Added `scripts/process-alien-images.py` to normalize the refined PNGs into the existing client WebP filenames using centered fit/crop at `777x1415`.
- Regenerated `packages/client/public/assets/seti/aliens/back.webp` and the five matching alien board images: `anomalies`, `centaurians`, `exertians`, `mascamites`, `oumuamua`.
- Left `amoeba`, `glyphids`, and `arkhos` unchanged because the refine source folder does not contain matching images for those boards.
- Verification passed: `python3 -m py_compile scripts/process-alien-images.py`.
- Verification passed: `python3 scripts/process-alien-images.py --dry-run` reported consistent `929x1693` sources and the expected six source-to-target mappings.
- Verification passed: Pillow reopened all six generated WebP files as `777x1415 RGB WEBP`.

## 2026-05-28 alien board hotspot anchor audit

### Assumptions

- This pass only covers image-mode alien board hotspot/anchor coverage, not rule/state changes.
- Printed trace slots should be calibratable even when no player marker currently occupies them.
- Mascamites blue sample/delivered-sample trace positions, Oumuamua printed orbit/land positions, and Centaurians four top message/reward slots are in scope.

### Plan

- [x] Split alien trace slot anchors from live player markers. Verification: focused tests assert empty printed slots expose `alien-board` anchors.
- [x] Add Mascamites expanded blue trace/sample anchor layout. Verification: focused test covers more blue anchors than the basic five-row trace ladder.
- [x] Add Oumuamua printed orbit/land and first-land data anchors on the alien board art. Verification: focused test asserts all target IDs are present in image mode.
- [x] Add Centaurians four top message/reward anchors. Verification: focused test asserts the four anchor IDs are present.
- [x] Run focused client tests and record review.

### Review

- Root cause: image-mode alien boards only exposed player marker anchors when a trace slot already had an occupant; empty printed slots were not persisted/calibratable anchors.
- Fixed shared alien trace art (`TraceMarkerOverlay`) so Centaurians, Exertians, Mascamites, and Oumuamua render pure image anchors for every configured printed trace slot, while player markers remain separate anchors.
- Added Anomalies printed slot anchors to match the generic trace overlay behavior.
- Expanded Mascamites blue layout to include the printed sample/delivered-sample blue path, not just the lower five-row ladder.
- Added Oumuamua board-art anchors for printed orbit area, land area, and the three first-land data positions; moved the image-mode orbit/land action hotspots onto those printed areas.
- Added Centaurians four top message/reward slot anchors: `any-trace`, `energy-and-alien-card`, `publicity-3`, and `score-8`.
- Verification passed: `pnpm --filter @seti/client test -- AlienBoardView.test.tsx HotspotsDebugPage.test.tsx`, 2 files / 29 tests passed.
- Verification passed: `pnpm --filter @seti/client typecheck`.
- Verification passed: `pnpm --dir packages/client exec biome check src/features/board/alienBoards/TraceMarkerOverlay.tsx src/features/board/alienBoards/AnomaliesBoardArt.tsx src/features/board/alienBoards/MascamitesBoardArt.tsx src/features/board/alienBoards/OumuamuaBoardArt.tsx src/features/board/alienBoards/CentauriansBoardArt.tsx __tests__/features/board/AlienBoardView.test.tsx`.
- Browser plugin returned in-app browser unavailable; Playwright fallback smoke passed against existing dev server `http://localhost:5173/debug/hotspots`: Aliens tab had 9 Mascamites blue trace anchors, 4 Centaurians message anchors, required Oumuamua orbit/land/data anchors, and no console warning/error.

## 2026-05-30 alien trace config common source

### Assumptions

- Scope is the base five alien boards: Anomalies, Centaurians, Exertians, Mascamites, and Oumuamua.
- Existing user edit in `packages/client/public/hotspot-overrides.json` is unrelated and must not be touched.
- Mascamites fixed printed trace rewards should use alien-card draw rewards, not publicity rewards.
- Mascamites delivered-sample trace slots remain dynamic and keep using the sample token reward table.

### Plan

- [x] Add failing tests for common trace config coverage and Mascamites fixed trace rewards. Verification: focused common/server/client tests fail before implementation.
- [x] Move Exertians and Mascamites fixed trace definitions into common constants. Verification: server plugin imports common definitions and no longer owns duplicated reward tables.
- [x] Update HotspotsDebugPage fixtures to generate Exertians/Mascamites from common constants. Verification: alien hotspot debug fixture hovers show trace bonuses instead of drifted/manual data.
- [x] Run focused verification and record final review.

### Review

- Root cause: Exertians and Mascamites fixed printed trace rewards were duplicated in server plugins and the client hotspot debug fixture. The fixture had drifted slot ids/reward data, so printed hotspot anchors could show `no server data` even when the real board had trace slots.
- Added shared common definitions for Exertians trace slots and Mascamites fixed printed trace slots in `alienBoardConfig.ts`. Server plugins now create those slots from common data, and `/debug/hotspots` builds its Exertians/Mascamites fixtures from the same definitions.
- Mascamites fixed printed trace rewards now use `CUSTOM:DRAW_ALIEN_CARD` for the first two printed slots of each configured color. Dynamic delivered-sample trace slots remain driven by `MASCAMITES_SAMPLE_TOKENS`; the debug fixture simulates the 7 sample-token slots in token order so the blue sample path has server data during calibration.
- RED verification was observed before implementation: common constants were missing, server Mascamites still returned publicity, and client debug fixture lacked matching trace data.
- Verification passed: `pnpm --filter @ender-seti/common exec vitest run __tests__/constant/alienBoardConfig.test.ts __tests__/utils/alienTracePresentation.test.ts`.
- Verification passed: `pnpm --filter @seti/server exec vitest run __tests__/persistence/serializer/GameSerializer.test.ts __tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts __tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`.
- Verification passed: `pnpm --filter @seti/client exec vitest run __tests__/features/board/AlienBoardView.test.tsx __tests__/pages/game/HotspotsDebugPage.test.tsx`.
- Verification passed: common, server, and client typecheck.
- Verification passed: targeted `pnpm exec biome check` for touched common/server/client files.
- Existing dirty file `packages/client/public/hotspot-overrides.json` was not part of this fix.
