# 历史兼容性代码审计（client & server）

日期：2026-05-25

## 结论

项目尚未 release，因此“为了旧快照、旧协议、旧调试入口、旧数据库状态继续可用”的兼容代码都可以删除或收敛。当前代码里确实有一批这种路径，主要集中在持久化 DTO / deserializer、movement payload、client debug/replay fallback、旧 UI shape、样式 token alias 和数据库迁移 baseline。

不建议一次性混删所有项目。最稳妥的删除方式是按契约边界分批：

1. 先删纯兼容 alias、未调用的兼容方法和旧 UI/debug shape：类型别名、旧 debug route、game over 旧字段、sector `dataCapability` fallback。
2. 再收紧持久化 DTO：moon 旧字段、round/maxRounds 默认、player snapshot 默认、resource 双形状、tech bonus 单值迁移。
3. 再统一 client/server action 协议：movement 必带 `target`、删除 `capsuleId`，删除 ORBIT/LAND 的 server direct planet payload 与 client-side arming fallback。
4. 最后处理需要小重构的内部 fallback：scan tech 旧 orchestration、sector fulfillment 无 owner fallback、solar-system layer deserialization。

## 审计口径

本报告把以下内容算作历史兼容代码：

- 旧 snapshot / DTO / public state 字段仍被读取或类型仍保持 optional。
- 旧 action payload、旧 API 参数、旧 debug route 或 replay shape 被额外支持。
- 为旧测试 fixture、旧本地数据库、旧调试数据保留的 fallback。
- 明确注释为 `legacy`、`deprecated`、`back-compat`、`older snapshots/saves` 的路径。

以下内容不算历史兼容：

- 当前 undo / snapshot / pending-resolution 机制本身。
- 当前 debug 功能入口本身。
- 正常 UI 空态、i18n `defaultValue`、规则默认值。
- 当前业务上确实允许不存在的数据，例如 viewer 不应看到的手牌字段。

## Git 时间线（可清理候选）

口径：优先用 `git log --all --reverse -S"<关键符号>" -- <file>` 找该兼容符号首次出现的提交；对改名、文本不完全匹配或复合逻辑，再用 `git blame --date=short -L <line>,<line> -- <file>` 补充最近行级证据。因此这里的时间是“这段兼容逻辑大概进入当前代码形态的时间”，不是业务概念首次出现的绝对时间。

