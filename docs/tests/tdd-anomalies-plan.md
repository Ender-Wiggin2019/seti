# ANOMALIES TDD 子计划

> 目标：把 `docs/arch/aliens/anomalies.md` 的规则落成可回归的集成测试，优先补齐“旋转触发异常奖励”和“异常列竞争”的真实链路。

---

## 规则基线

- 规则来源（优先级）：`docs/arch/rule-faq.md` > Alien PDF > 现有代码。
- 关键语义：
  - 发现后在外圈按 Earth / Earth+3 / Earth-3 放置 3 个 anomaly token。需要定义好 token 的数据结构，一个 token 有两种 bonus，init实例化的时候每一个会随机选择一种。目前可以先mock，比如 credit/data, energy/publicity, card/4 vp.
  - 每次太阳系旋转后，若 Earth 所在扇区与某 anomaly token 同扇区，立即触发该 token。
  - 触发时按 token 颜色在 anomaly board 对应列比较“最高（位置上最上面）标记”，赢家拿 token 奖励。注意，discovery area 不算，只看board上面的。
  - 若该列无人标记，则本次无奖励。
  - 发现区下方标记不参与异常奖励竞争。
  - anomaly top space 可重复叠放，后放在上。
  - 还需要实现所有的10张对应 alien cards.

---

## 现状审计

- 已有：`packages/server/src/engine/alien/plugins/AnomaliesAlienPlugin.ts` 与 `AnomaliesAlienPlugin.test.ts`，覆盖了基础 discover + 触发奖励 happy path。
- 缺口：
  - 未显式验证 Earth +/- 3 的拓扑约束与扇区数变化边界。
  - 未覆盖“无列标记/仅 neutral/仅 discovery 标记”的跳过路径。
  - token 奖励当前接近硬编码，未锁定“按 token 面值结算”的扩展契约。
  - `ET.11`~`ET.20` 仅完成注册，缺少 anomalies 相关的专用效果实现与回归测试（尤其 `desc.et-*` 与 `any-signal`）。

---

## 异常体卡牌补齐清单（ET.11 - ET.20）

> 来源：`docs/arch/aliens/anomalies.md` + `packages/common/src/data/alienCards.ts` + `packages/common/locales/zh-CN/seti.json` 的翻译描述。

- `ET.11 Signs of Life / 生命迹象`
  - 预期：`LAUNCH` 后，若该探测器位于存在 anomaly 的扇区，额外获得 `MOVE +1`（`desc.et-11`）。
- `ET.12 Close-up View / 近距离观察`
  - 预期：`MOVE 5`，且本回合“通过移动探测器获得宣传”失效（`desc.et-12`）。
- `ET.13 Concerned People / 吃瓜群众`
  - 预期：`PUBLICITY +1` + Full Mission（三个 `TECH_ANY` 节点，奖励依次为 `ENERGY` / `CARD_ANY` / `SCORE +3`）。
- `ET.14 Listening Carefully / 仔细倾听`
  - 预期：`SCAN`，并在“下一个将触发 anomaly”的扇区额外标记 `ANY_SIGNAL`（`desc.et-14`）。
- `ET.15 Part of Everyday Life / 生活常态`
  - 预期：`CARD 3` 后执行两次弃牌子流程：一张按左上角 free-action，另一张按其 income 获得资源（`desc.et-15`）。
- `ET.16 Flooding the Media Space / 全网热搜`
  - 预期：直接从 alien card row 拿走三张牌（`desc.et-16`）。
- `ET.17 Are we Being Observed? / 我们被监视了？`
  - 预期：立即获得“下一个将触发 anomaly”的奖励（`desc.et-17`）+ Quick Mission（本物种红/黄/蓝各 1 trace -> `SCORE +3` 与 `PUBLICITY +2`）。
- `ET.18 Message Capsule / 信息胶囊`
  - 预期：`ROTATE` + `TECH_ANY`（通常由通用效果执行器处理）。
- `ET.19 New Physics / 新物理学`
  - 预期：`TRACE_ANY`（通常由通用效果执行器处理）。
- `ET.20 Amazing Uncertainty / 不可思议`
  - 预期：`ANY_SIGNAL`（任意扇区）后，再按“你在有 anomaly 的扇区中的 signal 数”获得 `SCORE`（每个 +1，`desc.et-20`）。

---

## 测试计划（RED -> GREEN）

