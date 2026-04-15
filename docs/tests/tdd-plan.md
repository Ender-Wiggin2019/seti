# SETI 完整规则 TDD 实施计划

> 基于 `docs/arch/rule-simple.md`、`rule-raw.md`、`rule-tech.md`、`rule-faq.md`、`prd-rule.md` 的完整规则，  
> 对照现有 `packages/server/__tests__/` 已有测试覆盖 + Mock 审计结果，识别缺口并制定 TDD 计划。

---

## 现有测试 Mock 审计总结

### 测试质量评级

| 评级 | 含义 |
|------|------|
| **INTEGRATION** | 通过 `Game.create()` + `processMainAction` 走完整引擎管线 |
| **GOOD** | 测试真实代码，仅在不可避免处使用 stub |
| **MIXED** | 部分测试用真实引擎，部分用手工构造的假 `IGame` |
| **MOCK-HEAVY** | 大量 mock 绕过核心规则逻辑，测的是"胶水代码"而非规则 |

### 现有测试 Mock 问题汇总

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
| `Milestone.test.ts` | MIXED | `eventLog: { append: () => undefined }`；无 3+ 人顺时针解决顺序测试 |
| `FinalScoring.test.ts` | MIXED | `sectors: []`，`alienState` 无真实数据；不测有 alien 评分的场景 |
| `GoldScoringTile.test.ts` | MIXED | `game` cast `as never`；sector wins 手工注入而非来自真实游戏 |
| `BehaviorExecutor.test.ts` | **MOCK-HEAVY** | `game.mark` 只 push 到 `__markCalls`；`techBoard.getAvailableTechs: () => []` |
| `MissionTracker.test.ts` | **MOCK-HEAVY** | 手工 `IMissionDef`；不测"打出后才能触发"规则；不测"一效果一空位" |
| `TechMissionCards.test.ts` | MIXED | 直接调 `checkCondition!(player, game)` 绕过 tracker/event 流；不测 trigger 时序 |
| `ObservationQuickMissionCard.test.ts` | **MOCK-HEAVY** | `vi.fn()` mock `sector.markSignal`；`missionTracker` stub |
| `TuckCardForIncomeEffect.test.ts` | MIXED | 缺少系统性收入累积验证；不测 base + tucked 叠加 |
| 30+ 单卡测试（cards/base/*.test.ts） | MIXED~MOCK-HEAVY | 多数直接调 `card.execute()` 或手工构造 game，不走 `processMainAction(PLAY_CARD)` |

---

## 计划总览

共 **10 个阶段（Phase）**，按依赖关系排序。重点标注 mock 绕过的规则需要补回的集成测试。

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
**现有覆盖:** `GameSetup.test.ts` — INTEGRATION/GOOD，需补充细节

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

---

## Phase 2: 主行动 — 集成测试补全

**规则来源:** rule-simple §5, rule-raw §MAIN ACTIONS, rule-faq

> **关键发现:** Scan、AnalyzeData、PlayCard 被评为 MOCK-HEAVY，LaunchProbe/ResearchTech/Pass 为 MIXED。  
> 这些测试需要补充 **通过 `Game.processMainAction` 走完整管线的集成测试**。  
> 已有的 INTEGRATION 测试（Orbit、Land）也需要补充 mock 绕过的边界。

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

### 3.4 Free-Action Corner 补全

**文件:** `__tests__/engine/freeActions/FreeActionCorner.test.ts` (扩展)

**Mock 问题:** `missionTracker: vi.fn()`；只测了 1 种角效果

```
RED tests:
├── 3.4.1 [集成] 弃牌执行 MOVE 角效果 — 获得移动点
├── 3.4.2 [集成] 弃牌执行 CREDIT 角效果 — 获得信用
├── 3.4.3 [集成] 弃牌执行 ENERGY 角效果 — 获得能量
├── 3.4.4 [集成] 弃牌执行 CARD 角效果 — 抽牌
├── 3.4.5 [集成] 同一张牌不能既主行动又自由行动
└── 3.4.6 [集成] 角效果触发 missionTracker 真实事件
```

### 3.4E Free-Action Corner — 错误路径

```
RED tests (错误路径 / 非法操作):
├── 3.4E.1 [错误] 手牌为空时不能使用角效果
└── 3.4E.2 [错误] 同一张牌不能既打出又弃掉做角效果
```

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

### 3.6 Exchange Resources 补全

**文件:** `__tests__/engine/freeActions/ExchangeResources.test.ts` (扩展)

**规则偏差:** 规则说"Cards gained come from card row or top of deck"，实现只走牌堆

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

### 8.3 蓝色 — Computer 科技

**文件:** `__tests__/engine/tech/ComputerTechs.test.ts` (新建)

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

### 8.4 科技获取即时奖励

**文件:** `__tests__/engine/tech/TechBonus.test.ts` (扩展)

```
RED tests:
├── 8.4.1 [集成] 每种科技的即时奖励正确结算（能量/data/声望/卡/信用/VP）
└── 8.4.2 [集成] 即时奖励在放置之前结算
```

---

## Phase 9: 终局计分 — 完整公式

**规则来源:** rule-simple §10, prd-rule §12

**Mock 问题:**
- `FinalScoring.test.ts`: `sectors: []`，不测 alien scoring
- `GoldScoringTile.test.ts`: `game as never`，sector wins 手工注入

### 9.1 End-Game Scoring Cards

**文件:** `__tests__/engine/scoring/FinalScoring.test.ts` (扩展)

```
RED tests:
├── 9.1.1 [集成] 通过真实 Game 走完 5 轮 → 终局计分卡正确结算
├── 9.1.2 [集成] 0 分终局计分牌仍计入"已完成数量"
├── 9.1.3 [集成] alien 特殊计分在终局被执行
└── 9.1.4 [集成] 有 sectors 数据时 sector-related 计分正确
```

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

### 9.3 终局计分流程

```
RED tests:
├── 9.3.1 [集成] 计分顺序：end-game cards → gold tiles → alien scoring
├── 9.3.2 最高 VP 获胜
├── 9.3.3 平局无打破规则
└── 9.3.4 [集成] 使用真实 Game + sectors + alienState 计分
```

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

### 10.4 收入系统

**文件:** `__tests__/engine/income/IncomeSystem.test.ts` (新建)  
+ `__tests__/engine/effects/income/TuckCardForIncomeEffect.test.ts` (扩展)

**说明:** 收入是每回合结束的关键逻辑，但缺少系统性集成测试。

```
RED tests (全部通过 Game.create):
├── 10.4.1 [集成] 第 1 回合结束 — 仅 base income（起始收入卡）生效
├── 10.4.2 [集成] 第 2 回合结束 — base income + tucked income 叠加
├── 10.4.3 [集成] tucked 信用卡 → 每回合 +1 信用
├── 10.4.4 [集成] tucked 能量卡 → 每回合 +1 能量
├── 10.4.5 [集成] tucked 抽牌卡 → 每回合 +1 牌
├── 10.4.6 [集成] orbit 奖励中的收入增加被正确累积
├── 10.4.7 [集成] 多张 tucked 卡叠加收入
└── 10.4.8 [错误] 收入不能导致资源超出（如果有上限规则）
```

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
| 1 | GameSetup.test.ts | 🟢 | 补充细节 |
| 2.1 | LaunchProbe.test.ts | 🟡 | 补充 processMainAction 集成 + 错误路径 |
| 2.2 | Orbit.test.ts | 🟢 | 补充边界 + 错误路径 |
| 2.3 | Land.test.ts | 🟢 | 补充 trace 选择 + Mars 双位 + 错误路径 |
| 2.4 | Scan.test.ts | 🔴 | **重大扩展 — 需要真实 data 流转测试 + 错误路径** |
| 2.5 | AnalyzeData.test.ts | 🔴 | **重大扩展 — 需要真实 trace + discovery + 错误路径** |
| 2.6 | PlayCard.test.ts | 🔴 | **重大扩展 — 需要真实卡牌效果/任务 + 错误路径** |
| 2.7 | ResearchTech.test.ts | 🟡 | 补充 processMainAction 集成 + 错误路径 |
| 2.8 | Pass.test.ts | 🟡 | 补充真实旋转验证 |
| 2.9 | BehaviorExecutor.test.ts | 🔴 | **重大扩展 — 当前完全 mock game.mark + techBoard** |
| 2.10 | CardEffectsIntegration.test.ts | 🆕 | 新建 — 代表性卡牌集成抽检 |
| 3.1 | Movement.test.ts | 🟡 | 补充真实棋盘 + mission 事件 + 错误路径 |
| 3.2 | PlaceData.test.ts | 🟡 | 补充真实 Deck + data pool 上限 + 错误路径 |
| 3.3 | CompleteMission.test.ts | 🔴 | **重写 — 当前无 happy-path + 错误路径** |
| 3.4 | FreeActionCorner.test.ts | 🟡 | 补充多种角效果 + mission 事件 + 错误路径 |
| 3.5 | BuyCard.test.ts | 🟢 | 补充边界 + 错误路径 |
| 3.6 | ExchangeResources.test.ts | 🟢 | 验证规则偏差 + 错误路径 |
| 3.7 | MissionTracker.test.ts | 🔴 | **重大扩展 — 不测"打出后才触发"/"一效果一空位"** |
| 3.7 | TechMissionCards.test.ts | 🟡 | 补充 tracker/event 流集成 |
| 3.7 | ObservationQuickMissionCard.test.ts | 🔴 | **重大扩展 — mock sector.markSignal** |
| 4.1 | RotateDiscEffect.test.ts | 🔴 | **重大扩展 — 当前完全 mock 物理旋转** |
| 4.2 | SolarSystem.test.ts | 🟢 | 补充集成触发时机 |
| 5 | Sector/SectorFulfillment | 🟡 | 补充集成测试 |
| 6.1 | LifeTrace.test.ts | 🆕 | 新建 |
| 6.2 | ResolveDiscovery.test.ts | 🔴 | **重写 — 当前只有 no-op** |
| 7 | Milestone.test.ts | 🟡 | 补充 3+ 人顺序 + 真实 eventLog |
| 8.1-8.3 | Tech effects | 🆕 | 新建 |
| 8.4 | TechBonus.test.ts | 🟡 | 补充集成 |
| 9 | FinalScoring/GoldTile | 🟡 | 补充真实 game 数据 |
| 10.1-10.3 | 全流程 | 🆕 | 新建 |
| 10.4 | IncomeSystem.test.ts | 🆕 | 新建 — 收入系统独立验证 |

---

## 预估测试用例总数

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