| 候选 | Git 线索 | 时间判断 |
| --- | --- | --- |
| 旧数据库 baseline | `ensureLegacyBaseline` 首次/最后出现在 `2026-04-22 9b8ed4c feat: e2e` | E2E/本地库接管时期加入，属于开发期 DB 兼容。 |
| round / maxRounds 旧 snapshot 默认值 | `roundIndex`、`maxRounds` 都在 `2026-05-15 4cfee8d feat: expansion` 出现 | 很新的 expansion 迁移残留；不是“历史很久”，但仍是旧快照兼容。 |
| player snapshot 默认值与 `resourceByType` | `resourceByType` 在 `2026-03-27 6739161 feat: add new assets` 出现；`quickStartCardIds` 在 `2026-05-15 2b0f1ee feat: expansion` 出现 | 混合了早期资源模型与后续扩展字段默认值，适合按字段分批收紧。 |
| `moonIndex` / `moonOccupant` | `moonIndex` 和 `legacy-moon` 都在 `2026-05-13 980e6de feat: update e2e` 出现 | 稳定 moon id 迁移时留下的旧 fixture/snapshot 兼容。 |
| tech `bonus` 到 `bonuses` | `bonuses` / `buildTechTileBonuses` 在 `2026-04-24 cff3af5 feat: update` 出现 | tech bonus 模型从单值转多值时保留的迁移层。 |
| solo rival 旧 board id | `LEGACY_RIVAL_BOARD_CONFIG_IDS` 在 `2026-05-08 2c59b7b feat: update solo` 出现 | solo board id 改名后留下的旧 id 映射。 |
| movement `capsuleId` / 省略 `target` | `capsuleId` 和 `legacyResult` 在 `2026-04-30 bc8a701 feat: add signal token` 出现 | movement 目标模型扩展时保留的旧 payload 兼容。 |
| snapshot event `actorId` / `lastActorId` | `actorId` 读分支在 `2026-03-27 6739161 feat: add new assets`；`lastActorId` 最早 `2026-03-27 80e7bac feat: update logic`，最近 `2026-05-21 7bc4436 fix: harden alien rotation and recovery` 触碰 | 早期 snapshot event shape，后来恢复逻辑加固时仍保留双读。 |
| lobby `scenarioPreset` / `turnTimerSeconds` | `turnTimerSeconds` 在 `2026-04-10 47f5d13 feat: add` 出现；`scenarioPreset` 在 `2026-04-13 e1b5c04 feat: add` 出现 | 早期房间配置 API 的旧字段。 |
| server 内部 alias / 旧测试 API | `canAfford` 在 `2026-03-26 f800daa feat: add engine layer`；`ILandProbeEffectOptions` 在 `2026-03-26 2da05da feat: add main actions`，最后 `2026-03-27 94745e8 feat: add cards`；`buildSolarSystem(nearStars` 在 `2026-03-27 94745e8 feat: add cards`；`lifeTraceGained` 最早 `2026-03-26 226a3ea feat: common layer rework`；`rotateRingByOneStep` 最早 `2026-03-26 226a3ea`，最近 `2026-05-21 e1eaeef fix(solar): layered disc model so base-board terrain is visible` | 这是最早期 engine/test API 残留；`rotateRingByOneStep` 最近被 layered model 改造触碰，但当前已无调用点。 |
| ORBIT/LAND direct planet flow / `planetActionMode` | `planetActionMode` 在 `2026-05-05 c28fe12 feat: update e2e` 出现，最近 `2026-05-21 8a8151a feat(orbit-land): picker-driven main action + opt-in first-orbit + per-planet reward fixes`；server `getOptionalPlanetPayload` 在 `2026-05-21 8a8151a` 出现 | 这是 picker-driven 主动作迁移后的近期兼容残留，不是年代久远的旧逻辑。 |
| `GameOverDialog` 旧 UI shape | `scoreBreakdown` 在 `2026-03-27 80e7bac feat: update logic` 出现；`goldTiles` 最早同日，最近 `2026-05-04 7094c9a feat: update alien` 触碰 | 早期 game-over shape 仍被 UI 接受，后来外星人计分调整时继续保留。 |
| sector / solar-system public state fallback | `dataCapability ?? sector.dataSlotCapacity` 在 `2026-04-27 76d929e feat: add todo` 出现；`solarSystem.ts` indexed-field fallback 行 blame 为 `2026-04-22 f19f54a feat: update` | public state indexed fields 加入后，为旧 snapshot/fixture 保留的扫描兜底。 |
| `/debug/alien` route alias | `debugAlienRoute` 在 `2026-04-23 09ae581 feat: add` 出现 | debug route 改名/合并时期留下的 redirect。 |
| card normalization / server raw card projection | client `TCardLike` normalizer在 `2026-04-15 b696a26 feat: e2e` 出现；文件最近 `2026-05-19 ed20411 feat(client): improve corporation card interactions` 触碰；server `cardRow: cloneValue(game.cardRow as never)` 行 blame 为 `2026-03-27 6739161 feat: add new assets` | client normalizer是对 server raw card projection 的后补兼容；应先修 server projection 再删。 |
| CSS/theme legacy token alias | `--bg-*` 等 token 行 blame 为 `2026-04-20 841efb6 feat: update`；legacy alias 注释和 theme alias 类型在 `2026-05-24 9ecb5ea Align UI copy with Space Agencies flavor` 触碰；`accent` 原始 theme 字段可追到 `2026-03-25 19807a1 feat: stage 0` | 样式 alias 不一定“旧”，但说明当前仍为兼容现有组件引用而保留。 |
| `ISolarSystemExpandedMapCell.cell` | `back-compat with callers` 在 `2026-05-21 e1eaeef fix(solar): layered disc model so base-board terrain is visible` 出现 | layered solar model 改造当天留下的冗余 top-cell 兼容字段。 |
| scan / land 测试桩兼容 | `getSpacesOnPlanet` fallback 最早 `2026-03-30 f32fffa feat: update logic`，最近 `2026-04-22 f19f54a feat: update`；`legacyKey` 在 `2026-05-13 980e6de feat: update e2e` 出现 | 主要服务旧 duck-typed 测试桩和旧 test key，可随测试整理删除。 |

## 可删除或可收敛候选

### 1. 旧数据库 baseline 兼容

位置：

- `packages/server/scripts/lib/migrateDatabase.ts:14`
- `packages/server/scripts/lib/migrateDatabase.ts:41`
- `packages/server/scripts/lib/migrateDatabase.ts:125`

现状：`ensureLegacyBaseline()` 会在已有旧表但没有 drizzle migration 记录时，手动创建 baseline 表并插入第一条 migration hash。这是典型“接管旧数据库”的兼容逻辑。

是否可以删：可以。未 release 项目不需要支持旧 DB 接管；本地开发库可 reset 后重新跑 migration。

删除方案：

- 删除 `ensureLegacyBaseline()`、`readMigrationFiles` import，以及 `runMigrations()` 里的调用。
- 保留 `CREATE EXTENSION IF NOT EXISTS pgcrypto` 和正常 `migrate(db, { migrationsFolder })`。
- 如果仍需要开发便捷性，提供显式 reset/prepare 脚本，而不是自动兼容旧 schema。

验证：

- `pnpm --filter @seti/server test -- resetE2eDatabase.test.ts`
- `pnpm --filter @seti/server run db:migrate`，使用空库验证。

### 2. game snapshot 的旧 round / turn 字段默认值

位置：

