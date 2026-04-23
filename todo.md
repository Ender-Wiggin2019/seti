# Debug Replay / Snapshot Replay — TODO

## 已完成

- [x] Server 测试：anomaly-discovery preset 全链路覆盖（12 个测试）
- [x] Server 测试：DB snapshot 引擎级 round-trip（5 个测试）
- [x] Common 类型：`IDebugSnapshotSessionRequest` / `IDebugSnapshotSessionResponse`
- [x] Server 实现：`DebugService.createSnapshotSession()` + controller endpoint
- [x] Client API：`debugApi.createSnapshotSession()`
- [x] Client UI：DebugReplayPage 增加 "Load from Snapshot" 区域
- [x] E2E 测试：snapshot replay happy path
- [x] 路由：`/debug/replay` 和 `/debug/alien` 均已注册

## 未完成

### 高优先级

1. **`createSnapshotSession` 缺少持久化**
   - 文件：`packages/server/src/debug/debug.service.ts`
   - 问题：与 `createServerSession` / `createReplaySession` 不同，snapshot session 没有调用 `gameRepository.create(game)`，导致游戏仅存在于内存。如果 cache 驱逐触发 `unloadGame` 尝试写 snapshot，会因为 DB 中没有 game 父记录而可能触发外键约束错误。
   - 修复：加上 `try/catch` 包裹的 `gameRepository.create(game)` 调用，与其他 session 方法保持一致。

2. **Service 层测试缺失**
   - 文件：需新建或扩展 `packages/server/__tests__/debug/` 下的测试
   - 问题：`createSnapshotSession` 的 DB 加载路径（mock `GameRepository`）、`GAME_NOT_FOUND` 错误抛出、`debugSessionRegistry.register` 调用均未被测试覆盖。
   - 目前只有引擎级 round-trip 测试，没有 service 集成测试。

3. **Pre-existing 测试失败（4 个）**
   - `__tests__/engine/cards/CardFrameworkStressTest.test.ts` — 3 failures
   - `__tests__/engine/effects/probe/ProbeEffectUtils.test.ts` — 1 failure
   - 根因：`game.solarSystem.getPlanetLocation is not a function`
   - 这是 feature/server 分支上的已有问题，与 replay 功能无关，但需要修复。

### 中优先级

4. **Snapshot session 的 humanPlayer 固定为 seat 0**
   - 文件：`packages/server/src/debug/debug.service.ts` line ~280
   - 问题：从 snapshot 加载的游戏，观察视角总是第一个玩家。如果 snapshot 时活跃玩家不是 seat 0，debug session 的视角会不对。
   - 建议：增加可选的 `viewerPlayerId` 字段到 `IDebugSnapshotSessionRequest`，或者默认使用 `game.activePlayer`。

5. **E2E 测试覆盖不足**
   - `debug-snapshot-replay.spec.ts` 只有 happy path
   - 缺少：无效 gameId 的错误提示、指定 version 加载、snapshot HUD 元数据验证、加载后的交互操作（end turn / main action）
   - `debug-replay.spec.ts` 缺少：切换 preset 后字段更新、"New Replay" 按钮返回表单

6. **Oumuamua 没有 debug replay preset**
   - 文件：`packages/server/src/debug/debugReplayPresets.ts`
   - 目前只有 anomaly-discovery 和 anomaly-trigger 两个 preset
   - Oumuamua 插件逻辑复杂（tile signal、exofossil、trace columns），需要专门的 replay preset 来调试

### 低优先级

7. **Client 端 version 输入无校验**
   - 文件：`packages/client/src/pages/game/DebugReplayPage.tsx`
   - 问题：version 输入框允许负数、小数、0 等无效值，虽然不会崩溃但会产生不友好的错误信息

8. **`/debug/alien` 和 `/debug/replay` 路由重复**
   - 两个路由指向同一个 `DebugReplayPage` 组件
   - E2E 测试中混用了两个路径（第一个测试用 `/debug/alien`，第二个用 `/debug/replay`）
   - 建议统一为一个路由，或者给 `/debug/alien` 加上默认 preset 选中逻辑

9. **`IDebugReplayFieldDefinition.kind` 只支持 `'select'`**
   - 如果未来需要 text input 等其他字段类型，需要扩展为 union type
