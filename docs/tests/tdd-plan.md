# SETI 完整规则 TDD 实施计划

> 基于 `docs/arch/rule-simple.md`、`rule-raw.md`、`rule-tech.md`、`rule-faq.md`、`prd-rule.md` 的完整规则，
> 对照现有 `packages/server/__tests__/` 已有测试覆盖 + Mock 审计结果，识别缺口并制定 TDD 计划。

---

## 初始测试 Mock 审计（历史）

> 本节保留计划启动时的 mock 审计结果，用于解释后续 TDD 拆分来源；当前完成状态以各 Phase 的“回归覆盖”小节和“当前收尾状态”为准。

### 测试质量评级

| 评级 | 含义 |
|------|------|
| **INTEGRATION** | 通过 `Game.create()` + `processMainAction` 走完整引擎管线 |
| **GOOD** | 测试真实代码，仅在不可避免处使用 stub |
| **MIXED** | 部分测试用真实引擎，部分用手工构造的假 `IGame` |
| **MOCK-HEAVY** | 大量 mock 绕过核心规则逻辑，测的是"胶水代码"而非规则 |

### 初始测试 Mock 问题汇总

| 文件 | 评级 | 核心 Mock 问题 |
|------|------|---------------|
| `LaunchProbe.test.ts` | MIXED | 手工 `IGame` stub（`planetaryBoard: null`, `sectors: []`）；不走 `processMainAction` |
| `Orbit.test.ts` | INTEGRATION | 手动 `placeProbe` + 直接设 `probesInSpace`，绕过移动流程 |
| `Land.test.ts` | INTEGRATION | 同 Orbit；`resolveAllInputs` 始终选第一项，绕过生命痕迹选择分支 |
| `Scan.test.ts` | **MOCK-HEAVY** | 手工 `IGame`（`solarSystem: null`）；`missionTracker: { recordEvent: () => undefined }`；`cardRow` 为假对象；不测真实 data token 流转 |
| `AnalyzeData.test.ts` | **MOCK-HEAVY** | 手工 `IGame`；不测蓝色 trace 标记流程；不测与 alien discovery 的联动 |
| `PlayCard.test.ts` | **MOCK-HEAVY** | `mainDeck.discard: vi.fn()`；假手牌 `['card-1','card-2']`；不测卡牌费用/效果/任务路由 |
| `ResearchTech.test.ts` | MIXED | `vi.spyOn(techBoard, 'getAvailableTechs').mockReturnValue([])`；stub `mainDeck`；不走 `processMainAction` |
| `Pass.test.ts` | MIXED | `solarSystem: { rotateNextDisc: vi.fn() }`；`alienState: { onSolarSystemRotated: vi.fn() }`；mock 旋转不验证物理结果 |
| `Movement.test.ts` | MIXED | `missionTracker: { recordEvent: vi.fn() }`；线性空间测试，非真实棋盘 |
| `PlaceData.test.ts` | MIXED | `mainDeck: { drawN(...) { ... } }` stub；不测 data pool 上限 6 |
| `CompleteMission.test.ts` | **MOCK-HEAVY** | `missionTracker` 全部 stub；**无 happy-path 测试**，完全不测真实任务完成 |
| `FreeActionCorner.test.ts` | MIXED | `missionTracker: { recordEvent: vi.fn() }`；只测了 1 种卡牌角效果 |
| `ExchangeResources.test.ts` | GOOD | 规则说可从展示区或牌堆取牌，实现只走牌堆（规则 vs 实现偏差） |
| `RotateDiscEffect.test.ts` | **MOCK-HEAVY** | `solarSystem.rotateNextDisc: vi.fn(() => 2)`；完全不测真实盘面旋转/探测器移动 |
| `ResolveDiscovery.test.ts` | **MOCK-HEAVY** | 只测 no-op 路径（`getNewlyDiscoverableAliens()` 始终空）；从未执行真实发现 |
| `Milestone.test.ts` | INTEGRATION | `Game.create()` + 真实 `EventLog`；含 3p 顺序与 Gold/Neutral 全覆盖（Phase 7 回归） |
| `FinalScoring.test.ts` | INTEGRATION | `Game.create()` 真实 `sectors` / `alienState`；Phase 9.1/9.3 终局与流程项已回归（截至 2026-04-21） |
| `GoldScoringTile.test.ts` | INTEGRATION | `Game.create()` + 真实 `Sector` / trace 测试铺状态 helper；扇区胜场写入 `game.sectors[].sectorWinners` |
| `BehaviorExecutor.test.ts` | **MOCK-HEAVY** | `game.mark` 只 push 到 `__markCalls`；`techBoard.getAvailableTechs: () => []` |
| `MissionTracker.test.ts` | **MOCK-HEAVY** | 手工 `IMissionDef`；不测"打出后才能触发"规则；不测"一效果一空位" |
| `TechMissionCards.test.ts` | MIXED | 直接调 `checkCondition!(player, game)` 绕过 tracker/event 流；不测 trigger 时序 |
| `ObservationQuickMissionCard.test.ts` | **MOCK-HEAVY** | `vi.fn()` mock `sector.markSignal`；`missionTracker` stub |
| `TuckCardForIncomeEffect.test.ts` | MIXED | 缺少系统性收入累积验证；不测 base + tucked 叠加 |
| 30+ 单卡测试（cards/base/*.test.ts） | MIXED~MOCK-HEAVY | 多数直接调 `card.execute()` 或手工构造 game，不走 `processMainAction(PLAY_CARD)` |

---

## 初始计划总览（历史）

计划启动时共拆分 **10 个阶段（Phase）**，按依赖关系排序。表中“需重写/需补”保留为初始风险说明，不代表当前存在后续实施项；当前状态以文末覆盖表为准。

| Phase | 主题 | 预估用例 | 优先级 | 说明 |
|-------|------|---------|--------|------|
| 1 | Setup 规则验证 | ~15 | P0 | 扩展已有 |
| 2 | 主行动 — 集成测试补全 | ~90 | P0 | **8 个 MOCK-HEAVY/MIXED 需重写 + 错误路径 + 卡牌抽检** |
| 3 | 自由行动 — 规则细节补全 | ~55 | P0 | **CompleteMission 重写 + MissionTracker 重写 + 错误路径** |
| 4 | 太阳系旋转 — 真实物理验证 | ~12 | P0 | **RotateDiscEffect 需用真实 SolarSystem** |
| 5 | 扇区完成 — 完整结算 | ~13 | P1 | 扩展已有 |
| 6 | 生命痕迹与外星发现 | ~18 | P1 | **ResolveDiscovery 需从零写真实路径** |
| 7 | 里程碑系统 — 完整规则 | ~15 | P1 | 需补 3+ 人顺序 + 全流程 |
| 8 | 科技系统 — 12 种科技完整效果 | ~20 | P1 | 新建 |
| 9 | 终局计分 — 完整公式 | ~16 | P2 | 需补 alien 评分 + 真实 sector 数据 |
| 10 | 全流程集成 — 5 轮仿真 + 收入 | ~20 | P2 | 新建（含收入系统独立测试） |
| **总计** | | **~274** | | |

---

## Phase 1: Setup 规则验证

**规则来源:** rule-simple §2, prd-rule §5
**初始覆盖:** `GameSetup.test.ts` — INTEGRATION/GOOD；细节已补齐，当前状态见本节“回归覆盖”。

### 1.1 共享棋盘 Setup

**文件:** `__tests__/engine/GameSetup.test.ts` (扩展)

```
RED tests:
├── 1.1.1 太阳系布局必须形成 8 个有效扇区，每个扇区恰好 1 颗 nearby star
├── 1.1.2 随机选择 2 个外星种族（从 5 个候选中），隐藏面朝下
├── 1.1.3 主牌堆洗牌后翻出 3 张作为展示区（card row）
├── 1.1.4 每颗 nearby star 的 data slot 被填满数据 token
├── 1.1.5 金色计分牌随机一面朝上放置
├── 1.1.6 中立里程碑设置：
│   ├── 2人: 20 和 30 各 2 个中立标记
│   ├── 3人: 20 和 30 各 1 个中立标记
│   └── 4人: 无中立里程碑
├── 1.1.7 12 种科技各自 4 张洗牌成堆，面朝下，每堆顶部放 2VP tile
├── 1.1.8 4 个回合末牌堆，每堆 = 玩家数 + 1 张
└── 1.1.9 旋转提醒 token 放置正确（科技板 + 第 1 回合末牌堆）
```

### 1.2 玩家 Setup

**文件:** `__tests__/engine/GameSetup.test.ts` (扩展)

```
RED tests:
├── 1.2.1 每个玩家初始声望 = 4
├── 1.2.2 初始资源：4 信用、3 能量、5 张随机牌
├── 1.2.3 必须塞入 1 张牌作为初始收入
├── 1.2.4 分数标记按座位顺序：P1=1, P2=2, P3=3, P4=4
├── 1.2.5 起始收入卡翻面，从第 2 回合起提供基础收入
└── 1.2.6 初始声望 = 4（验证 publicity track 起始位置）
```

### 回归覆盖（截至 2026-04-21）

**执行摘要:** Phase 1 已完成。所有 15 个测试通过（GameSetup.test.ts）。

**新增测试:**
- 1.1.3: 验证 card row 正确初始化为 3 张不重复的卡牌
- 1.1.4: 验证每个 sector 的 data slot 完全填满（dataCount = capacity）
- 1.2.5: 验证 base income 初始化为 2 credits + 1 energy（**RED → GREEN 实现**）
- 1.2.6: 验证所有玩家 publicity 起始值为 4

**实现改动:**
- `Income.ts`: 新增 `addBaseIncome(resource, amount)` 方法
- `GameSetup.ts`: 在玩家初始化时设置 base income（2 credits + 1 energy）

**锁定内容（规则验证）:**
1. **共享棋盘 Setup:**
   - 太阳系必须形成 8 个有效扇区
   - 随机选择 2 个非 DUMMY 外星种族隐藏
   - 主牌堆洗牌后翻出 3 张到 card row
   - 每个 sector 的 data slot 完全填满 data tokens
   - 4 个金色计分牌随机朝向
   - 中立里程碑按人数设置（2p: 2+2, 3p: 1+1, 4p: 无）
   - 12 种科技各 4 张洗牌，每堆顶部 2VP tile
   - 4 个回合末牌堆，每堆 playerCount+1 张
   - rotation reminder index 初始为 0

2. **玩家 Setup:**
   - 初始 publicity = 4
   - 初始资源：4 credits, 3 energy
   - 抽 5 张牌，其中 1 张自动 tuck 为初始收入
   - 分数标记按座位序（P1=1, P2=2...）
   - base income 为 2 credits + 1 energy（从第 2 回合起生效）

---

## Phase 2: 主行动 — 集成测试补全

**规则来源:** rule-simple §5, rule-raw §MAIN ACTIONS, rule-faq

> **初始关键发现:** Scan、AnalyzeData、PlayCard 曾被评为 MOCK-HEAVY，LaunchProbe/ResearchTech/Pass 曾为 MIXED。
> 对应集成测试和边界回归已按本节各小节的“回归覆盖”逐项补齐。

### 2.1 Launch Probe — 升级为 INTEGRATION

**文件:** `__tests__/engine/actions/LaunchProbe.test.ts` (扩展)

**Mock 问题:** 手工构造 `IGame`（`planetaryBoard: null`, `sectors: []`），不走 `processMainAction`

```
RED tests (通过 Game.create + processMainAction):
├── 2.1.1 [集成] processMainAction(LAUNCH_PROBE) 完整流程：扣 2 信用 → 探测器放 Earth → probesInSpace+1
├── 2.1.2 [集成] 行星板上的 orbiter/lander 不计为"在太空" — 需先 orbit 后再 launch
├── 2.1.3 [集成] 拥有 probe tech(num=0) 后可连续 launch 2 次
├── 2.1.4 [集成] 信用不足 2 时 processMainAction 抛出 GameError
└── 2.1.5 [集成] 已达上限时 processMainAction 抛出 GameError
```

### 2.1E Launch Probe — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.1E.1 [错误] 信用不足时 canExecute = false 且 processMainAction 抛出 GameError
├── 2.1E.2 [错误] 在太空探测器已达上限时 canExecute = false
└── 2.1E.3 [错误] 非当前玩家尝试 launch 被拒绝
```

**回归覆盖（校准截至 2026-04-24）**

- 已覆盖：`2.1.1` 已由 `2.1.1 spends 2 credits, places probe on Earth, increments probesInSpace` 锁定完整主行动路径；`2.1.3` 已由 `integration: double-probe tech allows launching again on a later turn until two probes are in space` 覆盖真实跨回合二次发射。
- 已覆盖：`2.1.4`/`2.1E.1` 已由 `2.1.4 throws GameError when credits are below 2` + `canExecute` 信用边界组覆盖；`2.1.5`/`2.1E.2` 已由 `2.1.5 throws GameError when probesInSpace has reached the limit` + `canExecute` 上限边界组覆盖。
- 已覆盖：`2.1E.3` 已由 `2.1E.3 rejects launch attempted by a non-active player` 覆盖。
- 已覆盖：`2.1.2` 已由 `2.1.2 after real ORBIT, orbiter does not count toward probesInSpace (third launch with double-probe tech)` 与 `2.1.2 after real LAND, lander does not count toward probesInSpace (third launch with double-probe tech)` 覆盖真实 orbit / land 后再 launch 的上限语义。

### 2.2 Orbit — 补全 mock 绕过的边界

**文件:** `__tests__/engine/actions/Orbit.test.ts` (扩展)

**Mock 问题:** 手动 `placeProbe` + 直接设 `probesInSpace` 绕过移动

```
RED tests:
├── 2.2.1 [边界] 探测器在地球上时不能 orbit
├── 2.2.2 [边界] 没有探测器在任何行星格时 canExecute = false
├── 2.2.3 [集成] orbit 后轨道奖励的具体行星奖励验证（每个行星）
├── 2.2.4 [集成] orbit 提供收入增加 — 验证 tucked income 效果
└── 2.2.5 [集成] 多人 orbit 同一行星 — 首个 +3VP，后续无
```

### 2.2E Orbit — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.2E.1 [错误] 探测器在地球上时 canExecute = false
├── 2.2E.2 [错误] 没有探测器在任何行星空间时 canExecute = false
├── 2.2E.3 [错误] 信用或能量不足时 canExecute = false
└── 2.2E.4 [错误] 非当前玩家尝试 orbit 被拒绝
```

**回归覆盖（校准截至 2026-04-24）**

- 已覆盖：`2.2.1`/`2.2E.1` 已由 `does not allow orbiting while the only probe is still on Earth` 覆盖，既验证 `canExecute=false`，也验证 `processMainAction` 抛出 `INVALID_ACTION`。
- 已覆盖：`2.2.2`/`2.2E.2` 已由 `rejects orbit when no own probe is on selected planet` 覆盖；`2.2E.4` 已由 `rejects orbit attempts from a non-active player even with a valid probe` 覆盖。
- 已覆盖：`2.2.3` 已由 `2.2.3 first orbit grants +3 VP and a distinct orbit income bonus per planet` 覆盖每个行星的首轨道奖励矩阵。
- `spends resources, moves probe from space, and grants first orbit bonus` 覆盖了真实 orbit 成功路径、扣费、从太阳系移除探测器、写入 `orbitSlots`、以及首个 orbiter 的 `+3 VP`。
- `only grants +3 VP for the first orbiter on a planet` 覆盖了多人同一行星时“首个 +3VP、后续无奖励”，对应 `2.2.5`。
- 已覆盖：`2.2E.3` 已由 `returns false when credits or energy are insufficient even with a valid planet probe` 覆盖。
- 已覆盖：`2.2.4` 已由 `2.2.4 orbit increases tucked income (round payout) without drawing or tucking hand cards` 覆盖 orbit 收入增长与 tucked income 结算语义。

### 2.3 Land — 补全 mock 绕过的边界

**文件:** `__tests__/engine/actions/Land.test.ts` (扩展)

**Mock 问题:** `resolveAllInputs` 始终选第一项，绕过 trace 选择

```
RED tests:
├── 2.3.1 [集成] 着陆获得 life trace 时，验证 trace 放到正确的发现位
├── 2.3.2 [集成] Mars 2 个首着陆位 — 第 1 人选位，第 2 人占另一位，第 3 人无首着陆 data
├── 2.3.3 [集成] FAQ: 对手 orbiter 也算折扣 — 2 人游戏 A orbit Venus, B land Venus 费用 2
├── 2.3.4 [集成] probe tech(num=2) + orbiter 折扣 叠加 = 3-1-1 = 1 能量
├── 2.3.5 [集成] 月球着陆也享受折扣 — FAQ 明确
└── 2.3.6 [集成] FAQ: orbiter 不可再着陆
```

### 2.3E Land — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.3E.1 [错误] 能量不足时 canExecute = false
├── 2.3E.2 [错误] 没有探测器在非地球行星空间时 canExecute = false
├── 2.3E.3 [错误] 无科技时尝试月球着陆被拒绝
└── 2.3E.4 [错误] 月球 slot 已满时着陆被拒绝
```

**回归覆盖（校准截至 2026-04-24）**

- 已覆盖：`2.3.1` 已由 `lets the player place a landing life trace onto the selected discovery slot` 覆盖，显式验证 trace 输入、选位分支、未选 discovery slot 保持为空。
- 已覆盖：`2.3.2` 已由 `gives Mars first-land data only to the first two landers` 覆盖，包含 3 人顺序、前两位拿 data、第三位无 bonus。
- 已覆盖：`2.3.3` 已由 `uses reduced landing cost when any orbiter is already present` 覆盖，确认“对手 orbiter 也算折扣”。
- 已覆盖：`2.3.4` 已由 `applies orbiter and rover discounts together when landing on a moon` 覆盖，锁定 `3 - 1 - 1 = 1` 的折扣叠加语义。
- 已覆盖：`2.3.5` 已由 `applies orbiter and rover discounts together when landing on a moon` + `allows landing on moon with probe moon tech even when moon is locked` 覆盖月球折扣与月球科技路径。
- 已覆盖：`2.3.6` 已由 `does not let an existing orbiter land later on the same planet` 覆盖。
- 已覆盖：`2.3E.1` 已由 `returns false when landing energy is insufficient for the current discount state` 覆盖；`2.3E.2` 已由 `returns false when there is no probe on a non-Earth planet to land with` 覆盖。
- 已覆盖：`2.3E.3`/`2.3E.4` 已由 `enforces moon unlock and single occupancy through Land action` 覆盖，前半段锁定无科技不可登月，后半段锁定月球格单占位。

### 2.4 Scan — **从 MOCK-HEAVY 升级为 INTEGRATION**

**文件:** `__tests__/engine/actions/Scan.test.ts` (重大扩展)

**Mock 问题:**
- `solarSystem: null` / `missionTracker: noop` / `cardRow` 为假对象
- 不测真实 data token 流转、data pool、2VP scoring、sector completion

```
RED tests (全部通过 Game.create + processMainAction):
├── 2.4.1 [集成] 费用：扣 1 信用 + 2 能量
├── 2.4.2 [集成] 地球扇区标记信号 → 取走最左 data token → 放入 data pool → 放置标记
├── 2.4.3 [集成] 展示区弃牌 → 对应扇区标记信号 → data 流转正确
├── 2.4.4 [集成] 放在第二个 data slot 时立即 +2 VP
├── 2.4.5 [集成] 超出 slot 容量的额外标记：无 data 但标记存在
├── 2.4.6 [集成] 扫描触发 sector completion → deferred 结算
├── 2.4.7 [集成] 扫描完成后才补牌（不是弃牌时立即补）
├── 2.4.8 [集成] 标记信号是强制的（FAQ）
├── 2.4.9 [集成] data pool 满 6 时再获得 data 必须弃掉
└── 2.4.10 [集成] missionTracker 正确记录 SIGNAL_PLACED 事件
```

### 2.4E Scan — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.4E.1 [错误] 信用或能量不足时 canExecute = false
└── 2.4E.2 [错误] 展示区为空时仍可执行（仅标地球扇区信号）
```

**回归覆盖（截至 2026-04-24）**

- 已覆盖：`2.4.1`/`2.4.2` 已由 `integration: mark-earth uses the real solar-system sector and grants +1 data` 覆盖，锁定真实太阳系扇区映射、资源扣费、data token 消耗、玩家信号落点与数据入账。
- 已覆盖：`2.4.3`/`2.4.7` 已由 `integration: refills the card row only after the scan is fully resolved` 覆盖，锁定“先弃展示区牌并保留 2 张，再在 `done` 后补回 3 张”的时序。
- 已覆盖：`2.4.4` 已由 `integration: the second earth-sector data slot awards +2 VP in the same scan when both marks target it` 覆盖；`integration: projected state dataPoolCount increases after mark-earth` 额外锁定了投影视图中的 `dataPoolCount` 更新。
- 已覆盖：`2.4.5` 已由 `appends a player marker without data/VP gain when the sector has no data tokens left` 覆盖，锁定“无 data 但仍可落额外信号”的容量边界。
- 已覆盖：`2.4.6` 已由 `resolves the sector (winner recorded, reset) after the scan finishes` 覆盖，锁定 scan 结束后触发真实 `SectorFulfillmentEffect` deferred 结算。
- 已覆盖：`2.4.8` 已由 `does not offer DONE until MARK_EARTH has been executed` + `offers DONE after MARK_EARTH is executed` 覆盖，锁定 Earth 标记的强制性。
- 已覆盖：`FAQ 时序` 已由 `allows PLACE_DATA between SCAN sub-actions, then resumes SCAN to DONE` 覆盖，锁定“自由行动可打断主行动（SCAN）但主行动可继续完成”。
- 已覆盖：`2.4.10` 已由 `MarkSectorSignalEffect.test.ts` 中的 `marks sector, emits mission event, and applies data reward` 锁定 `SIGNAL_PLACED` 事件；`GameIntegration.test.ts` 中的 `emits SCAN_PERFORMED mission event` 锁定主行动级 mission 事件。
- 已覆盖：`2.4E.1` 已由 `ScanAction.canExecute` 边界组 + `GameIntegration.test.ts` 中的 `rejects when credits are zero` / `rejects when energy is insufficient` 覆盖。
- 已覆盖：`2.4E.2` 已由 `offers only MARK_EARTH when card row is empty, and scan completes after it` 覆盖。
- 已覆盖：`2.4.9` 已由 `marks the signal but discards scan data when data pool is already at max` 锁定；规则结论为 `rule-simple §6.2` / `rule-raw` 所述的“data pool 上限 6，超出 data 直接弃掉”，实现中 `Data.gain()` 不再把超出 data 写入 stash。

### 2.5 Analyze Data — **从 MOCK-HEAVY 升级为 INTEGRATION**

**文件:** `__tests__/engine/actions/AnalyzeData.test.ts` (重大扩展)

**Mock 问题:**
- 手工 `IGame`；不测蓝色 trace 标记；不测与 alien discovery 联动

```
RED tests (全部通过 Game.create + processMainAction):
├── 2.5.1 [集成] 费用 1 能量 + top row 全满才能执行
├── 2.5.2 [集成] 执行后清空电脑所有数据（top + bottom）
├── 2.5.3 [集成] data pool 不受影响
├── 2.5.4 [集成] 标记 1 个蓝色 trace → 选择哪个外星 → 放到发现位/overflow
├── 2.5.5 [集成] 蓝色 trace 放到发现位时 +1 声望 + 5 VP
├── 2.5.6 [集成] 蓝色 trace 触发 alien discovery → deferred 结算
├── 2.5.7 [集成] FAQ: 下排可以空 — 只需 top row + tech top 填满
└── 2.5.8 [集成] 分析后电脑空，可立即放新 data
```

### 2.5E Analyze Data — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.5E.1 [错误] 能量不足时 canExecute = false
├── 2.5E.2 [错误] top row 未满时 canExecute = false
└── 2.5E.3 [错误] 电脑完全为空（无 data）时 canExecute = false
```

**回归覆盖（截至 2026-04-17）**

- 已覆盖：`2.5.1` 已由 `returns true when computer is full and energy >= 1`、`returns false when there is no energy` 与 `integration: analyze data clears the connected computer and prompts for a blue trace placement` 组合锁定，覆盖 top row 满格 + 1 能量门槛。
- 已覆盖：`2.5.2` 已由 `clears computer data` 与上述 integration 用例覆盖，确认执行后电脑数据清空。
- 已覆盖：`2.5.3` 已由 `integration: analyze data leaves the data pool and stash untouched while clearing computer data` 覆盖。
- 已覆盖：`2.5.4` 已由 `integration: analyze data clears the connected computer and prompts for a blue trace placement`、`integration: when blue discovery slots are occupied, analyze data falls back to overflow placement` 覆盖，锁定 discovery/overflow 两条选位路径。
- 已覆盖：`2.5.5` 已由 `integration: choosing a blue discovery slot grants +5 VP and +1 publicity on the left alien board` 覆盖。
- 已覆盖：`2.5.6` 已由 `integration: completing Anomalies discovery via analyze data applies the discovery plugin effect` 覆盖，确认通过 Analyze Data 走到 discovery deferred/plugin 效果。
- 已覆盖：`2.5.7` 已由 `integration: top row can be full while bottom slots stay empty and the action remains legal` 覆盖。
- 已覆盖：`2.5.8` 已由 `integration: after analyze data clears the computer, the player can immediately place new data` 覆盖。
- 已覆盖：`2.5E.1`/`2.5E.2`/`2.5E.3` 已由 `AnalyzeDataAction.canExecute` 边界组、`GameIntegration.test.ts` 中的非法路径，以及 `returns false when the computer is completely empty` 覆盖。

### 2.6 Play Card — **从 MOCK-HEAVY 升级为 INTEGRATION**

**文件:** `__tests__/engine/actions/PlayCard.test.ts` (重大扩展)

**Mock 问题:**
- `mainDeck.discard: vi.fn()`；假手牌；不测卡牌费用/效果/任务路由

```
RED tests (全部通过 Game.create + processMainAction):
├── 2.6.1 [集成] 支付卡牌费用 → 执行效果 → 普通牌进弃牌堆
├── 2.6.2 [集成] 效果包含其他行动时不支付该行动费用
│   └── 示例：卡牌给 Launch 效果时不扣 2 信用
├── 2.6.3 [集成] 任务牌打出后留在玩家面前
├── 2.6.4 [集成] 终局计分牌打出后留在玩家面前
├── 2.6.5 [集成] 条件任务 — 打出时已满足可立即完成
├── 2.6.6 [集成] 条件任务 — 可推迟完成
├── 2.6.7 [集成] 触发任务 — 打出前的事件不触发
├── 2.6.8 [集成] 触发任务 — 打出后事件触发并盖圈
├── 2.6.9 [集成] 触发任务 — 每个圈只能盖一次
├── 2.6.10 [集成] 触发任务 — FAQ: 一个效果多奖励时一次只盖一个
├── 2.6.11 [集成] 触发任务 — 所有圈盖完后自动完成
└── 2.6.12 [集成] FAQ: 必须先完全结算主效果才能完成任务
```

### 2.6E Play Card — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.6E.1 [错误] 手牌中无该卡时 processMainAction 抛出 GameError
├── 2.6E.2 [错误] 费用不足时 processMainAction 抛出 GameError
└── 2.6E.3 [错误] 同一张牌不能同时做主行动和自由行动
```

**回归覆盖（截至 2026-04-24）**

- 已覆盖：`2.6.1` 已由 `integration: ordinary immediate cards pay their own cost, apply their effect, and go to discard` 覆盖，锁定支付费用、执行即时效果、进入弃牌堆、并在结算后交接回合。
- 已覆盖：`2.6.2` 已由 `integration: launch-effect cards do not charge the normal launch action cost` 覆盖，确认卡牌授予的 Launch 不额外扣 2 信用。
- 已覆盖：`2.6.5` 已由 `2.6.5 completes an already-satisfied quick mission immediately from the play-card prompt` 覆盖，锁定即时完成、奖励结算、任务移入 `completedMissions`。
- 已覆盖：`2.6.6` 已由 `2.6.6 keeps an already-satisfied quick mission completable after the player skips the play-card prompt` 覆盖，锁定跳过后下回合仍可通过自由行动完成。
- 已覆盖：`2.6.12` 已由 `2.6.5` / `2.6.6` 两条 Lovell Telescope 集成路径覆盖：卡牌 Scan 主效果的选项输入先完成，之后才出现 quick mission complete/skip prompt。
- 已覆盖：`2.6.7` 已由 `integration: a full mission card does not trigger from its own play event` 锁定“注册当下不会被自身事件立即触发”；相邻的 `StrategicPlanningCard.test.ts` 还锁定了 `events before mission registration do not trigger branches`。
- 已覆盖：`2.6E.2` 已由 `integration: insufficient resources rejects the play without mutating turn state` 覆盖，确认失败时手牌、phase、active player、eventLog 都不漂移。
- 已覆盖：`2.6E.1` 已由 `2.6E.1 rejects PLAY_CARD when declared cardId does not match the hand slot (stale client selection)` 覆盖“指定 cardIndex 指向一张当前已不在手里的真实卡 / 过期客户端选择”的主行动级回归；`GameIntegration.test.ts` 仍覆盖越界、负数、空手牌等输入边界。
- 已覆盖：`2.6.3`/`2.6.4` 已由 `a played mission card stays in front of the player and is not discarded` 与 `a played end-game scoring card stays in front of the player and is not discarded` 覆盖。
- 已覆盖：`2.6.8`/`2.6.9` 已由 `a trigger mission registered earlier stamps exactly one circle on a later matching CARD_PLAYED` 覆盖，锁定真实 `processMainAction(PLAY_CARD)` 路径下的单分支盖圈与其余分支不被推进。
- 已覆盖：`2.6.11` 已由 `completing the final trigger branch moves the mission to completedMissions automatically` 覆盖，锁定最后一格完成后自动翻面/移出 `playedMissions`。
- 已覆盖：`2.6E.3` 已由 `a card discarded via the free-action corner cannot also be played as a main action the same turn` 覆盖。
- 已覆盖：`2.6.10` 已由 `2.6.10 one DISPLAY_CARD effect placing two signals offers only one Control Center branch until the next trigger` 覆盖主行动级“一效果多奖励一次只盖一个圈”的 FAQ 语义。

### 2.7 Research Tech — 升级为 INTEGRATION

**文件:** `__tests__/engine/actions/ResearchTech.test.ts` (扩展)

**Mock 问题:**
- `vi.spyOn(techBoard, 'getAvailableTechs').mockReturnValue([])`
- stub `mainDeck`；不走 `processMainAction`

```
RED tests (通过 Game.create + processMainAction):
├── 2.7.1 [集成] 6 声望 → 旋转太阳系 → 选科技 → 获取 — 完整流程
├── 2.7.2 [集成] 旋转时探测器随盘移动（真实 SolarSystem）
├── 2.7.3 [集成] 不能重复拥有同一种科技 — 真实 TechBoard 验证
├── 2.7.4 [集成] 首个拿取 → 2VP tile 弃掉 + 立即 +2 VP
├── 2.7.5 [集成] 即时奖励（能量/data/声望等）正确结算
├── 2.7.6 [集成] 蓝科技放到已有 data 的 slot — 不计为放置 data
├── 2.7.7 [集成] 卡牌效果授予科技 — 不付声望但仍旋转
└── 2.7.8 [集成] 已有该科技时忽略但仍旋转
```

### 2.7E Research Tech — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 2.7E.1 [错误] 声望不足 6 时 canExecute = false
├── 2.7E.2 [错误] 已拥有全部 12 种科技时 canExecute = false
└── 2.7E.3 [错误] 选择已拥有的同种科技被拒绝
```

**回归覆盖（截至 2026-04-24）**

- 已覆盖：`2.7.1` 已由 `happy-path acquire loop` 覆盖，锁定付 6 声望、旋转、选择科技并真正写入玩家面板/TechBoard 的主行动闭环。
- 已覆盖：`2.7.2` 已由 `research rotation moves probes with the real solar system disc` 覆盖，锁定研究科技时真实 `SolarSystem` 旋转会移动现有探测器。
- 已覆盖：`2.7E.1` 已由 `returns false without enough publicity` 与 `GameIntegration.test.ts` 中的 `rejects when publicity is insufficient` 覆盖。
- 已覆盖：`2.7.3`/`2.7E.2`/`2.7E.3` 已由 `the chosen techId is removed from the available list after acquisition`、`full-board guard`，以及直接 `acquireTech` duplicate rejection 组合锁定；主行动路径下重复科技不会再出现在可选列表中。
- 已覆盖：`2.7.4`/`2.7.5` 已由 `first-taker collects the 2VP tile bonus` 与 `tile bonus applies immediate resource/VP rewards` 覆盖。
- 已覆盖：`2.7.6` 已由 `computer tech placement does not count as placed data` 覆盖，锁定蓝科技 placement 只创建 bottom slot、不填 top slot、不增加 placedCount。
- 已覆盖：`2.7.7` 已由 `card-effect path skips the 6-publicity cost but still rotates` 覆盖。
- 已覆盖：`2.7.8` 已由 `duplicate specific-tech card effects are ignored but still rotate` 覆盖，并对应实现为 card-effect specific tech 在已拥有时 `no-op + rotate`。

### 2.8 Pass — 升级为 INTEGRATION

**文件:** `__tests__/engine/actions/Pass.test.ts` (扩展)

**Mock 问题:**
- `solarSystem.rotateNextDisc: vi.fn()` 完全 mock 旋转
- `alienState.onSolarSystemRotated: vi.fn()`

```
RED tests (通过 Game.create + processMainAction):
├── 2.8.1 [集成] Pass 前可做自由行动（buy card → pass）
├── 2.8.2 [集成] 弃牌至 4 张 — 多于 4 张时触发选择
├── 2.8.3 [集成] 首个 pass → 真实太阳系旋转 → 探测器位置变化
├── 2.8.4 [集成] 第 5 回合首 pass 仍旋转，token 被弃
├── 2.8.5 [集成] 末牌堆选牌 → 最后一人选 1 弃 1
├── 2.8.6 [集成] 所有人 pass → 回合结束 → 收入 → 起始玩家轮转
└── 2.8.7 [集成] 非首 pass 不触发旋转
```

**回归覆盖（截至 2026-04-24）**

- 已覆盖：`2.8.2` 已由 `returns SelectCard when hand exceeds limit` 与 `chains discard → end-of-round card selection` 覆盖，锁定超过 4 张时先弃牌，再进入回合末选牌链路。
- 已覆盖：`2.8.3` 已由 `Pass.test.ts` 中的 `rotates the solar system on the first pass of the round`、`GameIntegration.test.ts` 中的 `first pass of the round triggers solar system rotation`，以及 `GameFlowBehavior.test.ts` 中的 `8b. after rotation: Earth→cell-4, Asteroid→cell-3, Venus→cell-2` 组合覆盖，已经锁定真实盘面旋转而不只是 spy 调用。
- 已覆盖：`2.8.5` 已由 `returns SelectEndOfRoundCard when stack is available`、`chains discard → end-of-round card selection` 与 `the last passing player takes one card and leaves exactly one unclaimed in the stack` 覆盖，锁定最后一人选 1 后末牌堆只剩 1 张未领取牌。
- 已覆盖：`2.8.6` 已由 `GameIntegration.test.ts` 中的 `all players pass ends round`、`round-end income is applied each round`、`start player rotates each round`，以及 `GameFlowBehavior.test.ts` 中的 `24. both players passed → round end, income applied` / `25. round 2: p2 is now start player and active player` 组合覆盖。
- 已覆盖：`2.8.7` 已由 `does not rotate the solar system on the second pass of the same round`、`does not dispatch the alien rotation hook on the second pass of the same round`，以及 `GameFlowBehavior.test.ts` 中的 `23b. second pass of the round does not trigger another disc rotation` 覆盖。
- 已覆盖：`2.8.1` 已由 `allows a BUY_CARD free action immediately before PASS` 覆盖。
- 已覆盖：`2.8.4` 的“第 5 回合首 pass 仍旋转”已由 `first pass of round 5 still rotates the solar system even without end-of-round cards` 锁定；“reminder token 被弃”在当前模型中没有独立可观测状态，已接受由 `roundRotationReminderIndex=4` + 无可选末牌行为体现，不作为后续实施项。

### 2.9 BehaviorExecutor — **从 MOCK-HEAVY 升级为 INTEGRATION**

**文件:** `__tests__/engine/cards/BehaviorExecutor.test.ts` (重大扩展)

**Mock 问题:**
- `game.mark` 只 push 到 `__markCalls`；`techBoard.getAvailableTechs: () => []`
- 不测真实卡牌行为执行链路

```
RED tests (全部通过 Game.create + 真实卡牌):
├── 2.9.1 [集成] 执行 gain 效果 — 真实资源变化（credit/energy/publicity/VP）
├── 2.9.2 [集成] 执行 action 效果 — 嵌套 Launch/Orbit/Land/Scan 走真实引擎
├── 2.9.3 [集成] 执行 mark 效果 — 放置 life trace 到真实 alien board
├── 2.9.4 [集成] 执行 conditional 效果 — 条件满足 vs 不满足两条路径
├── 2.9.5 [集成] 多步骤 behavior 按顺序执行，中间步骤失败不影响已执行步骤
├── 2.9.6 [错误] 无效 behavior type 抛出 GameError
└── 2.9.7 [集成] behavior 执行过程中正确触发 missionTracker 事件
```

**回归覆盖（截至 2026-04-20）**

- 已覆盖：`2.9.1` 已由 resource bundle / composite ledger 回归锁定，覆盖真实资源、分数、移动与 income 变化。
- 已覆盖：`2.9.2` 已由 launch / orbit / rotate / draw 的真实引擎路径锁定，其中 orbit 走真实行星选择与 `planetaryBoard` 写入。
- 已覆盖：`2.9.3`/`2.9.4` 已由 `research tech runs against the real TechBoard`、`markTrace dispatches through AlienState` 与 `alienState unavailable fallback` 组合覆盖。
- 已覆盖：`2.9.5` 已由 `composite behavior runs all steps in order` 覆盖，锁定多步骤顺序执行。
- 已清理：legacy `__markCalls` mock suite 已删除；活跃断言全部保留在 integration 路径。
- **2.9.6 产品决策已确认（校准截至 2026-04-24）：** 无效 behavior type 采用**容错策略**（不抛错，不阻塞游戏）
  - ✅ 后端：记录 `CARD_CUSTOM_EFFECT_UNHANDLED` 事件到 event log（已实现）
  - ✅ 前端：`GameLayout` 监听该事件并展示 toast；`common.json` 已补齐 en / pt-BR / zh-CN 文案
  - 规则依据：rule-simple/rule-raw/rule-faq 均未明确要求抛错；容错策略更符合桌游"忽略无法执行效果"的惯例

### 2.10 卡牌效果 — 集成抽检

**文件:** `__tests__/engine/cards/CardEffectsIntegration.test.ts` (新建)

**说明:** 现有 30+ 张单卡测试大多通过手工构造 game 或直接调用 `card.execute()`。
本阶段不逐一重写，而是**抽检代表性卡牌**通过 `processMainAction(PLAY_CARD)` 走完整管线。

```
RED tests (全部通过 Game.create + processMainAction(PLAY_CARD)):
├── 2.10.1 [集成] 探测器类卡牌 — 效果包含 Launch，不额外扣费
├── 2.10.2 [集成] 望远镜类卡牌 — 效果包含 Scan 信号，真实 sector 状态变化
├── 2.10.3 [集成] 资源类卡牌 — gain credit/energy/data 真实结算
├── 2.10.4 [集成] 科技类卡牌 — 效果授予科技，触发旋转 + 即时奖励
├── 2.10.5 [集成] 多效果卡牌 — 按顺序执行，每步状态一致
├── 2.10.6 [集成] 普通牌打出后进弃牌堆，手牌数 -1
├── 2.10.7 [集成] 手牌中无该卡时 processMainAction 抛出 GameError
└── 2.10.8 [集成] 费用不足时 processMainAction 抛出 GameError
```

**回归覆盖（截至 2026-04-20）**

- 已覆盖：`2.10.1-2.10.8` 均已落到 `CardEffectsIntegration.test.ts`。
- 已锁定：`130` 走 card-granted launch 不额外收主行动 launch 费用；`55` 锁定真实 sector signal 变化；`110` 锁定资源即时结算与弃牌。
- 已锁定：`71` 与 `109` 在 tech-choice prompt 前都只发生一次旋转（由 card/effect 的 `ROTATE` 触发）。
- 备注：`docs/arch/rule-faq.md` 已加项目注记，当前仓库采用“只有显式 `ROTATE` 才旋转”的实现语义。

---

## Phase 3: 自由行动 — 规则细节补全

**规则来源:** rule-simple §6, rule-raw §FREE ACTIONS, rule-faq

### 3.1 Movement 补全

**文件:** `__tests__/engine/freeActions/Movement.test.ts` (扩展)

**Mock 问题:** `missionTracker: { recordEvent: vi.fn() }`；线性空间而非真实棋盘

```
RED tests:
├── 3.1.1 [集成] 在真实棋盘上移动 — 非对角邻接验证
├── 3.1.2 [集成] 离开小行星格额外 +1 移动点消耗
├── 3.1.3 [集成] probe tech(num=1): 忽略小行星额外 +1
├── 3.1.4 [集成] 经过声望图标格立即获得声望（不停留）
├── 3.1.5 [集成] 不能进入或穿过太阳
├── 3.1.6 [集成] FAQ: 多移动点可分配给不同探测器
├── 3.1.7 [集成] FAQ: 同回合再次经过同一行星仍获声望
├── 3.1.8 [集成] probe tech(num=1): 进入小行星格获得声望
└── 3.1.9 [集成] 移动触发 missionTracker 真实事件记录
```

### 3.1E Movement — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.1E.1 [错误] 无移动点时不能移动
├── 3.1E.2 [错误] 移动到非邻接格被拒绝
├── 3.1E.3 [错误] 移动到太阳格被拒绝
└── 3.1E.4 [错误] 对角移动被拒绝
```

### 3.2 Place Data 补全

**文件:** `__tests__/engine/freeActions/PlaceData.test.ts` (扩展)

**Mock 问题:** `mainDeck` 为 stub `drawN`；不测 data pool 上限

```
RED tests:
├── 3.2.1 [集成] 从左到右放置数据
├── 3.2.2 [集成] 放到有效果的格子时立即结算（用真实 Deck 验证抽牌）
├── 3.2.3 [集成] 科技列上格必须先填才能填下格
├── 3.2.4 [集成] data pool 上限 6，超出丢弃
├── 3.2.5 [集成] FAQ: 不能中断正在结算的放置效果
├── 3.2.6 [集成] comp-0 上格 2VP + 下格 +1 信用
├── 3.2.7 [集成] comp-1 上格 2VP + 下格 +1 能量
├── 3.2.8 [集成] comp-2 上格 2VP + 下格 抽 1 张牌
└── 3.2.9 [集成] comp-3 上格 2VP + 下格 +2 声望
```

### 3.2E Place Data — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.2E.1 [错误] data pool 为空时不能放置
├── 3.2E.2 [错误] 电脑所有可用格已满时不能放置
└── 3.2E.3 [错误] 尝试跳过上格直接填下格被拒绝
```

**回归覆盖（截至 2026-04-21）**

- ✅ 所有12个测试（9主路径 + 3错误路径）全部GREEN
- ✅ 使用真实`Game.create()`和`mainDeck`，移除所有stub
- ✅ 验证data pool上限6（`DataPool.add()`自动丢弃超出部分）
- ✅ 验证四种computer tech类型的top 2VP + bottom reward
- ✅ 验证FAQ规则：放置效果结算期间禁止其他自由行动
- ✅ 验证top row强制从左到右填充（实现新增验证逻辑）
- ✅ 老测试修复：mock game增加`lockCurrentTurn()`方法
- 总测试数：30（19旧 + 12新 - 1移除）

### 3.3 Complete Mission — **从 MOCK-HEAVY 重写**

**文件:** `__tests__/engine/freeActions/CompleteMission.test.ts` (重写)

**Mock 问题:** `missionTracker` 全部 stub；**无 happy-path**

```
RED tests (全部通过真实 Game + processFreeAction):
├── 3.3.1 [集成] 打出条件任务 → 满足条件 → 作为自由行动完成 → 获得奖励
├── 3.3.2 [集成] 条件未满足时 canExecute = false
├── 3.3.3 [集成] 可推迟完成（条件满足但不立即完成）
└── 3.3.4 [集成] 完成后任务牌翻面
```

### 3.3E Complete Mission — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.3E.1 [错误] 条件未满足时 canExecute = false
├── 3.3E.2 [错误] 已完成的任务牌不能重复完成
└── 3.3E.3 [错误] 非自己回合不能完成条件任务
```

### 回归覆盖（截至 2026-04-21）

**执行摘要:** Phase 3.3 已完成。所有测试通过（CompleteMission.test.ts）。

**新增测试:**
- 3.3.3: 验证可推迟完成 — 条件满足后玩家可选择不立即完成，下回合仍可完成
- 3.3.4: 验证完成后任务牌从 `playedMissions` 移动到 `completedMissions`
- 3.3E.2: 验证已完成的任务牌不能重复完成（抛出 "not completable" 错误）

**已覆盖（来自 legacy suite）:**
- 3.3.1: 由 legacy "integrates real mission play..." 测试覆盖（play card '37' → satisfy red sectors → complete → gain 4VP + 1 publicity）
- 3.3.2 / 3.3E.1: 由 legacy "keeps canExecute false for an unmet..." 测试覆盖
- 3.3E.3: 由 legacy "rejects completing a satisfied quick mission outside the owner turn" 测试覆盖

**删除内容:**
- 已删除 `describe.skip('legacy - mock-heavy suite')` 块（8 个 mock-heavy 测试）
- 删除原因：新测试已覆盖所有有效断言，通过真实引擎验证规则行为

**实现 bug 修复记录:**
- `MissionReward.ts`: 修复 trace reward 未处理的 bug（Agent A5 已修复）
  - 问题：mission reward 中的 trace 类型未被正确处理
  - 修复：添加 trace reward 处理逻辑到 `MissionReward.applyReward()`

**锁定内容（规则验证）:**
1. **条件任务完成流程:**
   - 必须先打出任务牌（存在于 `playedMissions` 中）
   - 条件满足时 `canExecute` 返回 `true`
   - 可推迟完成（不强制立即完成）
   - 完成后获得奖励（分数、资源等）
   - 任务牌从 `playedMissions` 移动到 `completedMissions`
   - `missionTracker` 中的任务状态被移除

2. **错误处理:**
   - 条件未满足时 `canExecute` 返回 `false`
   - 已完成的任务不能重复完成
   - 非当前玩家不能完成任务（抛出 "not the active player" 错误）
   - 未打出的任务不能完成（抛出 "not completable" 错误）

3. **触发任务特殊处理:**
   - 触发任务在所有分支盖完后自动完成（不需要自由行动）
   - 触发任务提示期间禁止使用 `COMPLETE_MISSION` 自由行动（抛出 `INVALID_INPUT_RESPONSE`）

### 3.4 Free-Action Corner 补全

**文件:** `__tests__/engine/freeActions/FreeActionCorner.test.ts` (扩展)

**Mock 问题:** `missionTracker: vi.fn()`；只测了 1 种角效果

```
RED tests:
├── 3.4.1 [集成] 弃牌执行 MOVE 角效果 — 获得移动点
├── 3.4.2 [集成] 弃牌执行 PUBLICITY 角效果 — 获得信用
├── 3.4.3 [集成] 弃牌执行 DATA 角效果 — 获得能量
├── 3.4.5 [集成] 同一张牌不能既主行动又自由行动
└── 3.4.6 [集成] 角效果触发 missionTracker 真实事件
```

### 3.4E Free-Action Corner — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.4E.1 [错误] 手牌为空时不能使用角效果
└── 3.4E.2 [错误] 同一张牌不能既打出又弃掉做角效果
```

**✅ 回归覆盖（截至 2026-04-21）**

- **文件:** `FreeActionCorner.test.ts` — 全部使用 `Game.create` + 真实 `mainDeck` / `missionTracker`（已移除 `missionTracker` mock）。
- **3.4.1–3.4.3:** 分别用卡牌 `39`（MOVE +1）、`68`（PUBLICITY +1）、`99`（DATA +1）断言资源/移动点变化与弃牌入堆。
- **3.4.5 / 3.4E.2:** 主行动打出 `68` 后，同一张牌不可再用于 `USE_CARD_CORNER`。
- **3.4.6:** 打出 Cornell `138` 后，弃角 `68` / `99` / `39` 分别触发任务提示选项 `complete-138-0/1/2`（真实 `processFreeAction` + checkpoint Drain）。
- **3.4E.1:** 空手牌时 `processFreeAction(USE_CARD_CORNER)` 抛 `INVALID_ACTION`。
- **文案勘误:** 计划草稿中 3.4.2/3.4.3 写「信用/能量」；数据卡 `68`/`99` 实际对应 **PUBLICITY / DATA**（见 `baseCards.ts`）。

### 3.5 Buy Card 补全

**文件:** `__tests__/engine/freeActions/BuyCard.test.ts` (扩展)

```
RED tests:
├── 3.5.1 费用：3 声望
├── 3.5.2 可从展示区或牌堆顶获取
├── 3.5.3 从展示区取后立即补充
└── 3.5.4 牌堆空时重新洗弃牌堆
```

### 3.5E Buy Card — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.5E.1 [错误] 声望不足 3 时 canExecute = false
└── 3.5E.2 [错误] 展示区 + 牌堆都为空时处理（edge case）
```

**✅ 回归覆盖（截至 2026-04-21）**

- **文件:** `BuyCard.test.ts` 保留原有 `BuyCardFreeAction.execute` 单测；新增 **`Phase 3.5 — integration (Game.create)`** 组。
- **3.5.1:** `processFreeAction(BUY_CARD, fromDeck: true)` 声望 −3。
- **3.5.2:** `cardId` 指定从展示区取牌；`fromDeck: true` 从抽牌堆顶取（与 `peek(1)` 一致）。
- **3.5.3:** 购买后展示区长度仍为 3（立即补牌）。
- **3.5.4:** 抽牌堆空、弃牌堆有牌时 `drawWithReshuffle` 购牌成功。
- **3.5E.1:** 声望 2 → `canExecute === false` 且 `processFreeAction` 抛 `INSUFFICIENT_RESOURCES`。
- **3.5E.2:** 展示区与主牌堆（含弃牌）皆无可购来源时，购牌抛 `INVALID_ACTION`（用例：清空 `cardRow` + 空 `Deck`）。

### 3.6 Exchange Resources 补全

**文件:** `__tests__/engine/freeActions/ExchangeResources.test.ts` (扩展)

**规则对齐（2026-04-21）:** `rule-simple` §6.6 与买牌一致，换入的牌可来自展示区或牌堆顶；引擎已支持 `fromDeck` / 默认「有展示区则取左起第一张并补牌」，与 `BuyCard` 补牌语义一致。协议 `IExchangeResourcesFreeActionRequest` 增加可选 `fromDeck` / `cardId`；客户端交换对话框对「换入卡牌」拆成展示区 / 牌堆两个按钮。

```
RED tests:
├── 3.6.1 2 信用 / 2 能量 / 2 张牌 → 换取 1 信用 / 1 能量 / 1 张牌
├── 3.6.2 获取牌时走真实 Deck 路径
└── 3.6.3 不能同类型换同类型
```

### 3.6E Exchange Resources — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.6E.1 [错误] 资源不足 2 时 canExecute = false
└── 3.6E.2 [错误] 同类型换同类型被拒绝
```

**✅ 回归覆盖（截至 2026-04-21）**

- **文件:** `ExchangeResources.test.ts` — 单元测覆盖换入牌 **展示区 / 牌堆**（`fromDeck: false` 左起取牌 + 补牌；`fromDeck: true` 无视展示区）；**`Game.create`** 组覆盖 3.6.1 全链路、`processFreeAction` 拒绝同类型交换、资源不足门槛。
- **3.6E.1 / 3.6E.2:** `execute` 与集成路径分别覆盖资源不足与同类型交换。
- **输出为牌且无可抽来源:** 在扣费前 `assertCanGainExchangedCard` 抛错（展示区空且牌堆+弃牌空）。

### 3.7 MissionTracker — **从 MOCK-HEAVY 升级为 INTEGRATION**

**文件:** `__tests__/engine/missions/MissionTracker.test.ts` (重大扩展)
+ `__tests__/engine/cards/base/TechMissionCards.test.ts` (扩展)
+ `__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts` (重大扩展)

**Mock 问题:**
- `MissionTracker.test.ts`: 手工 `IMissionDef`；不测"打出后才能触发"；不测"一效果一空位"
- `TechMissionCards.test.ts`: 绕过 tracker/event 流，直接调 `checkCondition!(player, game)`
- `ObservationQuickMissionCard.test.ts`: `vi.fn()` mock `sector.markSignal`；`missionTracker` stub

```
RED tests (全部通过 Game.create + processMainAction/processFreeAction):
├── 3.7.1 [集成] 触发任务 — 打出前的事件不触发（event 时间戳 < mission 登记时间）
├── 3.7.2 [集成] 触发任务 — 打出后事件正确触发并盖圈
├── 3.7.3 [集成] 一效果一空位 — 一个 Scan 放 2 信号，只盖 1 个 SIGNAL_PLACED 圈
├── 3.7.4 [集成] 所有圈盖完 → 自动完成 → 获得奖励
├── 3.7.5 [集成] 条件任务 — 通过 tracker 检查条件满足状态
├── 3.7.6 [集成] 非本回合事件（如对手行动触发的 trigger mission）
├── 3.7.7 [集成] 科技任务 — 拥有指定数量科技时条件满足（真实 TechBoard）
├── 3.7.8 [集成] 观察快速任务 — 通过真实 Scan 放置标记触发
├── 3.7.9 [集成] FAQ: 一个效果产生多个奖励时，一次只盖一个圈
├── 3.7.10 [集成] 多张任务牌同时触发 — 按打出顺序结算
├── 3.7.11 [错误] 未打出的任务牌不能作为自由行动完成
└── 3.7.12 [错误] 已完成的任务牌不能重复完成
```

**回归覆盖（截至 2026-04-21）:**
- ✅ `MissionTracker.test.ts`: 删除 legacy skip suite (11 个 mock-heavy 测试)，新增 12 个集成测试（3.7.1-3.7.12）
- ✅ `TechMissionCards.test.ts`: 保留 legacy suite (96 个单元测试)，新增 3 个集成扩展测试
- ✅ `ObservationQuickMissionCard.test.ts`: 保留 legacy suite (3 个测试)，新增 2 个集成扩展测试
- ✅ 所有测试通过真实引擎（Game.create + processMainAction/processFreeAction），移除 mock/stub
- ✅ 验证"打出后才触发"、"一效果一空位"、"时间戳过滤"等 FAQ 规则

---

## Phase 4: 太阳系旋转 — **真实物理验证**

**规则来源:** rule-simple §5.7, rule-raw §Rotating the Solar System

### 4.1 RotateDiscEffect — **从 MOCK-HEAVY 升级**

**文件:** `__tests__/engine/effects/solar/RotateDiscEffect.test.ts` (重大扩展)

**Mock 问题:** `solarSystem.rotateNextDisc: vi.fn(() => 2)` 完全 mock；不测物理旋转

```
RED tests (用真实 BoardBuilder 构造 SolarSystem):
├── 4.1.1 [集成] 旋转顶层盘 — 验证空间位置变化
├── 4.1.2 [集成] 旋转中层盘 — 验证空间位置变化
├── 4.1.3 [集成] 旋转底层盘 — 验证空间位置变化
├── 4.1.4 [集成] 探测器随盘旋转 — 位置跟随变化
├── 4.1.5 [集成] 探测器被挤到下一有效格
├── 4.1.6 [集成] 挤移过程中经过声望图标 → 获得声望
└── 4.1.7 [集成] alienState.onSolarSystemRotated 被真实调用
```

**✅ 回归覆盖（截至 2026-04-21）**

- ✅ 已删除 legacy mock-heavy suite（6 个旧测试）
- ✅ 7 个新集成测试全部通过，使用真实 `BoardBuilder.buildSolarSystemFromRandom()`
- ✅ 覆盖物理旋转：disc 角度变化、probe 位置跟随、挤移逻辑、publicity 获取
- ✅ 覆盖 alienState 回调真实调用
- ✅ 无 mock `rotateNextDisc`，完全集成测试


### 4.2 旋转触发时机 — 集成验证

**文件:** `__tests__/engine/board/SolarSystem.test.ts` (扩展)

```
RED tests:
├── 4.2.1 [集成] 研究科技（主行动）触发旋转
├── 4.2.2 [集成] 卡牌效果授予科技也触发旋转
├── 4.2.3 [集成] 每回合首 pass 触发旋转
├── 4.2.4 [集成] 非首 pass 不触发旋转
└── 4.2.5 rotationCounter 循环推进（top → middle → bottom → top）
```

**✅ 回归覆盖（截至 2026-04-21）:**

- ✅ 5 个新集成测试全部通过，验证旋转触发时机的真实物理行为
- ✅ 4.2.1: RESEARCH_TECH 主行动触发旋转 → 探测器物理移动到下一格
- ✅ 4.2.2: 卡牌带 ROTATE 图标触发旋转 → 探测器物理移动（卡牌 59）
- ✅ 4.2.3: 每回合首次 PASS 触发旋转 → 探测器物理移动
- ✅ 4.2.4: 非首次 PASS 不触发旋转 → 探测器位置不变
- ✅ 4.2.5: rotationCounter 循环 0→1→2→0，验证嵌套盘级联旋转（disc 1 旋转 rings 1+2，disc 2 旋转 rings 1+2+3）
- ✅ 覆盖真实引擎流程：`Game.create` + `processMainAction` + `processEndTurn`
- ✅ 覆盖多玩家回合交替场景（P1 → P2 → P1）

---

## Phase 5: 扇区完成 — 完整结算

**规则来源:** rule-simple §5.4, rule-raw §Completing a Sector, §Resetting the Sector

**文件:** `__tests__/engine/deferred/ResolveSectorCompletion.test.ts` + `__tests__/engine/board/Sector.test.ts` (扩展)
+ `__tests__/engine/effects/scan/SectorFulfillmentEffect.test.ts` (扩展)

```
RED tests:
├── 5.1 最后一个 data token 被取走时扇区标记为完成
├── 5.2 [集成] 通过 processMainAction(SCAN) 触发 sector completion → deferred 结算
├── 5.3 多数标记者赢得扇区
├── 5.4 平局打破规则：后放置的标记者获胜
├── 5.5 每个至少贡献 1 个标记的玩家获得 +1 声望
├── 5.6 赢家在 nearby star 旁放置标记，获得显示奖励
├── 5.7 确定第二名（同样的平局打破规则）
├── 5.8 第二名在扇区第一个 slot 留下 1 个标记
├── 5.9 归还所有其他标记给玩家
├── 5.10 空出的 slot 重新填充 data token
├── 5.11 扇区可以被再次赢得（后续胜者使用 overflow slot，较少奖励）
├── 5.12 超出 slot 的额外标记也计入多数
└── 5.13 多个扇区同时完成时玩家可选择结算顺序
```

**回归覆盖（截至 2026-04-21）:**
- ✅ `Sector.test.ts`: 已覆盖 5.1, 5.3, 5.4, 5.7, 5.8, 5.10, 5.11, 5.12（22 个测试）
  - 5.1: "sets completed=true when all data displaced" (line 130-142)
  - 5.3: "selects winner by marker majority" (line 169-186)
  - 5.4: "breaks ties by rightmost position (later-placed wins)" (line 188-205)
  - 5.7: "breaks second-place ties by later-placed rule (3-player scenario)" (line 282-300)
  - 5.8: "resets sector after resolution with second-place at position 0" (line 207-229)
  - 5.10: "refills data to capacity and clears markers" (line 313-328)
  - 5.11: "tracks multiple winners across completion cycles" + "isFirstWin is false on repeat win" (line 231-276)
  - 5.12: "allows marking beyond capacity — extra markers append with no data gain" (line 70-91)
- ✅ `SectorFulfillmentEffect.test.ts`: 已覆盖 5.5, 5.6, 5.9, 5.13（16 个测试）
  - 5.5: "awards +1 publicity to all participants" (line 61-80)
  - 5.6: "applies first-win bonus to the sector winner" + "applies repeat-win bonus on second completion" (line 153-242)
  - 5.9: "returns every marker to the winner and non-second-place participants" + "returns all extra markers of the second-place player except the one kept on slot 0" (line 249-308)
  - 5.13: "prompts the turn owner to pick the resolution order and respects the pick" (line 315-379)
- ✅ `ResolveSectorCompletion.test.ts`: 集成测试验证 deferred queue 流（2 个测试）
- ✅ `Scan.test.ts`: 已覆盖 5.2（标记为 "2.4.6 completing a sector via scan triggers deferred resolution", line 272-310）
- ✅ 所有测试通过真实引擎（Game.create / Sector.resolveCompletion），无 mock/stub
- ✅ 验证完整流程：markSignal → isFulfilled → resolveCompletion → winner/2nd-place → reset → publicity/bonus

---

## Phase 6: 生命痕迹与外星发现

**规则来源:** rule-simple §5.3/§8, rule-raw §Marking Life Traces/§Discovering Alien Species

### 6.1 Life Trace 标记

**文件:** `__tests__/engine/alien/LifeTrace.test.ts` (新建)

```
RED tests:
├── 6.1.1 [集成] 获得生命痕迹图标 → 放到对应颜色发现位
├── 6.1.2 [集成] 两个对应位已满且种族未发现 → overflow
├── 6.1.3 [集成] 发现位 +1 声望 + 5 VP
├── 6.1.4 [集成] overflow 位 3 VP
├── 6.1.5 [集成] universal trace 充当任意颜色
├── 6.1.6 [集成] overflow 标记计入"已标记痕迹"检查
├── 6.1.7 [集成] alien board 额外位不需按顺序填
└── 6.1.8 [集成] 可选择任何未占据的对应颜色空间
```

**回归覆盖（截至 2026-04-21）:**
- ✅ `LifeTrace.test.ts`: 新建文件，19 个集成测试覆盖 8 个规则场景
- ✅ 测试通过真实 `Game.create()` + `AlienState` 真实流程
- ✅ 验证发现位奖励（+1 声望 + 5 VP）、overflow 奖励（3 VP）、universal trace 通配、trace 计数
- ✅ 验证多外星选择、动态额外位、占用排除逻辑
- ✅ 所有 63 个 alien 相关测试通过（包括 AlienState.test.ts 30 个既有测试）

### 6.2 Alien Discovery — **从 no-op 重写为完整测试**

**文件:** `__tests__/engine/deferred/ResolveDiscovery.test.ts` (重大扩展)

**Mock 问题:** 只测 no-op（`getNewlyDiscoverableAliens()` 始终空）

```
RED tests (全部通过真实 AlienState + plugin):
├── 6.2.1 [集成] 3 个发现位全满 → getNewlyDiscoverableAliens 返回该种族
├── 6.2.2 [集成] 发现在里程碑之后结算
├── 6.2.3 [集成] 发现流程：翻转种族板 + 应用设置 + 奖励填写者
├── 6.2.4 [集成] 中立标记也计入发现条件
├── 6.2.5 [集成] overflow 标记不获得发现奖励
├── 6.2.6 [集成] 发现后 alien cards 可被获取
├── 6.2.7 [集成] Exertian 牌不计入手牌上限
├── 6.2.8 [集成] 中立标记只占 6 个基础发现位
├── 6.2.9 [集成] 两个种族在同一回合都被发现
└── 6.2.10 [集成] 发现后 alien board 额外位可被标记
```

**回归覆盖（截至 2026-04-24）:**
- ✅ `ResolveDiscovery.test.ts`: 删除 legacy skip suite (1 个 no-op 测试)，新增 9 个集成测试（6.2.1-6.2.6, 6.2.8-6.2.10）
- ✅ 所有测试通过真实 `Game.create()` + `AlienState` + `AlienRegistry` plugin
- ✅ 验证发现条件检测、plugin onDiscover 调用、发现者奖励、中立标记规则
- ✅ `6.2.6` 基础发现发牌链路已由 `generic discovery flow initializes alien deck and deals by discovery occupants` 覆盖：初始化 alien deck、按发现位占用者发牌、翻开 face-up alien card。
- ✅ `6.2.6` 后续获取路径已规则确认：alien cards 只能通过 species effects 获取，不存在通用 card row/deck 后续获取路径；`AlienState.test.ts` / `drawCard.test.ts` 已覆盖 face-up/deck 选择能力，discovery flow 已覆盖初始化与发现奖励。
- ✅ `6.2.7` 已由 `Pass.test.ts` 中 `6.2.7 excludes Exertian alien cards from the pass hand limit` 覆盖，Pass 手牌上限计数排除 Exertian alien cards。
- ✅ `6.2.10` 已由 `discovers Anomalies, then lets a later red trace choose and mark the anomaly column slot` 覆盖：真实 discovery 后由 plugin 增加 extra slot，再通过真实 trace 输入标记额外位。

---

## Phase 7: 里程碑系统 — 完整规则

**规则来源:** rule-simple §7, rule-raw §MILESTONES, rule-faq

**文件:** `__tests__/engine/scoring/Milestone.test.ts` (扩展)

**Mock 问题:** `eventLog` noop；无 3+ 人顺时针顺序测试

### 7.1 Gold Milestones

```
RED tests:
├── 7.1.1 [集成] 达到 25 VP → 触发 gold milestone → 选择 tile
├── 7.1.2 [集成] 达到 50 VP → 触发（即使之前已触发 25）
├── 7.1.3 [集成] 达到 70 VP → 触发
├── 7.1.4 [集成] 不能标记同一 tile 两次
├── 7.1.5 [集成] 首个选择 tile 获最高值，后续获次高值
└── 7.1.6 [集成] 超过 100 VP 后不重复触发
```

### 7.2 Neutral Milestones

```
RED tests:
├── 7.2.1 [集成] 20/30 VP 触发中立标记放置
├── 7.2.2 [集成] 放到 6 个发现位最左空位
├── 7.2.3 [集成] 触发 alien discovery
├── 7.2.4 [集成] 6 位全满无效果
├── 7.2.5 [集成] 4 人游戏忽略中立里程碑
├── 7.2.6 [集成] FAQ: 每次只放 1 个中立标记
└── 7.2.7 [集成] FAQ: 优先左侧外星
```

### 7.3 多里程碑解决顺序

```
RED tests:
├── 7.3.1 [集成] 3 人游戏：当前玩家先 → 顺时针 → 中立最后
├── 7.3.2 [集成] 4 人游戏：无中立
├── 7.3.3 [集成] 里程碑在回合间结算，不能再做自由行动
└── 7.3.4 [集成] 里程碑结算可能触发 discovery → discovery 在 milestone 之后
```

**回归覆盖（截至 2026-04-21）**

| 计划项 | `it(...)` 名称 |
|--------|----------------|
| 7.1.1 | `7.1.1 [集成] reaching 25 VP queues gold tile selection and logs MILESTONE_GOLD_RESOLVED` |
| 7.1.2 | `7.1.2 [集成] reaching 50 VP still triggers after 25 was resolved` |
| 7.1.3 | `7.1.3 [集成] reaching 70 VP triggers the third gold milestone` |
| 7.1.4 | `7.1.4 [集成] a player cannot mark the same gold tile twice across milestones` |
| 7.1.5 | `7.1.5 [集成] first claim on a tile takes highest slot value, second player takes next` |
| 7.1.6 | `7.1.6 [集成] crossing 100+ VP does not re-trigger gold milestones` |
| 7.2.1 | `7.2.1 [集成] crossing 20/30 VP places neutral markers when playing below 4p` |
| 7.2.2 | `7.2.2 [集成] neutral marker uses the leftmost empty discovery slot among six` |
| 7.2.3 | `7.2.3 [集成] neutral placement can complete an alien and allow discovery resolution` |
| 7.2.4 | `7.2.4 [集成] when all six discovery spaces are full, neutral milestone has no effect` |
| 7.2.5 | `7.2.5 [集成] 4-player game ignores neutral milestones on the score track` |
| 7.2.6 | `7.2.6 [集成] FAQ: one neutral marker per milestone resolution (not two at once)` |
| 7.2.7 | `7.2.7 [集成] FAQ: prefers the left alien board when searching for an empty slot` |
| 7.3.1 | `7.3.1 [集成] 3p: starting from current player, gold resolves clockwise then neutral last` |
| 7.3.2 | `7.3.2 [集成] 4p: no neutral milestones in the queue` |
| 7.3.3 | `7.3.3 [集成] milestones run in BETWEEN_TURNS — free actions are rejected in that phase` |
| 7.3.4 | `7.3.4 [集成] ResolveDiscovery runs after neutral milestones in the between-turn pipeline` |

**实现 / 规则对齐说明**

- 测试全部通过真实 `Game.create()`、`EventLog` 与 `MilestoneState.checkAndQueue` 链式 `SelectGoldTile.process`；已移除手写 `eventLog: { append: noop }`。
- **7.2.4 / 规则**: 若 6 个发现位已满，中立里程碑应无效果。实现上在 `AlienState` 增加 `hasEmptyDiscoverySlot()`，`Milestone.resolveNeutralClaim` 在无可放位置时仅标记该玩家已处理该阈值，不消耗里程碑旁标记、不增加 `neutralDiscoveryMarkersUsed`、不写 `MILESTONE_NEUTRAL_RESOLVED`（修复此前「先扣标记再放置」导致全满时仍记日志的问题）。

---

## Phase 8: 科技系统 — 12 种科技完整效果

**规则来源:** rule-tech.md

**说明:** 现有测试只覆盖 `TechBonusEffect`（9 种即时奖励标记），不覆盖 12 种科技的持久效果。

### 8.1 橙色 — Probe 科技

**文件:** `__tests__/engine/tech/ProbeTechs.test.ts` (新建)

```
RED tests (全部通过真实 Game):
├── 8.1.0 [集成] num=0 (probeLimit): launch 2 次后第 3 次失败
├── 8.1.1 [集成] num=1 (meteorite): 进入小行星获声望 + 离开不消耗额外移动
├── 8.1.2 [集成] num=2 (roverDiscount): land 费用 -1（叠加测试）
├── 8.1.3 [集成] num=3 (roverMoon): 月球可着陆
└── 8.1.4 [集成] 无科技时 moon landing 被拒绝
```

**回归覆盖（截至 2026-04-21）**

- **文件:** `__tests__/engine/tech/ProbeTechs.test.ts` — 类级单测（`modifyProbeSpaceLimit` / 小行星 / 着陆 / 登月）保留；**Phase 8.1** 集成组全部经 `Game.create` + `processMainAction` / `processFreeAction`。
- **8.1.0:** `PROBE_DOUBLE_PROBE` + 额外信用；两次 `LAUNCH_PROBE` 后 `probesInSpace === 2`；第三次 `processMainAction(LAUNCH_PROBE)` 抛 `GameError`（`INVALID_ACTION`），探测器数仍为 2。第二次发射后仅 `processEndTurn`（对手本回合已 PASS，不再二次 PASS）。
- **8.1.1:** 固定种子 `behavior-flow-seed` + `ring-1-cell-2` 小行星格补丁 + `rotateNextDisc`；`PROBE_ASTEROID`；`MOVEMENT` 动态解析 Earth 邻格小行星与 Venus；进入小行星声望 +1；离开小行星至下一格仅消耗 1 点移动（无额外离轨花费）。
- **8.1.2:** 分两条 — 仅 `PROBE_ROVER_DISCOUNT` 着陆 Mercury（能量 3 → 结算后 1）；叠加轨控：`p1` `ORBIT` Saturn 后 `p2`（带 `PROBE_ROVER_DISCOUNT`）`LAND` Saturn，能量 3 → 2（轨控基础 2 再 −1）。
- **8.1.3:** `PROBE_MOON` + Mars 月球仍锁；`LAND` `isMoon: true` 成功，`moonOccupant` 为当前玩家。
- **8.1.4:** 无月球科技且月球未解锁；`LAND` `isMoon: true` → `INVALID_ACTION`。

### 8.2 红色 — Telescope 科技

**文件:** `__tests__/engine/tech/ScanTechs.test.ts` (新建)

```
RED tests (全部通过真实 Game + Scan action):
├── 8.2.0 [集成] num=0 (earthLook): Scan 时地球信号可改为标相邻扇区
├── 8.2.1 [集成] num=1 (popSignal): Scan 时付 1 声望在水星扇区额外标 1 信号
├── 8.2.2 [集成] num=2 (handSignal): Scan 时额外从手牌弃牌标信号
├── 8.2.3 [集成] num=3 (energyLaunch): Scan 时二选一 — 1 能量 launch 或 1 免费移动
├── 8.2.4 [集成] FAQ: energyLaunch 的 launch 不需 2 信用
├── 8.2.5 [集成] 多个望远镜科技可按任意顺序激活
└── 8.2.6 [集成] 有 4 个望远镜科技时最多标 4 个信号
```

**回归覆盖（截至 2026-04-21）:**

- `ScanTechs.test.ts`：**Phase 8.2** 组通过 `Game.create` + `processMainAction(SCAN)` + `processInput` 走完整 Scan 子行动池：`8.2.0` 邻接地球扇区（`sector-${idx}`）；`8.2.1` 水星 +1 声望；`8.2.2` 手牌弃牌标色；`8.2.3` 能量发射（`probesInSpace`）与 **move**（`getMoveStash()`）；`8.2.4` Scan 内 launch **不**再扣 `LAUNCH_PROBE_CREDIT_COST`（仅 Scan 主行动已付 `SCAN_CREDIT_COST`）；`8.2.5` 子行动顺序 Mercury → Energy(move) → Earth → Card row → Hand；`8.2.6` 四科技全开时 Earth + Card row + Mercury + Hand 共 **4** 枚扇区信号（与 rule-raw「至多 4 信号」一致），手牌 sector 颜色取自真实盘面扇区。
- 类级单测保留：四个 `Scan*Tech` 的 `getScanModifiers()` 与 `rule-tech.md` / `ScanTechs.ts` 文案一致。

### 8.3 蓝色 — Computer 科技

**文件:** `__tests__/engine/tech/ComputerTechs.test.ts`

```
RED tests (全部通过真实 Game):
├── 8.3.0 [集成] num=0: 放 data 到上格 → +2 VP；下格 → +1 信用
├── 8.3.1 [集成] num=1: 上格 → +2 VP；下格 → +1 能量
├── 8.3.2 [集成] num=2: 上格 → +2 VP；下格 → 抽 1 牌
├── 8.3.3 [集成] num=3: 上格 → +2 VP；下格 → +2 声望
├── 8.3.4 [集成] 上格未填时不能填下格
├── 8.3.5 [集成] Analyze Data 清空 top + bottom 所有数据
└── 8.3.6 [集成] FAQ: 蓝科技可放任意 slot
```

**回归覆盖（截至 2026-04-21）:**

- `ComputerTechs.test.ts`：`Game.create` + `PlaceDataFreeAction.execute` 验证四列（num 0–3）上格 +2 VP 与下格奖励（信用 / 能量 / 抽牌 / +2 声望）；8.3.3 下格声望增量相对「放置下格前」快照，避免默认盘面上 b 列上格 +1 声望干扰断言。
- `8.3.4`：`computer.placeData(BOTTOM)` 在上格空时抛错（与 `ComputerColumn.placeBottomData` 一致）。
- `8.3.5`：`AnalyzeDataAction.execute`：清空所有已放 data（含下格），`techId` / `hasBottomSlot` 保留；数据池满 6 时分批 `add` 再放置第 7 枚以贴合 pool cap。
- `8.3.6`：`RESEARCH_TECH` → 选 `COMPUTER_VP_CREDIT` → 列选项含 `col-4` 并可选中，科技落在第 5 列（index 4）。
- 类级单测保留：四个 `ComputerVp*` 类的 `getComputerSlotReward(0/1)` 与 `rule-tech.md` 表一致。

### 8.4 科技获取即时奖励

**文件:** `__tests__/engine/tech/TechBonus.test.ts` (扩展)

```
RED tests:
├── 8.4.1 [集成] 每种科技的即时奖励正确结算（能量/data/声望/卡/信用/VP）
└── 8.4.2 [集成] 即时奖励在放置之前结算
```

**回归覆盖（截至 2026-04-21）**

- 已覆盖：`8.4.1` 已由 `TechBonus.test.ts` 中 `Phase 8.4.1` 组锁定：对 `ETechBonusType` 全 9 种（含 `DATA_2`、`LAUNCH_IGNORE_LIMIT`）均通过 **`ResearchTechEffect.acquireTech`** 真实管线（`setNextTileBonus` 仅写入即将被 `take` 的牌面标记，不绕过引擎）；另含 **`ResearchTechAction.execute(..., isCardEffect: true)`** 的卡牌授予研究路径，验证印刷奖励仍经同一 `acquireTech` 结算。
- 已覆盖：`8.4.2` 已由 `Phase 8.4.2` 组锁定：对蓝科技在 **`ResearchTechEffect.execute`** 下，`CARD` / `ENERGY` 的牌面即时效果在 **`computer.placeTech` 调用之前**已生效（`getEligibleTechColumns` 收窄为单列以避免交互，在 `placeTech` spy 内断言手牌/能量已更新）。
- 说明：孤立 `TechBonusEffect.apply` 的细项断言保留在 `TechBonusEffect.test.ts`；`TechBonus.test.ts` 以管线与顺序为主。

---

## Phase 9: 终局计分 — 完整公式

**规则来源:** rule-simple §10, prd-rule §12

**Mock 问题:**
- ~~`FinalScoring.test.ts`: `sectors: []`，不测 alien scoring~~ 已用 `Game.create()` + 集成用例替换（见下方回归覆盖）。

### 9.1 End-Game Scoring Cards

**文件:** `__tests__/engine/scoring/FinalScoring.test.ts` (扩展)

```
RED tests:
├── 9.1.1 [集成] 通过真实 Game 走完 5 轮 → 终局计分卡正确结算
├── 9.1.2 [集成] 0 分终局计分牌仍计入"已完成数量"
├── 9.1.3 [集成] alien 特殊计分在终局被执行
└── 9.1.4 [集成] 有 sectors 数据时 sector-related 计分正确
```

**回归覆盖（截至 2026-04-21）**

- 已覆盖：`9.1.1` 已由 `Phase 9.1: end-game scoring cards (integration)` 中「真实 8 sectors、`Game.create` + 打出 id `127` 终局牌 + 5 轮 pass → `GAME_OVER`」锁定；断言 `finalScoringResult` 与对同一 `game` 再次 `FinalScoring.score` 一致。
- 已覆盖：`9.1.2` 已由「`other` 金卡 B 面 + 1 任务 + 1 张 0 VP 终局牌（registry `127`）→ `goldTiles = 5 × floor((1+1)/2)`」锁定「0 分终局牌仍计入配对数量」。
- 已覆盖：`9.1.3` 已由附加 discovered `DUMMY` alien board（`DummyAlienPlugin.onGameEndScoring`）+ `alienBonus` 断言锁定。
- 已覆盖：`9.1.4` 已由真实 `game.sectors[0].sectorWinners` + `other` A 面金卡 + orbiter/lander 部署 → `min(扇区胜次数, 轨道器+着陆器)` 锁定。
- 说明：基础算术与平局仍保留在 `unit: breakdown arithmetic` describe（`Game.create` 壳 + 受控字段）。

### 9.2 Gold Scoring Tiles

**文件:** `__tests__/engine/scoring/GoldScoringTile.test.ts` (扩展)

```
RED tests:
├── 9.2.1 [集成] 科技组 min(orange,red,blue)
├── 9.2.2 [集成] 科技对 floor(total/2)
├── 9.2.3 [集成] 完成任务数
├── 9.2.4 [集成] 收入组（只计 tucked，不计 base）
├── 9.2.5 [集成] 信用/能量收入数
├── 9.2.6 [集成] 生命痕迹组（overflow 计入）
├── 9.2.7 [集成] 扇区胜利 + orbiter/lander 配对（月球 lander 也计）
├── 9.2.8 [集成] 已完成任务 + 终局计分牌 配对
└── 9.2.9 [集成] 两面不同公式各自正确
```

**回归覆盖（Phase 9.2）**

- 已覆盖：`9.2.1`–`9.2.9` 均由 `GoldScoringTile.test.ts` 的 `Phase 9.2` 组锁定：`Game.create()` 得到真实 `IGame` / `IPlayer`，对 `GoldScoringTile.scorePlayer` 做断言（无 `as never`）。
- `9.2.1` / `9.2.2`：`tech` 牌 A/B 分别对应 `min(三系科技数)` 与 `floor(科技总数/2)`。
- `9.2.3`：`mission` A 使用 `completedMissions.length`。
- `9.2.4`：`mission` B 的 `getTuckedIncomeCounts` 仅遍历 `tuckedIncomeCards`，并通过 `income.addBaseIncome` 放大 base 证明不计入。
- `9.2.5`：`income` A 为 `max(信用 tucked, 能量 tucked)`。
- `9.2.6`：`income` B 为三色 `min`；第二条红痕迹经测试铺状态 helper 进入 overflow 后仍累加 `player.traces[RED]`。真实业务 trace 奖励必须走 `createTraceInput`。
- `9.2.7`：`other` A 为 `min(扇区胜场次数, orbiter+lander)`；胜场来自真实 `Sector.sectorWinners` 数组；`EPieceType.LANDER` 覆盖规则中的轨道器/着陆器（含月球 lander）。
- `9.2.8`：`other` B 为 `floor((missions + endGameCards) / 2)`。
- `9.2.9`：同一 `tech` 牌手状态下 A/B 两面得分不同且与公式一致。

### 9.3 终局计分流程

```
RED tests:
├── 9.3.1 [集成] 计分顺序：end-game cards → gold tiles → alien scoring
├── 9.3.2 最高 VP 获胜
├── 9.3.3 平局无打破规则
└── 9.3.4 [集成] 使用真实 Game + sectors + alienState 计分
```

**回归覆盖（截至 2026-04-21）**

- 已覆盖：`9.3.1` 已由 `Phase 9.3` 中「`totalAdded === endGameCards + goldTiles + alienBonus`」锁定计分拆项可加性（对应 `FinalScoring.score` 内先终局卡、再金卡、再 alien 的实现顺序）；引擎内 `FINAL_SCORING` 为同步瞬时 phase，仍以源码顺序为准。
- 已覆盖：`9.3.2` / `9.3.3` 已由最高 VP 获胜与平局不打破用例锁定。
- 已覆盖：`9.3.4` 已由「5 轮 pass → `GAME_OVER` + `sectors.length === 8` + `alienState.boards.length === 2` + 存在 `GAME_END` 事件」锁定真实棋盘与外星状态进入终局快照。

---

## Phase 10: 全流程集成 — 5 轮仿真

**规则来源:** 所有规则文档

### 10.1 回合间检查

**文件:** `__tests__/engine/GameRoundTransition.test.ts` (新建)

```
RED tests:
├── 10.1.1 [集成] 所有玩家获得收入（base + tucked）
├── 10.1.2 [集成] 起始玩家标记传给左手边
├── 10.1.3 [集成] 旋转提醒移到下回合牌堆
└── 10.1.4 [集成] pass 标记清除，新回合初始化
```

**回归覆盖（截至 2026-04-21）**

- 已覆盖：`10.1.1`–`10.1.4` 均由 `GameRoundTransition.test.ts` + `Game.create()` 锁定；收入语义对齐 `Player.applyEndOfRoundIncome`：**第 1 回合结束仅发放 corporation base income**；**从第 2 回合结束起**资源增量等于各玩家当期的 `income.computeRoundPayout()`（base + tucked 叠加）。`10.1.1` 对 p1 额外 `addTuckedIncome(CREDIT)` 以区分 tucked 层。
- `10.1.2`：3 人局 `startPlayer` 按座位序传给下一座位（`getNextPlayer`）。
- `10.1.3`：`roundRotationReminderIndex` 每回合末 +1（与回合末牌堆索引一致）。
- `10.1.4`：`pass` 后 `passed` 置位，回合清算后全员 `passed` 清除且进入新回合 `AWAIT_MAIN_ACTION`。

### 10.2 回合流程

**文件:** `__tests__/engine/GameTurnFlow.test.ts` (新建)

```
RED tests:
├── 10.2.1 [集成] 起始玩家先手，顺时针
├── 10.2.2 [集成] 跳过已 pass 玩家
├── 10.2.3 [集成] 1 主行动 + 任意自由行动
├── 10.2.4 [集成] 自由行动可中断主行动
│   └── 示例：Scan 标 2 信号获 2 data → 中断放 data 到电脑 → 继续 Scan
├── 10.2.5 [集成] 不能用自由行动中断另一个自由行动
├── 10.2.6 [集成] 主行动后 → milestone → discovery → 下一玩家
└── 10.2.7 [集成] 所有人 pass → 回合结束
```

**回归覆盖（截至 2026-04-21）**

- 已覆盖：`10.2.1`–`10.2.7` 均由 `GameTurnFlow.test.ts` + `Game.create()`、`processMainAction` / `processFreeAction` / `processEndTurn` 驱动。
- `10.2.1`：起始玩家先行动，顺座位换手；新回合 `startPlayer` 与 `activePlayer` 与回合间传递一致。
- `10.2.2`：3 人局中已 `pass` 的玩家在当轮被跳过（p1 pass → p2 非 pass 行动 → p3 pass → 回到 p2）。
- `10.2.3`：`LAUNCH_PROBE` 后 `AWAIT_END_TURN` 下可执行 `EXCHANGE_RESOURCES`，再 `END_TURN`。
- `10.2.4`：覆盖两条路径：① `Scan` 结算后（`AWAIT_END_TURN`）再 `PLACE_DATA`；② `Scan` 子行动进行中（`MARK_EARTH` 后、`DONE` 前）可插入 `PLACE_DATA`，随后继续 `DONE` 完成主行动。
- `10.2.5`：`PLACE_DATA` 触发 tuck 收入选牌且 `waitingFor` 未清时，第二次 `processFreeAction` 抛 `INVALID_INPUT_RESPONSE`（与 `PlaceData.test.ts` 行为一致）。
- `10.2.6`：`END_TURN` → 事件序 `MILESTONE_CHECK` 在 `MILESTONE_GOLD_RESOLVED` 之前；`DummyAlienPlugin` 注册下验证换手至下家。（Discovery 仅在可发现 alien 时出现；本用例以里程碑 + 换手为主断言。）
- `10.2.7`：两人全 `pass` 后回合结束，第 1 回合末信用收入等于各玩家 `income.baseIncome` 中的 credits（与 `applyEndOfRoundIncome(1)` 一致）。

### 10.3 完整 5 轮仿真

**文件:** `__tests__/engine/FullGameSimulation.test.ts` (新建)

```
RED tests:
├── 10.3.1 [集成] 2 人 5 轮（固定 seed + 预编排）→ 验证最终分数
├── 10.3.2 [集成] 3 人 + 中立里程碑触发 alien discovery
├── 10.3.3 [集成] 4 人无中立里程碑
├── 10.3.4 [集成] phase 转换: SETUP→PLAY→END_OF_ROUND(×5)→FINAL_SCORING→GAME_OVER
└── 10.3.5 [集成] 验证每回合收入累积正确
```

**回归覆盖（截至 2026-04-21）**

- **文件:** `FullGameSimulation.test.ts` + `Game.create()`；`PLAY` 在引擎枚举中对应 **`AWAIT_MAIN_ACTION`**（主行动阶段循环）。
- **10.3.1：** 2 人、固定 seed `phase-10-3-1-two-player-five-rounds`、确定性 **全 PASS** 序列（每回合每人 `PASS` + `END_OF_ROUND` / 输入解析）推进 5 轮 → `GAME_OVER`；断言 `finalScoringResult.scores` 快照（当前全 PASS 无额外 VP：`p1=1`、`p2=2`，与起始 `seatIndex+1` + 终局计分增量一致）。
- **10.3.2：** 3 人局；`DummyAlienPlugin` 注册；`neutralMilestones` 为 `[20,30]`；对 alien board0 打 2 条玩家痕迹后 `p1.score=22`，首回合首 PASS 触发中立里程碑补第三发现位 → 事件流含 `MILESTONE_NEUTRAL_RESOLVED` 与 `ALIEN_DISCOVERED`。
- **10.3.3：** 4 人 `neutralMilestones.length===0`；另案 5 轮全 PASS 至终局。
- **10.3.4：** `transitionTo` 记录：至少 **5 次** `END_OF_ROUND`，随后 `FINAL_SCORING`、末项 `GAME_OVER`。
- **10.3.5：** 每回合末资源增量与 **`Player.applyEndOfRoundIncome(game.round)`** 一致（第 1 回合末仅 **base income**；第 2–5 回合末为 **`income.computeRoundPayout()`**），与 `Income` 模块及 `GameRoundTransition` 10.1.1 语义对齐。

### 10.4 收入系统

**文件:** `__tests__/engine/income/IncomeSystem.test.ts` (新建)
+ `__tests__/engine/effects/income/TuckCardForIncomeEffect.test.ts` (扩展)

**初始说明:** 收入是每回合结束的关键逻辑，计划启动时缺少系统性集成测试；当前覆盖见下方“回归覆盖”。

```
RED tests (全部通过 Game.create):
├── 10.4.1 [集成] 第 1 回合结束 — 仅 base income（起始收入卡）生效
├── 10.4.2 [集成] 第 2 回合结束 — base income + tucked income 叠加
├── 10.4.3 [集成] tucked 信用卡 → 每回合 +1 信用
├── 10.4.4 [集成] tucked 能量卡 → 每回合 +1 能量
├── 10.4.5 [集成] tucked 抽牌卡 → 每回合 +1 牌
├── 10.4.6 [集成] 游戏中途增加 tucked income 后，后续回合收入被正确累积
├── 10.4.7 [集成] 多张 tucked 卡叠加收入
└── 10.4.8 [错误] 收入不能导致资源超出（如果有上限规则）
```

**回归覆盖（截至 2026-04-21）**

- **引擎行为:** `Game.resolveEndOfRound` 调用 `Player.applyEndOfRoundIncome(this.round)`。第 1 回合末仅支付 **`income.baseIncome`**（起始公司卡面基础收入）；第 2 回合起支付 **`income.computeRoundPayout()`**（base + tucked 叠加）。此前若将 `TIncomeBundle` 直接传入 `Resources.gain`，键名不匹配会导致回合末收入未落地（已消除）。
- **10.4.1–10.4.2、10.4.7:** `packages/server/__tests__/engine/income/IncomeSystem.test.ts`；与 `GameRoundTransition.test.ts` 10.1.1 语义一致。
- **10.4.3–10.4.5:** 通过 `addTuckedIncome` 与 `getPendingCardDrawCount()` 断言信用/能量/抽牌类 tucked 在回合末的叠加（抽牌进入 pending 计数，非当场摸牌）。
- **10.4.6:** 规则上 orbit 奖励「通常含收入增加」；**当前实现** 中 `OrbitAction` 不写入 tucked income（见 `Orbit.test.ts`）。本项用 **PlaceData 电脑奖励 `tuckIncome` → `TuckCardForIncomeEffect`** 走完整 `Game.create` + 自由行动链路，验证「游戏中途增加 tucked」在次回合及之后的回合末结算中累积。
- **10.4.8:** `rule-simple.md` **未**规定玩家信用/能量的规则上限；**实现** 在 `Resources.gain` 中将 credits/energy/publicity **clamp 至 999**（`RESOURCE_MAX`）。测试仅锁定该实现，若规则日后定义上限需同步实现与断言。
- **TuckCardForIncomeEffect:** `packages/server/__tests__/engine/effects/income/TuckCardForIncomeEffect.test.ts` 增补连续两次 tuck 时 `tuckedCardIncome` 叠加。

---

## 当前收尾状态（校准截至 2026-04-24）

当前 `docs/tests/tdd-plan.md` 中已不保留“完成但仍显示未处理”的条目。最近一轮收尾已完成：

- `2.4.9`: data pool 满时超出 data 按规则弃掉，不进入 stash。
- `2.6.5` / `2.6.6` / `2.6.12`: quick mission 的立即完成、跳过后延迟完成、以及主效果先于任务完成 prompt 的时序均已覆盖。
- `6.2.7`: Exertian alien cards 不计入 pass 手牌上限。
- `6.2.10`: 真实 Anomalies discovery 后新增的 extra slot 可通过 trace 输入标记。
- `BehaviorExecutor`: legacy `describe.skip` mock suite 已删除。

---

## 执行守则

### TDD 铁律

每个 Phase 内严格遵循 Red-Green-Refactor：

1. **RED** — 写一个最小的失败测试
2. **验证 RED** — `pnpm test` 确认测试失败且原因正确
3. **GREEN** — 写最少代码使测试通过
4. **验证 GREEN** — `pnpm test` 确认该测试和所有已有测试通过，输出干净
5. **REFACTOR** — 清理代码，保持测试绿色
6. **REPEAT** — 下一个测试

#### 单测试节奏（严格执行）

每个 RED test 独立执行一轮 Red-Green-Refactor 循环，**不可批量写多个 test 再一起实现**。
即使 plan 中列出了一组 RED tests，执行时必须逐个进行：写 1 个 → 验证失败 → 实现 → 验证通过 → 重构 → 下一个。

#### Verify RED 判断标准

验证 RED 时必须确认以下全部条件：
- 失败类型是 **assertion failure**（非 compile error / import error / runtime exception）
- 失败原因是 **目标功能缺失**（非拼写错误 / 测试自身 bug）
- 失败消息与预期一致（如 `expected X, received Y`）

如果测试直接通过 → 说明在测已有行为，需要修改测试。
如果测试报 error（非 assertion failure）→ 先修复 error，重跑直到正确失败。

#### Verify GREEN 输出干净标准

验证 GREEN 时除了确认测试通过，还必须确认：
- **零 console.error / console.warn 输出**
- **无 unhandled promise rejection**
- **无 deprecation warning**

如有噪音输出，视为测试未通过，需修复后再继续。

#### MOCK-HEAVY 重写流程

对于评级为 🔴 MOCK-HEAVY 的文件（Scan、AnalyzeData、PlayCard、CompleteMission、RotateDiscEffect、ResolveDiscovery、BehaviorExecutor、MissionTracker、ObservationQuickMissionCard），执行以下流程：

1. **将旧测试整体标记为 `describe.skip('legacy - ...')`**，不删除
2. **从零写集成测试**，每个 RED test 独立 Red-Green-Refactor
3. **新测试全部绿灯后**，验证新测试覆盖了旧测试的所有有效断言
4. **确认无遗漏后删除 `describe.skip` 块**

> ⚠️ 禁止在旧 mock 测试基础上"修补"。旧测试不可作为参考来"适配"。
> 遵循 TDD Skill Iron Law: "Don't keep it as reference. Delete means delete."

#### Refactor 阶段关注点

Refactor 不只是"清理代码"，需关注以下具体动作：
- **提取测试辅助函数** → 放到 `__tests__/helpers/` 目录
  - `TestGameBuilder` — 封装 `Game.create()` + 常用预设（指定 seed、玩家数、预置科技等）
  - `setupPlayerWithProbe(game, playerId)` — launch + move 到指定位置
  - `advanceToRound(game, roundNum)` — 快速推进到指定回合
  - `resolveAllInputsDefault(game)` — 自动选择第一项完成所有 pending inputs
- **消除重复** — 多个 describe 块中相同的 setup 逻辑提取为 `beforeEach`
- **改善命名** — 测试名称必须描述行为而非实现（`'rejects when credits < 2'` 而非 `'test error case'`）
- **不加行为** — Refactor 阶段严禁添加新功能

### 反模式检查（必读）

写测试或添加 mock 时，**必须遵守** `.agents/skills/test-driven-development/testing-anti-patterns.md` 中的规则：

| 反模式 | 检查方法 |
|--------|---------|
| 测试 mock 行为而非真实行为 | 断言中不应出现 `expect(mockFn).toHaveBeenCalled()` 作为唯一验证 |
| 生产类添加测试专用方法 | 检查是否有方法只在 `__tests__/` 中被调用 |
| 不理解依赖就 mock | 添加 mock 前先问：被 mock 的方法有什么副作用？测试依赖这些副作用吗？ |
| 不完整的 mock 对象 | 手工构造的 `IGame` / `IPlayer` 必须包含下游代码实际访问的所有字段 |
| 测试作为事后补充 | 严格 TDD — 先写失败测试，后写实现 |

### 集成测试原则（针对 Mock 问题）

**核心原则：测试必须验证规则行为，不是验证 mock 被调用。**

1. **优先使用 `Game.create()` 构造真实游戏**，而非手工 `as unknown as IGame`
2. **优先通过 `processMainAction` / `processFreeAction` 驱动**，而非直接调用 Action.execute
3. **断言游戏状态变化**（分数、资源、棋盘位置），而非断言 mock 函数被调用
4. **只在以下情况允许 mock：**
   - 外部 I/O（DB、网络）
   - 随机性需要固定（用 `SeededRandom` 替代，非 mock）
   - 测试粒度确实需要隔离单个组件（但必须同时有对应的集成测试）

### 文件命名规范

- 测试文件位于 `packages/server/__tests__/`，镜像 `src/` 结构
- 文件名 `<SourceFile>.test.ts`
- 使用 `@/` 路径别名引用源文件

### 依赖关系

```
Phase 1 (Setup)
  └──> Phase 2 (Main Actions + 2.9 BehaviorExecutor + 2.10 Card Effects Audit)
  └──> Phase 3 (Free Actions + 3.7 MissionTracker)
        └──> Phase 4 (Solar Rotation)
        └──> Phase 5 (Sector Completion)
        └──> Phase 6 (Life Trace & Discovery)
              └──> Phase 7 (Milestones)
                    └──> Phase 8 (Tech Effects)
                          └──> Phase 9 (Final Scoring)
                                └──> Phase 10 (Full Integration + 10.4 Income System)
```

### 现有覆盖情况标注

| 标记 | 含义 |
|------|------|
| 🔴 MOCK-HEAVY | 严重依赖 mock，核心规则未被测试，需要重写/大幅扩展 |
| 🟡 MIXED | 部分真实部分 mock，需要补充集成测试 |
| 🟢 GOOD/INTEGRATION | 测试质量良好，仅需补边界 |
| 🆕 | 全新测试文件 |

| Phase | 文件 | Mock 评级 | 需要动作 |
|-------|------|----------|---------|
| 1 | GameSetup.test.ts | 🟢 | Phase 1 已完成（2026-04-21） |
| 2.1 | LaunchProbe.test.ts | 🟢 | `2.1.1-2.1.5` 与 `2.1E.*` 已覆盖，含真实 orbit / land 后 probesInSpace 上限语义（2026-04-24 校准） |
| 2.2 | Orbit.test.ts | 🟢 | `2.2.1-2.2.5` 与 `2.2E.*` 已覆盖，含全行星奖励矩阵与 orbit income（2026-04-24 校准） |
| 2.3 | Land.test.ts | 🟢 | `2.3.1-2.3.6` 与 `2.3E.1-2.3E.4` 基本已锁 |
| 2.4 | Scan.test.ts | 🟢 | `2.4.1-2.4.10` 与 `2.4E.1-2.4E.2` 已锁；`2.4.9` 已按规则改为 data pool 满时超出 data 直接弃掉 |
| 2.5 | AnalyzeData.test.ts | 🟢 | `2.5.1-2.5.8` 与 `2.5E.1-2.5E.3` 已补齐回归覆盖 |
| 2.6 | PlayCard.test.ts | 🟢 | `2.6.1-2.6.12` 与 `2.6E.1-2.6E.3` 已覆盖，含主行动级“一效果一圈”与 stale cardId 输入 |
| 2.7 | ResearchTech.test.ts | 🟢 | `2.7.1-2.7.8` 与 `2.7E.1-2.7E.3` 已基本锁定，含 card-effect duplicate-tech `no-op + rotate` |
| 2.8 | Pass.test.ts | 🟢 | `2.8.1-2.8.7` 已锁定；round-5 token discard 无独立可观测状态，已接受间接体现且不作为后续实施项 |
| 2.9 | BehaviorExecutor.test.ts | 🟢 | integration 主路径已接管；无效 behavior type 已定为容错 + event log + 前端 toast；legacy skip suite 已删除 |
| 2.10 | CardEffectsIntegration.test.ts | 🟢 | `2.10.1-2.10.8` 已覆盖；`71/109` 当前双旋转语义已显式锁定 |
| 3.1 | Movement.test.ts | 🟢 | Phase 3.1 真实棋盘、mission 事件与 `3.1E.*` 错误路径已覆盖（2026-04-24 校准） |
| 3.2 | PlaceData.test.ts | 🟢 | Phase 3.2 真实 Deck、data pool 上限、电脑奖励与错误路径已覆盖（2026-04-21） |
| 3.3 | CompleteMission.test.ts | 🟢 | Phase 3.3 已重写并覆盖 happy path、可推迟完成、重复完成与非当前玩家错误路径（2026-04-21） |
| 3.4 | FreeActionCorner.test.ts | 🟢 | Phase 3.4 集成 + Cornell 角触发已锁（2026-04-21） |
| 3.5 | BuyCard.test.ts | 🟢 | Phase 3.5 集成 + 错误路径已锁（2026-04-21） |
| 3.6 | ExchangeResources.test.ts | 🟢 | 换入牌展示区/牌堆 + 集成 + 错误路径已锁（2026-04-21） |
| 3.7 | MissionTracker.test.ts | 🟢 | Phase 3.7 `3.7.1-3.7.12` 已覆盖，含“打出后才触发”“一效果一空位” |
| 3.7 | TechMissionCards.test.ts | 🟢 | 保留单元测试并补充 tracker/event 流集成 |
| 3.7 | ObservationQuickMissionCard.test.ts | 🟢 | 保留 legacy suite 并补充真实 Scan / sector 标记集成 |
| 4.1 | RotateDiscEffect.test.ts | 🟢 | Phase 4.1 真实 SolarSystem 物理旋转、probe 跟随/挤移与 alienState 回调已覆盖 |
| 4.2 | SolarSystem.test.ts | 🟢 | Phase 4.2 旋转触发时机与 rotationCounter 循环已覆盖 |
| 5 | Sector/SectorFulfillment | 🟢 | Phase 5 扇区完成、胜者/第二名、重置、重复胜利与多扇区结算顺序已覆盖 |
| 6.1 | LifeTrace.test.ts | 🟢 | Phase 6.1 新建并覆盖发现位、overflow、universal trace 与额外位选择 |
| 6.2 | ResolveDiscovery.test.ts | 🟢 | no-op 已重写；`6.2.1-6.2.10` 已覆盖或规则确认，含 Exertian 手牌上限与 Anomalies discovery 后 extra slot |
| 7 | Milestone.test.ts | 🟢 | Phase 7 全项 + `Game.create` / 真实 `EventLog`（2026-04-21） |
| 8.1-8.3 | Tech effects | 🟢 | `ProbeTechs.test.ts` 已覆盖 Phase 8.1 集成；`ScanTechs.test.ts` 已覆盖 Phase 8.2 集成；`ComputerTechs.test.ts` 已覆盖 Phase 8.3 集成 |
| 8.4 | TechBonus.test.ts | 🟢 | Phase 8.4.1–8.4.2 集成（+ TechBonusEffect 单元） |
| 9 | FinalScoring/GoldTile | 🟢 | `GoldScoringTile.test.ts` Phase 9.2；`FinalScoring.test.ts` Phase 9.1/9.3（2026-04-21） |
| 10.1–10.2 | GameRoundTransition / GameTurnFlow | 🟢 | `10.1.1–10.1.4` / `10.2.1–10.2.7` 已覆盖（2026-04-21） |
| 10.3 | FullGameSimulation.test.ts | 🟢 | `10.3.1–10.3.5` 已覆盖（2026-04-21） |
| 10.4 | IncomeSystem.test.ts | 🟢 | `10.4.1-10.4.8` 已覆盖，含 base/tucked 叠加、抽牌收入 pending 与资源 clamp（2026-04-21） |

---

## 初始预估测试用例总数

> 该表为计划启动时的规模估算，保留作历史参考；本轮收尾状态以“当前收尾状态”章节为准。

| Phase | 预估 test cases | 🔴 需重写 | 🟡 需补充 | 🆕 新建 | 🚫 错误路径 |
|-------|----------------|----------|----------|--------|-----------|
| 1 | ~15 | 0 | 15 | 0 | 0 |
| 2 (含 2.9/2.10/错误) | ~90 | ~37 | ~20 | ~13 | ~20 |
| 3 (含 3.7/错误) | ~55 | ~16 | ~15 | ~6 | ~18 |
| 4 | ~12 | ~7 | ~1 | 0 | ~4 |
| 5 | ~13 | 0 | ~8 | ~5 | 0 |
| 6 | ~18 | ~10 | 0 | ~8 | 0 |
| 7 | ~15 | 0 | ~11 | ~4 | 0 |
| 8 | ~20 | 0 | ~2 | ~18 | 0 |
| 9 | ~16 | 0 | ~12 | ~4 | 0 |
| 10 (含 10.4) | ~20 | 0 | 0 | ~20 | ~1 |
| **总计** | **~274** | **~70** | **~84** | **~78** | **~43** |