- `packages/server/src/persistence/dto/GameStateDto.ts:334`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:533`
- `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:209`
- `packages/common/src/types/protocol/gameState.ts:506`

现状：`roundIndex?: number`、`maxRounds?: number` 在 DTO/public type 中仍为 optional，deserializer 用 `dto.roundIndex ?? dto.round`、`dto.maxRounds ?? 5` 恢复旧快照。`turnIndex` / `turnLocked` 在 DTO 是必填，但 deserializer 仍有 `?? 0` / `?? false` 旧数据兜底。

是否可以删：可以。当前 `serializeGame()` 和 public projection 都总是写这些字段。

删除方案：

- `IGameStateDto.roundIndex`、`IGameStateDto.maxRounds` 改为必填。
- `IPublicGameState.roundIndex`、`IPublicGameState.maxRounds` 改为必填。
- deserializer 直接赋值，不再兜底。
- 删除 “restores missing legacy round counters” 测试。
- 同步补齐 client/server mock state。

验证：

- `pnpm --filter @seti/server test -- GameDeserializer.test.ts GameSerializer.test.ts`
- `pnpm --filter @seti/client typecheck`

### 3. player snapshot 旧字段默认值与双资源形状

位置：

- `packages/server/src/persistence/dto/PlayerStateDto.ts:31`
- `packages/server/src/persistence/dto/PlayerStateDto.ts:43`
- `packages/server/src/persistence/dto/PlayerStateDto.ts:54`
- `packages/server/src/persistence/serializer/GameSerializer.ts:447`
- `packages/server/src/persistence/serializer/GameSerializer.ts:509`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:348`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:389`
- `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:225`
- `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:255`

现状：serializer 当前会写 `quickStartCardIds`、`organizationIds`、`organizationState`、`oncePerRoundUsed`、`actionCosts`、`exofossils`、`playedCards`、`tracesByAlien`。但 DTO 仍把其中很多字段定义为 optional，deserializer 也以 `?? []` / `?? {}` / `?? 0` 恢复旧 snapshot。资源还同时保留 `resources.signalTokens` 与 `resourceByType[SIGNAL_TOKEN]` 两套形状。

是否可以删：可以，但需要逐字段一起收紧 DTO、serializer、deserializer 和测试 fixture。`setupChoiceContext` 这种运行态确实可能不存在的字段仍应保持 optional。

删除方案：

- 对当前 serializer 总是写出的字段改为 DTO 必填。
- 选择 `resources.signalTokens` 为唯一资源形状，删除 `resourceByType` 与 deserializer fallback。
- 删除 legacy setup-choice / organization defaults 测试，改为当前格式 round-trip 测试。
- 手写 fixture 缺字段时直接修 fixture，不再让 deserializer 静默补默认值。

验证：

- `pnpm --filter @seti/server test -- GameDeserializer.test.ts GameSerializer.test.ts`
- `pnpm --filter @seti/server typecheck`

### 4. moon `moonIndex` / `moonOccupant` 旧快照兼容

位置：

- `packages/server/src/persistence/dto/GameStateDto.ts:99`
- `packages/server/src/persistence/dto/GameStateDto.ts:105`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:231`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:241`
- `packages/server/src/engine/board/PlanetaryBoard.ts:137`
- `packages/server/src/engine/board/PlanetaryBoard.ts:151`
- `packages/server/src/engine/board/PlanetaryBoard.ts:443`
- `packages/server/src/engine/Game.ts:1302`
- `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:373`
- `packages/server/__tests__/engine/actions/Land.test.ts:354`

现状：DTO 明确标注 `moonIndex` / `moonOccupant` 为 legacy snapshots only。`GameDeserializer` 和 `PlanetaryBoard` 仍可把旧 `moonIndex` 或单个 `moonOccupant` 转成新 `moonId`，并在无法解析时生成 `legacy-moon-*`。

是否可以删：可以。当前 action payload 已拒绝 `moonIndex`，当前 serializer 只写 `moonOccupants[].moonId`。

删除方案：

- DTO 删除 `moonIndex` 和 `moonOccupant`。
- `deserializePlanetaryBoard()` 只接受 `moonOccupants[].moonId`，缺失时抛错。
- `PlanetaryBoard` 删除 `TStoredMoonOccupant.moonIndex`、`resolveStoredMoonId()` 的 index fallback 和 `legacy-moon-*` fallback。
- 若不需要旧 payload 专门错误信息，`Game.getMoonIdPayload()` 也可以删除 `moonIndex` 分支，让缺少 `moonId` 的当前校验报错；若保留，应该把它视为错误提示而非兼容。
- 删除 legacy moon normalization 测试；保留 current `moonId` round-trip。

验证：

- `pnpm --filter @seti/server test -- GameDeserializer.test.ts PlanetaryBoard.test.ts Land.test.ts`

### 5. tech board `bonus` 单值到 `bonuses` 多值迁移

位置：

- `packages/server/src/persistence/dto/GameStateDto.ts:121`
- `packages/server/src/persistence/serializer/GameSerializer.ts:615`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:290`

现状：serializer 当前同时写 `bonus` 和 `bonuses`，deserializer 用 `tileDto.bonuses ?? buildTechTileBonuses(stackDto.techId, tileDto.bonus)` 兼容旧单值格式。

是否可以删：可以，前提是把 `bonuses` 确定为 canonical 形状。

删除方案：

- DTO 中 `bonuses` 改必填，删除 `bonus` 或仅保留为运行态非持久化字段。
- serializer 不再写旧 `bonus` 字段，deserializer 不再从单值构造多值。
- 更新 TechBoard / serializer 测试断言。

验证：

- `pnpm --filter @seti/server test -- GameDeserializer.test.ts GameSerializer.test.ts TechBoard.test.ts`
- `pnpm --filter @seti/client test -- TechBoardView.test.tsx InputRenderer.test.tsx`

