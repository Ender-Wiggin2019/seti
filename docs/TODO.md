# TODO

- [x] 梳理真实 game、`debug/solar`、`debug/solar-system` 的 solar system 数据投影与渲染路径
- [x] 找到 image mode/text mode 旋转后可能分叉的具体代码点
- [x] 先写一个旧实现会失败的聚焦回归测试
- [x] 做最小修复并跑相关测试
- [x] 记录验证结果和剩余风险

## Review

- 根因：真实 game 从 snapshot 反序列化后丢失 solar-system wheel `layers`；后续旋转只更新 disc angle/occupants，元素层不再随轮盘移动，导致 image mode 的轮盘图片和 text/public state 偶发不同步。debug 新建内存路径保留 layers，所以表现正常。
- 修复：snapshot DTO/serializer/deserializer 将 `layers` 作为必需字段保存并恢复；不再提供缺失 `layers` 的旧 snapshot 兼容路径。
- 验证通过：`pnpm --filter @seti/server test -- GameDeserializer.test.ts`、`pnpm --filter @seti/server test -- GameSerializer.test.ts`、`pnpm --filter @seti/server typecheck`、`pnpm --dir packages/server exec biome check src/persistence/serializer/GameDeserializer.ts src/persistence/serializer/GameSerializer.ts src/persistence/dto/GameStateDto.ts __tests__/persistence/serializer/GameDeserializer.test.ts`。
- 剩余风险：不考虑旧 snapshot 兼容时，当前 snapshot 协议路径未发现剩余风险；真实 game reload 后保留完整 layer stack，后续 rotate 与内存新建 game 使用同一套数据模型。

## Oumuamua Solar System Follow-up

- [x] 补充 debug rotate 回归：Oumuamua tile metadata 与 solar-system planet location 同步
- [x] 修复 debug rotate endpoint，让 Oumuamua tile/sector 随 alien rotation hook 更新
- [x] 让 `/debug/solar-system` 明确呈现 Oumuamua 的当前 space/sector
- [x] 跑相关 client/server 测试和类型检查

## Oumuamua Solar System Review

- 根因：`/debug/solar-system` 的 direct rotate endpoint 只旋转 `SolarSystem`，没有触发 `alienState.onSolarSystemRotated(game)`；Oumuamua 的 planet element 会随 wheel layer 移动，但 alien board 上缓存的 `tile.spaceId` / `sectorId` 没有同步，导致 sector data list 和 image overlay 锚在旧位置。
- 修复：debug `solarRotate` / `solarRotateNext` 旋转后调用同一套 alien rotation hook；debug 页面新增 Oumuamua 当前 `spaceId / sectorId` readout，便于验证 reveal 后的位置。
- 验证通过：`pnpm --filter @seti/server test -- debug.service.test.ts`、`pnpm --filter @seti/client test -- SolarSystemCompareDebugPage.test.tsx`、`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check ...`。

## Client Mission Hub UI Reference Alignment Plan

### Assumptions

- Scope stays in `packages/client`; no changes to `packages/web`.
- The user-provided `2223.PNG` is the north-star for Mission Hub and core UI primitives.
- Existing SETI game-card rendering remains sacred; do not restyle card-rendering classes or game card components.
- Use existing image assets under `packages/client/public/assets/seti/sprites`; do not introduce a new image dependency unless current assets cannot represent the requested look.

### Plan

- [x] Update `.impeccable.md` so button, card, and scene-asset guidance matches the reference image instead of the current metal-gradient-heavy interpretation.
  - 验证: 文档明确要求 cyan filled primary / outline secondary / dark ghost, and forbids JS-crafted fragmented collage when a normal image can carry the scene.
- [x] Tighten shared client UI primitives used by Mission Hub: `Button`, `Badge`, `Tabs`, inputs/selects if needed.
  - 验证: components still expose the same variants/API, but visual states match the reference design-system panel.
- [x] Rework Mission Hub scene composition to use normal image-backed scene panels rather than many layered decorative fragments.
  - 验证: first viewport still shows title, mission counts, create action, tabs, and room list; no central/lower-middle overblocking.
- [x] Improve mission stat tiles and room cards toward the reference card effect: cropped low-poly background, subtle dark overlay, status dot/tag, compact metadata.
  - 验证: existing tests for `MissionHub` and `RoomCard` still pass; visual screenshot shows cards closer to the provided reference.
- [x] Run focused verification.
  - 验证: `pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx CreateRoomDialog.test.tsx` and `pnpm --filter @seti/client typecheck`; if local app can run, inspect Mission Hub in browser screenshot.

### Review

- `.impeccable.md` 已更新：主按钮从旧金属渐变收敛为参考图的 cyan filled control；Tabs/选择器 active 态不再使用 metal-gradient face；sprite 资产规则明确优先作为单张 `<img>` scene plate / card background，不再用 JS 拼多碎片制造低多边形感。
- Client UI 已更新：`Button` primary/danger 改为平直填充控制，`Badge` 改成参考图式小矩形 status tag；Mission Hub hero 改为单张正常场景图并用 mask 融入暗场；统计卡和房间卡使用正常 `<img>` 背景；RoomCard 去掉 room-id hash 随机拼图逻辑。
- 验证通过：`pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx CreateRoomDialog.test.tsx`、`pnpm --filter @seti/client typecheck`。
- 浏览器检查：用 Node 23 启动 Vite 后打开 `http://127.0.0.1:5173/`，Mission Hub 首屏正常渲染，浏览器 error/warning 日志为空。初次使用 Node 18 启动 dev server 失败，原因是 Vite 需要 Node 20.19+/22.12+。