### Phase A: Setup 与数据建模

**文件:** `packages/server/__tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts`（扩展）

```text
RED tests:
├── ANO-A1 discover 后恰好创建 3 个 anomaly column（红/黄/蓝）
├── ANO-A2 discover 后恰好创建 3 个 token，位置=Earth, Earth+3, Earth-3（mod 扇区数）
├── ANO-A3 token color 来自 {RED,YELLOW,BLUE} 且三色不重复
└── ANO-A4 同一局重复触发 discover 不重复加 slot（幂等）
```

### Phase B: 旋转触发与奖励竞争

**文件:** `packages/server/__tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts`（扩展）

```text
RED tests:
├── ANO-B1 仅当 Earth 进入 token 扇区时触发；其他扇区不触发
├── ANO-B2 对应颜色列无人标记 -> 不加分，不写异常触发事件
├── ANO-B3 对应颜色列仅 neutral 标记 -> 视为无人可领奖
├── ANO-B4 对应颜色列多玩家叠放，后放置者获胜（栈顶优先）
├── ANO-B5 discovery 位上的标记不参与列竞争
└── ANO-B6 连续两次旋转命中不同颜色 token，分别按各自列独立结算
```

### Phase C: 规则边界与回归锁

**文件:**
- `packages/server/__tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts`
- `packages/server/__tests__/engine/alien/AlienState.test.ts`（必要时补）

```text
RED tests:
├── ANO-C1 未发现状态下 onSolarSystemRotated 不触发
├── ANO-C2 solarSystem/earth space 缺失时安全 no-op（不抛错）
├── ANO-C3 token 奖励可扩展为 VP/PUBLICITY，按 token reward 配置生效
└── ANO-C4 事件日志包含 color/sectorIndex，便于前端回放
```

### Phase D: 异常体卡牌实现补齐（ET.11 - ET.20）

**文件:**
- `packages/server/src/engine/cards/registerDescHandlers.ts`
- `packages/server/src/engine/cards/register/registerAlienCards.ts`
- `packages/server/__tests__/engine/cards/alien/AnomaliesCards.test.ts`（新增）

```text
RED tests:
├── ANO-D1 ET.11 发射后仅在“所在扇区有 anomaly”时额外 +1 MOVE
├── ANO-D2 ET.12 本回合移动不再获得 publicity（含多次移动）
├── ANO-D3 ET.14 额外信号必须落在“下一个触发 anomaly”扇区
├── ANO-D4 ET.15 严格执行“抽3 -> 弃1拿角标 -> 弃1拿income”流程
├── ANO-D5 ET.16 一次性拿走 alien row 的三张牌并正确补/空位处理
├── ANO-D6 ET.17 立即结算“下一个 anomaly 奖励”，并保留其快速任务结算
├── ANO-D7 ET.20 可在任意扇区标记 signal（补齐 any-signal 的执行器能力）
├── ANO-D8 ET.20 计分仅统计“有 anomaly 的扇区中的己方 signal”
├── ANO-D9 ET.13/18/19 继续通过（防回归，验证通用执行器路径）
└── ANO-D10 无 anomaly 或下一个 anomaly 不可判定时，相关 desc 安全 no-op
```

---

## 实现注意点（配合 TDD）

- anomaly 调试 / 回放链路统一走 [`docs/tests/debug-replay.md`](</Users/oushuohuang/Documents/demo-a2ui/docs/tests/debug-replay.md>) 定义的 replay preset 机制，不再单独扩散新的 debug 页面。
- 若要支持“按 token 面值奖励”，奖励结构应放在 `common`（遵守 monorepo 复用约束）。
- 列竞争建议只读取 anomaly-column slots，避免 discovery/overflow 被误计。
- 旋转触发应由统一 hook 进入（`AlienState.onSolarSystemRotated`），不要在行动里分散触发。
- `ET.11/14/17/20` 都依赖“下一个/当前 anomaly 扇区”判定，建议提取 `AnomalyResolver`（server）并将纯计算结构抽到 `common` 复用。

---

## 完成标准

- 上述 ANO-A/B/C/D 全部 GREEN。
- `pnpm --filter @seti/server test -- AnomaliesAlienPlugin.test.ts` 通过。
- `pnpm --filter @seti/server test -- AnomaliesCards.test.ts` 通过。
- 与现有 `ResolveDiscovery`、`Pass`、`ResearchTech` 测试不冲突。