### 6. solo rival 旧 board id 映射与未知 id 静默兜底

位置：

- `packages/common/src/constant/solo.ts:48`
- `packages/common/src/constant/solo.ts:55`
- `packages/server/src/persistence/serializer/GameDeserializer.ts:499`
- `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:438`

现状：`automaBoard1..4` 会被映射到 `rival-board-*`。未知 id 目前也会落到 `rival-board-1`，这不是单纯兼容，还会掩盖坏数据。

是否可以删：可以，而且建议改成严格失败。

删除方案：

- 删除 `LEGACY_RIVAL_BOARD_CONFIG_IDS`。
- `normalizeRivalBoardConfigId()` 只接受 `rival-board-1..4`，未知值直接抛错。
- 删除 legacy id 测试，新增 unknown id 抛错测试。

验证：

- `pnpm --filter @ender-seti/common test -- solo`
- `pnpm --filter @seti/server test -- GameDeserializer.test.ts`

### 7. movement `capsuleId` 与省略 `target` 的旧 payload

位置：

- `packages/common/src/types/protocol/actions.ts:27`
- `packages/common/src/types/protocol/actions.ts:31`
- `packages/common/src/types/protocol/actions.ts:33`
- `packages/server/src/engine/freeActions/processFreeAction.ts:25`
- `packages/server/src/engine/freeActions/Movement.ts:37`
- `packages/server/src/engine/freeActions/Movement.ts:257`
- `packages/server/src/engine/freeActions/movementTargets.ts:16`
- `packages/server/__tests__/engine/freeActions/processFreeAction.test.ts:49`

现状：movement 协议有新 `target`，但还允许 deprecated `capsuleId`。同时 `target` 省略时仍按旧“path[0] 上的 probe”选择移动棋子。

是否可以删：`capsuleId` 可以删；省略 `target` 也建议删，但要同步 client/debug 所有 movement 请求。删除后多探针同格不会再靠隐式选择，确定性更好。

删除方案：

- `IMovementFreeActionRequest.target` 改为必填。
- 删除 `capsuleId` 字段、`legacyResult`、`Movement` 返回值里的 `capsuleId`。
- client `GameLayout`、debug endpoints、测试 helper 所有 movement 请求补 `{ type, id }`。
- `processFreeAction` 不再做旧 payload normalize。

验证：

- `pnpm --filter @seti/server test -- Movement.test.ts processFreeAction.test.ts GameDeserializer.test.ts`
- `pnpm --filter @seti/client test -- GameLayout.test.tsx SolarSystemView.test.tsx`

### 8. snapshot event 的 `actorId` / `lastActorId` 双形状

位置：

- `packages/server/src/gateway/GameManager.ts:133`
- `packages/server/src/gateway/GameManager.ts:154`
- `packages/server/src/gateway/GameManager.ts:188`
- `packages/server/src/gateway/GameManager.ts:232`
- `packages/server/src/persistence/repository/GameRepository.ts:180`

现状：当前 `GameManager` 保存 snapshot event 时使用 `lastActorId`，`GameRepository.undo()` 同时读取 `actorId ?? lastActorId`。`actorId` 分支没有当前写入方，是旧事件形状兼容。

是否可以删：可以。建议顺手统一命名。

删除方案：

- 要么统一写/读 `actorId`，要么只保留 `lastActorId`。
- 删除另一个字段的读取 fallback。
- 补一个 undo actor 校验测试，确保只识别 canonical 字段。

验证：

- `pnpm --filter @seti/server test -- GameManager.test.ts GameRepository.test.ts`

### 9. lobby create-room 旧参数与 client room option normalize

位置：

- `packages/server/src/lobby/dto/CreateRoomDto.ts:46`
- `packages/server/src/lobby/dto/CreateRoomDto.ts:63`
- `packages/server/src/lobby/dto/CreateRoomDto.ts:104`
- `packages/server/src/lobby/lobby.service.ts:48`
- `packages/client/src/api/lobbyApi.ts:31`
- `packages/client/src/api/lobbyApi.ts:37`
- `packages/client/src/api/lobbyApi.ts:48`
- `packages/server/__tests__/lobby/lobby.controller.test.ts:67`
- `packages/server/__tests__/lobby/lobby.service.test.ts:207`

现状：server DTO 接受 `scenarioPreset` 并丢弃，接受旧 `turnTimerSeconds` 并映射到 `timerPerTurn`。client 也把 `turnTimerSeconds` 当作备选字段，并把 server room response 的多个必填字段当 optional 再补默认。

是否可以删：可以。未 release 项目可以要求 client/server 只使用当前 room option contract。

删除方案：

- 删除 `scenarioPreset`、`turnTimerSeconds` 字段和测试。
- `CreateRoomDto` 要求 `options.playerCount` 或顶层 `playerCount` 的唯一形状，避免双入口。
- client `IServerRoom` 按 `RoomResponseDto` 改成必填，不再从缺失字段推导默认。

验证：

- `pnpm --filter @seti/server test -- CreateRoomDto.test.ts lobby.controller.test.ts lobby.service.test.ts`
- `pnpm --filter @seti/client test -- lobbyApi.test.ts CreateRoomDialog.test.tsx GameSettingsPanel.editable.test.tsx`

