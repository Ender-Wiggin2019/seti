# TODO

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