## Client 2224 Multi-Scene UI Alignment Plan

### Assumptions

- Scope stays in `packages/client`; no server/common rule behavior changes.
- Existing staged Mission Hub / RoomCard alignment is kept and extended rather than rewritten.
- The user-provided `2224.PNG` is the north-star for four page types: auth, profile, room/list surfaces, and live game.
- Image usage should be normal scene imagery: one strong image plate or card background per surface, not JS-selected fragments or collage effects.
- Existing SETI board/card/DescRender imagery remains sacred; this pass changes chrome, layout surfaces, and page composition only.

### Recommended Direction

- Use the reference's low-poly deep-space system across all client page shells: compact top chrome, translucent dark panels, cyan active states, amber/violet/green semantic signals, and 6-8px radii.
- Auth and Profile get full-scene background treatments with one normal image plate plus dark overlays.
- Game keeps the playfield dominant: board center remains clear, right personal panel and top action strips become reference-style instruments, and mobile keeps collapsed/stacked behavior.

### Alternatives Considered

- Broad rewrite: recreate all four screens to match the mock one-to-one. Rejected because it would risk game workflow regressions and touch too many unrelated components.
- Theme-only pass: adjust CSS tokens/buttons only. Rejected because Auth/Profile/Game would still read as different products.
- Targeted scene-shell pass: update page composition and shared instrument surfaces while preserving rules UI internals. Recommended because it matches the requested style with the smallest safe blast radius.

### Plan

- [x] Auth page: replace multi-sprite collage with one normal scene plate, tighten the login/register panel to match the reference, and remove terminal/uplink-flavored copy.
  - 验证: auth render test or focused smoke confirms tabs/forms/buttons still work; visual check shows no fragmented image treatment.
- [x] Profile page: convert the account screen to the 2224 profile layout: quiet top area, sidebar-like navigation/readout zone, avatar/stat/readout panels, and a single normal background scene.
  - 验证: profile data/edit/logout controls remain present and reachable.
- [x] Game shell: align `TopBar`, `TopActionBar`, `BoardTabs`, `PersonalColumn`, and shared loading states with the reference game screen without covering the board or changing game actions.
  - 验证: existing `GameLayout.test.tsx` and `GamePage.test.tsx` still pass; board tab keeps `w-fit max-w-full` behavior.
- [x] Shared styling: add small reusable scene/profile/game CSS utilities only where existing classes cannot express the design cleanly.
  - 验证: reused existing `mission-scene`, `mission-panel`, and instrument primitives; no new sacred SETI card/sector CSS changes.
- [ ] Focused verification. _(in progress)_
  - 验证: run `pnpm --filter @seti/client test -- MissionHub.test.tsx RoomCard.test.tsx GameLayout.test.tsx GamePage.test.tsx`; run `pnpm --filter @seti/client typecheck`; start the client and inspect `/auth`, `/profile`, `/lobby`, and a reachable game/debug route in browser if available.

## Create Room / Room Settings UX Plan

### Assumptions

- Scope stays in `packages/client`; room creation payload shape remains unchanged.
- Empty room name should be accepted in the client and converted to a default display name before calling `lobbyApi.createRoom`.
- Solo / multiplayer should be a first-class segmented choice instead of a secondary switch plus disabled player-count select.
- When Space Agency is enabled, all Space Agency submodules should default on: organizations, quick-start cards, new deck, new alien species, and the Space Agency alien modules.

### Plan

- [x] Add failing client tests for empty-name defaulting, easier mode selection, and Space Agency enable-all behavior.
  - 验证: `pnpm --filter @seti/client test -- CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx`
- [x] Update `CreateRoomDialog` to make mode selection direct, make room name optional with default generation, and keep solo difficulty/player count obvious.
  - 验证: focused tests pass; dialog still submits valid `IGameOptions`.
- [x] Update `SpaceAgencyOptionsSection` so enabling Space Agency selects all dependent options and Space Agency aliens by default in both create modal and room settings.
  - 验证: existing disable/dependency behavior still clears children correctly.
- [x] Lightly polish room settings layout to align with the existing dark sci-fi design system without touching game-card or rules UI.
  - 验证: no text overlap in modal/room settings; controls remain accessible by label.
- [x] Run focused verification and record results.
  - 验证: focused tests plus `pnpm --filter @seti/client typecheck`; inspect current local room page in browser if the dev server is reachable.

### Review

- 修复：`CreateRoomDialog` 现在用直接的多人/单人 segmented control；空任务代号会提交本地化默认名；solo 模式只显示 Rival 难度，多人模式只显示玩家数。
- 修复：`SpaceAgencyOptionsSection` 开启太空机构时默认启用组织、快速起步卡、新牌库、新外星物种，以及字形族/变形虫/阿尔霍斯模块；关闭主开关仍会清理依赖项。
- 设计：模式选择和 Space Agency 子选项使用现有深色 instrument selector / recessed well 语言，遵守 `.impeccable.md` 的 Mission Hub 控制风格；未触碰 SETI 卡牌和规则 UI。
- 验证通过：`pnpm --filter @seti/client test -- GameSettingsPanel.test.tsx CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check ...`。
- 浏览器检查：在 `http://localhost:5173/lobby` 打开创建弹窗，确认中文无英文 fallback、空名 placeholder 为“新任务”、多人/单人切换正确、开启“太空机构”后全部相关开关为 true；在 room 页确认共享设置面板正常渲染。