### 10. server 内部类型 alias / 测试便利 API

位置：

- `packages/server/src/engine/effects/probe/LandProbeEffect.ts:45`
- `packages/server/src/engine/effects/index.ts:25`
- `packages/server/src/engine/player/Resources.ts:289`
- `packages/server/src/engine/board/BoardBuilder.ts:15`
- `packages/server/src/engine/board/BoardBuilder.ts:30`
- `packages/server/src/engine/board/PlanetaryBoard.ts:66`
- `packages/server/src/engine/board/PlanetaryBoard.ts:78`
- `packages/server/src/engine/board/PlanetaryBoard.ts:206`
- `packages/server/src/engine/effects/probe/LandProbeEffect.ts:36`
- `packages/server/src/engine/effects/probe/LandProbeEffect.ts:408`
- `packages/server/src/engine/board/SolarSystem.ts:862`
- `packages/server/__tests__/engine/board/BoardBuilder.test.ts:59`
- `packages/server/__tests__/engine/cards/CardFrameworkStressTest.test.ts:394`
- `packages/server/__tests__/engine/cards/CardFrameworkStressTest.test.ts:466`

现状：`ILandProbeEffectOptions` / `ILandProbeEffectResult` 是 deprecated alias；`Resources.canAfford()` 是 `has()` 的 alias；`BoardBuilder.buildSolarSystem(nearStars, angles)` 是旧构造 API，当前生产代码未调用，主要旧测试使用。`IOrbitResult.incomeResource` 已被 `rewards` 替代且没有直接读取点；`ILandingCenterReward.lifeTraceGained` 已被 `traceRewards` 替代，但 `LandProbeEffect` 和部分测试 fixture 仍读取旧标量。`SolarSystem.rotateRingByOneStep()` 是 private deprecated 兼容方法，当前没有调用点。

是否可以删：可以，风险低。

删除方案：

- 删除 deprecated type alias 和 barrel export。
- 把 `canAfford()` 调用点改为 `has()`。
- `BoardBuilder` 保留 `buildAll()` / `buildSolarSystemFromRandom()` 或直接让测试用 `SolarSystem.init()`；删除旧 nearStars API 和合成 tile placement。
- 删除 `IOrbitResult.incomeResource`。
- `LandProbeEffect` 从 `traceRewards` 计算需要的结果，或直接删除 `ILandResult.lifeTraceGained`；同步删除 `ILandingCenterReward.lifeTraceGained` 和测试 fixture 里的旧字段。
- 删除未调用的 `rotateRingByOneStep()`。

验证：

- `pnpm --filter @seti/server test -- Resources.test.ts BoardBuilder.test.ts SolarSystem.test.ts`
- `pnpm --filter @seti/server test -- PlanetaryBoard.test.ts LandProbeEffect.test.ts CardFrameworkStressTest.test.ts`
- `pnpm --filter @seti/server typecheck`

### 11. ORBIT/LAND 旧 direct planet flow 与 client `planetActionMode`

位置：

- `packages/client/src/pages/game/GameLayout.tsx:331`
- `packages/client/src/pages/game/GameLayout.tsx:343`
- `packages/client/src/pages/game/GameLayout.tsx:513`
- `packages/server/src/engine/Game.ts:1074`
- `packages/server/src/engine/Game.ts:1119`
- `packages/server/src/engine/Game.ts:1281`

现状：正常流程已经是点击 ORBIT/LAND 主动作后由 server 返回 slot-picker `pendingInput`，再由 pending input 驱动地图热点。但 `GameLayout` 仍保留 `planetActionMode` state，给旧 debug presets / replays 直接 arm 客户端模式使用。server `Game` 也仍接受带 `payload.planet` 的直接 ORBIT/LAND action，并把不带 planet 的 action 视为 picker flow。

是否可以删：可以，但要成组删除。不要只删 client fallback，留下 server direct planet path；也不要只删 server path，导致 debug/replay 或旧测试仍构造 direct action。

删除方案：

- 删除 `planetActionMode` state、`setPlanetActionMode`、legacy `sendAction({ planet })` 分支。
- `effectivePlanetActionMode` 只由 `getSlotPickerMode(pendingInput)` 得出。
- 清理 `TopActionBar` / `BoardTabs` / `AlienBoardView` / `PlanetaryBoardView` 中只为 legacy arming 传递的 props。
- server `Game` 只允许 ORBIT/LAND 主动作无 planet payload，直接 planet 选择统一走 `SelectOption` pending input；debug/replay 若仍需要直接落点，应改成专用 debug endpoint。
- 更新旧 debug preset，让它走当前 server pending input。

验证：

- `pnpm --filter @seti/client test -- GameLayout.test.tsx PlanetaryBoardView.test.tsx AlienBoardView.test.tsx`
- `pnpm --filter @seti/server test -- Game.test.ts GameIntegration.test.ts Land.test.ts Orbit.test.ts`
- ORBIT/LAND 浏览器 smoke 或 E2E。

### 12. client game-over 旧 UI shape

位置：

- `packages/client/src/pages/game/GameOverDialog.tsx:30`
- `packages/client/src/pages/game/GameOverDialog.tsx:45`
- `packages/client/src/pages/game/GameOverDialog.tsx:70`
- `packages/client/__tests__/pages/game/GameOverDialog.test.tsx:34`

现状：当前 public state 有 `finalScoringResult`、`milestones: IPublicMilestoneState`、`goldScoringTiles`。`GameOverDialog` 仍接受旧 `scoreBreakdown`、数组式 `milestones`、预归一化 `goldTiles`。

是否可以删：可以。

删除方案：

- 删除 `extendedState` cast 和 `legacyBreakdown`。
- `normalizeMilestones()` 只接收 `IPublicMilestoneState`。
- 若 GAME_OVER 应总有 `finalScoringResult`，直接在缺失时显示明确错误或退回 player score，但不要支持旧 `scoreBreakdown`。

验证：

- `pnpm --filter @seti/client test -- GameOverDialog.test.tsx`
- `pnpm --filter @seti/client typecheck`

### 13. client sector / solar-system 旧 public state fallback

位置：

- `packages/client/src/features/board/SectorNodeView.tsx:246`
- `packages/common/src/rules/solarSystem.ts:14`
- `packages/common/src/rules/solarSystem.ts:52`
- `packages/common/src/rules/solarSystem.ts:63`
- `packages/client/src/features/board/SolarSystemView.tsx:426`

现状：`SectorNodeView` 仍用 `sector.dataCapability ?? sector.dataSlotCapacity` 渲染旧 debug/snapshot 数据。`common/rules/solarSystem.ts` 在缺少 `planetSpaceIds` / `sectorSpaceIds` / `sectorIndex` 时线性扫描或计算旧数据。`SolarSystemView` 还检查 required `sectorIndex/cellInSector` 是否 undefined。

是否可以删：可以，但要更新 fixtures。当前 protocol 已要求 `spaceStates`、`sectorIndex`、`cellInSector`、`dataCapability`。

删除方案：

- client 直接读取 required 字段，不做旧 shape fallback。
- common helper 直接使用 indexed fields；如果字段缺失，抛出测试可见错误。
- 修所有缺字段 mock，而不是让组件兜底。

验证：

- `pnpm --filter @seti/client test -- SectorView.test.tsx SectorGrid.test.tsx SolarSystemView.test.tsx`
- `pnpm --filter @ender-seti/common test -- solarSystem`

### 14. `/debug/alien` 旧 route alias

位置：

- `packages/client/src/routes.tsx:110`

现状：`/debug/alien` 只 redirect 到 `/debug/replay`。

是否可以删：可以。

删除方案：

- 删除 `debugAlienRoute` 并从 route tree 移除。
- 搜索文档/测试引用 `/debug/alien`，统一改为 `/debug/replay`。

验证：

- `pnpm --filter @seti/client typecheck`
- debug route browser smoke。

### 15. client card normalization 与 server card projection 不一致

位置：

- `packages/client/src/lib/cardNormalization.ts:10`
- `packages/client/src/lib/cardNormalization.ts:26`
- `packages/client/src/hooks/useGameState.ts:3`
- `packages/client/src/hooks/usePlayerInput.ts:3`
- `packages/client/__tests__/lib/cardNormalization.test.ts:10`
- `packages/server/src/persistence/serializer/GameSerializer.ts:1129`

现状：client protocol 类型写的是 `IBaseCard[]`，但 client normalization 明确支持 string id、`{ id }` 和不完整 card object。server public projection 仍可能把 `TCardItem` 原样 cast 给 client。

是否可以删：不能只删 client。这里暴露的是 server/common/client 契约不一致。

修复方案：

- 在 server public serializer 边界把 card row、hand、played cards、pending input cards 全部投影成完整 `IBaseCard`。
- common public types 保持 `IBaseCard[]`，不再让 client 接受 id-only。
- 删除 `cardNormalization.ts` 和对应测试，或缩小为 debug-only normalization。

验证：

- `pnpm --filter @seti/server test -- GameSerializer.test.ts`
- `pnpm --filter @seti/client test -- cardNormalization.test.ts useGameState.test.tsx usePlayerInput.test.tsx`

### 16. CSS/theme legacy design token aliases

位置：

- `packages/client/src/styles/globals.css:21`
- `packages/client/src/styles/globals.css:53`
- `packages/client/src/styles/globals.css:67`
- `packages/client/src/config/theme.ts:67`

现状：`--bg-*`、`--surface-900/800/700`、`--accent-*`、`--danger-500`、`theme.colors.accent/danger` 明确标记为 legacy aliases / back-compat with existing components。

是否可以删：不能直接删；可以机械收敛后删。

删除方案：

- 全局搜索旧 token 引用，替换成 canonical `--surface-*` / `--signal-*`。
- theme 类型删除 `accent` / `danger` alias，调用点改读 `signal.blue` / `signal.red`。
- 做视觉 smoke，避免颜色 token 映射错误。

验证：

- `pnpm --filter @seti/client typecheck`
- touched-file `biome check`
- 主页、lobby、game 页桌面和移动截图 smoke。

### 17. common sector setup 的 top-cell 兼容字段

位置：

- `packages/common/src/constant/sectorSetup.ts:72`
- `packages/common/src/constant/sectorSetup.ts:124`
- `packages/common/src/constant/sectorSetup.ts:371`
- `packages/common/src/rules/solarWheels.ts:63`
- `packages/server/src/engine/board/SolarSystemConfig.ts:87`
- `packages/server/src/engine/board/SolarSystemConfig.ts:93`
- `packages/client/src/pages/game/GameDebugPage.tsx:224`
- `packages/client/src/pages/game/SolarDebugPage.tsx:12`

现状：`ISolarSystemExpandedMapCell.cell` 被注释为兼容 pre-layer 调用方，等价于顶层 `layers[0].cell`。但当前 common helper、server config、client debug 页仍大量读取 `slot.cell`，所以它已经从“旧调用方兼容”变成了当前 API 的冗余字段。

是否可以删：可以，但不能只删类型字段。需要先把当前调用方统一改到 `layers[0].cell` 或封装一个 `getTopExpandedCellLayer()`，再删除冗余 `cell`。

删除方案：

- 在 common 中提供或复用一个读取顶层 layer 的小 helper，避免各处手写 `layers[0]`。
- `solarWheels`、`SolarSystemConfig`、`GameDebugPage`、`SolarDebugPage` 改读 canonical layer。
- 删除 `ISolarSystemExpandedMapCell.cell` 以及 `buildExpandedCells()` 中的冗余赋值。

验证：

- `pnpm --filter @ender-seti/common test -- solarWheels`
- `pnpm --filter @seti/server test -- SolarSystemConfig.test.ts SolarSystem.test.ts`
- `pnpm --filter @seti/client test -- SolarSystemCompareDebugPage.test.tsx`

### 18. scan / land 测试桩兼容路径

位置：

- `packages/server/src/engine/effects/scan/ScanEffectUtils.ts:77`
- `packages/server/src/engine/effects/scan/ScanEffectUtils.ts:92`
- `packages/server/__tests__/engine/effects/probe/BuildLandPlanetSelection.test.ts:16`

现状：`getSectorIndexByPlanet()` 优先使用当前 `SolarSystem.getSectorIndexOfPlanet()`，但仍 fallback 到旧 `getSpacesOnPlanet()` 扫描以支持 duck-typed 测试桩。`BuildLandPlanetSelection.test` 的 helper 也允许旧 key `${planet}:moon`，这是测试夹具兼容而不是生产协议。

是否可以删：可以。未 release 项目没有必要让生产代码服务旧测试桩；测试应改用真实 `SolarSystem` 或实现当前最小接口。

删除方案：

- `getSectorIndexByPlanet()` 直接调用 `solarSystem.getSectorIndexOfPlanet(planet)`，删除旧扫描 fallback。
- 更新相关 scan effect 测试桩，避免只实现 `getSpacesOnPlanet()`。
- `BuildLandPlanetSelection.test` helper 只接受带 `moonId` 的 current key，fixture 明确列出 moon 目标。

验证：

- `pnpm --filter @seti/server test -- ScanEffectUtils.test.ts ScanTechEffects.test.ts ScanWithTechsEffect.test.ts BuildLandPlanetSelection.test.ts`

## 暂不直接删除的兼容样式路径

这些代码带有 legacy/compat 字样，但当前不能作为“纯历史兼容”直接删除：

- `packages/server/src/engine/board/SolarSystemTypes.ts:59` 和 `packages/server/src/engine/board/SolarSystem.ts:479`：`layers?` / pre-layer fallback 看似 legacy，但当前 serializer 没有持久化 `layers`，deserialize 后的当前 snapshot 仍可能走无 layers 路径。要删它，必须先持久化/rebuild layers。
- `packages/server/src/engine/effects/scan/ScanEffect.ts:33`：`useActionPool` 标为 compatibility，但 `ScanWithTechsEffect` 当前仍使用 `useActionPool: false`。删除前要先把 scan tech orchestration 迁到 action pool。
- `packages/server/src/engine/effects/scan/SectorFulfillmentEffect.ts:32`：无 `turnOwner` fallback 主要服务旧单测，生产路径已应传 owner；可删，但要批量更新测试。
- `packages/server/src/engine/effects/probe/OrbitProbeEffect.ts:369`：`claimFirstSlot` 默认 true 的注释用了 legacy，但它仍描述当前卡牌/非主动作的业务行为，不是外部兼容层。
- `packages/server/src/engine/effects/income/TuckCardForIncomeEffect.ts:59`：注释提到 malformed/legacy state，但当前作用是避免 setup tuck pending input 永久卡住；是否改为 throw 是规则健壮性取舍，不应作为历史兼容直接删除。
- `packages/server/src/engine/board/SolarSystem.ts:249`、`packages/server/src/engine/board/SolarSystem.ts:1099`、`packages/client/src/features/board/SolarSystemView.tsx:1400`：这些 legacy 字样描述当前几何映射、printed icon 默认值或 debug 视觉摆位，不是旧协议/旧数据兼容层；最多改注释。
- `packages/server/src/persistence/dto/GameStateDto.ts:363` 和 `packages/server/__tests__/persistence/serializer/GameDeserializer.test.ts:450`：`rivalState?` 不是 multiplayer 旧兼容；非 solo 游戏当前本来没有 rival state，测试名里的 legacy 可以改名。
- `packages/server/src/engine/resolution/PendingResolutionJournal.ts`：versioned journal 是当前冷加载恢复 pending input 的机制，不是旧 snapshot 兼容。可以另行讨论是否保留 `version: 1`，不能删除 journal/replay。
- `packages/server/src/engine/event/EventLog.ts:18` 和 `packages/server/__tests__/engine/event/EventLog.test.ts:65`：测试名提到 legacy persisted events，但 `EventLog` 为缺省 `id/at` 分配单调序号是当前事件写入 API，不应当作为兼容层删除。若要清理，只建议改测试命名。
- `packages/server/__tests__/lobby/lobby.service.test.ts:66`、`packages/server/__tests__/engine/cards/CardEffectsIntegration.test.ts:19`、`packages/server/__tests__/engine/alien/AlienState.test.ts:112`：这些是测试 harness 或回归测试里的历史命名/注释，不是生产兼容层；可以随测试整理改名，但不是优先删除对象。
- `packages/client/src/features/board/SolarSystemView.tsx:1542`：anomaly token art 同时支持 `CARD` 和 `CARD_ANY`。虽然注释说 legacy CARD，但 common/server 当前仍有合法 `CARD` 奖励；不能只在 client 删除。
- `packages/client/src/features/board/PlanetCard.tsx:49`：`TokenDot` 的 legacy 注释更多是渲染/a11y 历史，不是协议兼容；删除前要替换 text-mode moon marker 当前语义。
- `packages/server/src/persistence/repository/GameRepository.ts` 的 snapshot version / prune / undo 逻辑，以及 `turn_checkpoints` 表：这是当前 undo 和 cold-load 机制，不是 release 前可删的历史兼容。
- `/debug/replay`、snapshot debug session、calibration query params：属于当前调试能力。是否删除是产品/debug 取舍，不是历史兼容清理。

## 建议执行批次

### 批次 1：低风险清理

- 删除 deprecated `ILandProbeEffect*` 类型 alias。
- 删除 `/debug/alien` route alias。
- 删除 `GameOverDialog` 旧 `scoreBreakdown/milestones[]/goldTiles` shape。
- 删除 `SectorNodeView` 的 `dataCapability ?? dataSlotCapacity` fallback。
- 删除 round/maxRounds/turnIndex/turnLocked 的旧默认值。
- 删除 rival board legacy id 映射，并把未知 id 改成抛错。
- 删除未调用的 `SolarSystem.rotateRingByOneStep()`。

这批基本只影响旧数据/旧测试，验证成本最低。

### 批次 2：持久化契约收紧

- 删除 `moonIndex` / `moonOccupant`。
- 收紧 `PlayerStateDto` optional 字段。
- 删除 `resourceByType` 双写。
- 删除 tech `bonus` 单值兼容。
- 删除 DB `ensureLegacyBaseline()`。
- 删除 `PlanetaryBoard` / `LandProbeEffect` 的旧 landing/orbit result 字段。

这批需要接受“旧本地 DB / 旧 snapshot JSON 失效”，最好配套一次开发库 reset 或迁移说明。

### 批次 3：client/server 协议统一

- movement 请求强制 `target`，删除 `capsuleId`。
- 删除 `GameLayout.planetActionMode` 旧 arming flow 和 server direct ORBIT/LAND planet payload。
- 删除 lobby `scenarioPreset` / `turnTimerSeconds` / client room response 默认推导。
- server public card projection 输出完整 `IBaseCard` 后删除 client card normalization。

这批要同步 common、server、client，避免两端短暂不一致。

### 批次 4：内部模型重构

- solar-system layer 持久化或 rebuild 后删除 pre-layer fallback。
- scan tech 迁到 action pool 后删除 `useActionPool: false`。
- scan effect 测试改用当前 `getSectorIndexOfPlanet()` 后删除 `getSpacesOnPlanet()` fallback。
- sector fulfillment 测试改为传 `turnOwner` 后删除无 owner fallback。
- sector setup 当前调用方改读 `layers` 后删除 `ISolarSystemExpandedMapCell.cell`。
- CSS/theme token 机械替换后删除 legacy alias。

这批不是单纯删代码，建议单独任务处理。

## 置信度复查

本轮已经做了四轮复查：

1. 显式关键词扫描：`legacy`、`deprecated`、`back-compat`、`older snapshots/saves`、`moonIndex`、`capsuleId`、`resourceByType`、`turnTimerSeconds`、`lifeTraceGained`、`rotateRingByOneStep` 等。
2. 边界扫描：DTO optional 字段、serializer/deserializer 默认值、public state helper fallback、client room/game state normalization。
3. 并行复核：server/persistence 与 client/UI 各由独立 explorer 只读审计，再由主线程打开关键文件确认。
4. 残留关键词复扫：把仍命中的 source 位置逐个归入“可删候选”“需配套重构”或“测试/当前行为误报”。

当前我对这份“候选分类和删除可行性”有事实依据的 100% 信心：每个被列入的候选都有源码位置、兼容原因、删除条件和验证命令；每个明确不应删除的误报也说明了当前依赖原因。真正执行删除时，仍应按批次跑对应测试，因为那是实现变更，不是本报告已经完成的工作。
