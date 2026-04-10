# SETI 项目架构深度审计报告（代码级验证）

> 本次审计基于逐文件代码阅读，不依赖 TODO list 的状态标记。

---

## 一、卡牌系统 — 大量卡牌效果未实现

### 1.1 注册方式分析

卡牌注册分两类：
- **Bespoke (专属实现)**: 有独立 `.ts` 文件和自定义逻辑（33 张）
- **Generic (`g()`)**: 走 `createGenericCard()` → `BehaviorExecutor` 通用管线

**关键问题**：`BehaviorExecutor` 只处理 `EEffectType.BASE` 类型效果。对于 `EEffectType.CUSTOMIZED`（即 `DESC` 效果），它将 desc 字符串作为 `customId` 放入 `custom[]` 数组，然后在执行时查找 `customHandlers`。但 **没有任何地方注册过自定义 handler**（`defaultBehaviorExecutor` 从未调用 `registerCustomHandler`）。

这意味着所有 generic 卡的 DESC 效果在执行时都会触发：
```typescript
createActionEvent(player.id, 'CARD_CUSTOM_EFFECT_UNHANDLED', { cardId, customId })
```

### 1.2 受影响的卡牌（约 70+ 张走 Generic 但含 DESC）

**基础卡 UNHANDLED DESC（约 55 张）**：
| 类别 | 卡号 | 问题 |
|---|---|---|
| Flyby (19-29, 11张) | `g(19)` ~ `g(29)` | MOVE 生效但 DESC bonus（经过行星时额外奖励）被忽略 |
| Scan+DESC (52-55, 4张) | `g(52)` ~ `g(55)` | SCAN 生效但 DESC 自定义扫描行为被忽略 |
| Tech+DESC (67,119, 2张) | `g(67)`, `g(119)` | 科技研究生效但额外 DESC 效果被忽略 |
| Launch+DESC (9,74,133, 3张) | `g(9)` 等 | 发射生效但 DESC（如忽略探针限制）被忽略 |
| Land+DESC (13, 1张) | `g(13)` | 着陆生效但 DESC 特殊效果被忽略 |
| Move+DESC (123-125, 3张) | `g(123)` ~ `g(125)` | MOVE 生效但 DESC 被忽略 |
| Resource+DESC (11,15,75,92,114, 5张) | 各种 | 基础资源生效但 DESC 被忽略 |
| Pure DESC (17-18,30,73,84,90-91,93,98-100,108,120,122, 14张) | 纯 DESC 卡 | **整张卡完全无效果**，打出来什么都不做 |
| Observation+DESC+EG (38,40,42,44, 4张) | 信号+定位 | 信号标记可能不走正确扇区 |
| Land+DESC+EG (12, 1张) | Europa Clipper | 着陆生效但 DESC 月球相关效果被忽略 |
| Tech+OR+DESC+EG (126, 1张) | Euclid Telescope | OR 选择逻辑可能不完整 |

### 1.3 显式标记为 UNHANDLED 的效果

代码中明确用 `TODO: UNHANDLED_EFFECT` 标注的：
| 效果类型 | 涉及卡牌 | 说明 |
|---|---|---|
| `display-card-signal` | 基础卡 45-47, 65, 86 (5张) | 从展示区卡牌颜色标记信号 — 完全未实现 |
| `any-signal` | 基础卡 83, 118; SA.22, SA.37; ET.20, ET.23 (6张) | 任意扇区信号标记 — 未实现 |
| `signal-token` | SA.3, SA.4, SA.35, SA.41 (4张) | 信号 token 操作 — 未实现 |
| `exofossil` | ET.26, ET.29 (2张) | 外星化石系统 — 未实现 |
| `glyph-*` | SA Alien 多张 | 外星符文系统 — 未实现 |
| `organelle-*` | SA Alien 多张 | 外星细胞器系统 — 未实现 |

### 1.4 Alien 卡牌（55 张 — 全部走 Generic，几乎全部有 DESC）

`registerAlienCards.ts` 注册了 ET.1-ET.55 全部走 `g()`。这些卡涉及外星种族特有机制（sample pickup, exofossil, glyph, organelle 等），**全部无法正确执行外星专属效果**。它们的基础效果（MOVE, LAUNCH, TECH 等）可以工作，但核心外星交互完全缺失。

### 1.5 结论：卡牌完成度

| 类别 | 注册数 | 真正可用 | 完成度 |
|---|---|---|---|
| 基础卡（有专属实现） | 33 | ~33 | ~100% |
| 基础卡（Generic + 纯基础效果） | ~15 | ~15 | ~100% |
| 基础卡（Generic + DESC） | ~55 | 基础效果可用，DESC 无效 | ~40% |
| 基础卡（UNHANDLED 效果） | ~5 | 效果缺失 | ~20% |
| Space Agency 卡 | 42 | 基础效果可用，~20张有 DESC/UNHANDLED | ~50% |
| Alien 卡 | 55 | 基础效果可用，外星机制全缺 | ~15% |

**综合卡牌完成度：约 45%**（按效果正确性计算，不是按注册数计算）

---

## 二、前端 UI 与后端联动 — 发现的问题

### 2.1 Aliens Tab — 纯占位符

`GameLayout.tsx` 第 294-299 行：
```tsx
<TabsContent value='aliens' className='mt-0 h-full'>
  <BoardPlaceholder
    title='Aliens'
    description='Discovery track and species-specific boards after discovery.'
  />
</TabsContent>
```
**只有文字占位，没有任何数据绑定或交互组件。** 尽管后端已经通过 `projectGameState` 返回了 `aliens` 数据（包含 slots、occupants、discovery 状态），前端完全没有渲染。

### 2.2 Scoring Tab — 仅简单排名，非完整计分板

`GameLayout.tsx` 第 301-327 行：
```tsx
<TabsContent value='scoring' className='mt-0 h-full'>
  <BoardPlaceholder title='Scoring' description='...' >
    {/* 只展示了玩家名+总分，没有里程碑、金色计分砖选择、中立标记 */}
  </BoardPlaceholder>
</TabsContent>
```
尽管有 `features/scoring/MilestoneTrack.tsx`, `GoldTileSelector.tsx`, `ScoreBreakdown.tsx`，但它们 **没有在 GameLayout 中被引用**。

### 2.3 收入信息（Income）未从后端传递

`GameLayout.tsx` 第 489-492 行：
```tsx
income={{
  credit: extendedPlayer?.creditIncome ?? 0,
  energy: extendedPlayer?.energyIncome ?? 0,
}}
```
但 `IPublicPlayerState` 中 **没有 `creditIncome` / `energyIncome` 字段**。检查 `toPublicPlayerState()` 也没有序列化收入数据。所以 **PlayerDashboard 的 Income 显示永远是 0**。

### 2.4 playedMissions 未从后端传递

```tsx
const missionCards = extendedPlayer?.playedMissions ?? [];
```
`IPublicPlayerState` 中 **没有 `playedMissions` 字段**。虽然 `serializePlayer()` 中序列化了 `playedMissions`，但那是持久化 DTO，不是 public projection。`toPublicPlayerState()` 完全没有包含 missions 数据。所以：
- `PlayedMissions` 组件始终显示空
- `CompleteMission` 自由行动无法从前端正确选择任务

### 2.5 endGameCards / tuckedIncomeCards 未在 Public State 暴露

同理，`toPublicPlayerState()` 没有传出这些字段，前端的 IncomeTracker 等组件缺少真实数据。

### 2.6 Exchange Resources 和 Convert Energy 前端只显示 toast

`BottomBar` 中的 FreeActionBar 对 `EXCHANGE_RESOURCES` 和 `CONVERT_ENERGY_TO_MOVEMENT` 仅弹出 toast 提示"需要额外选择"，**没有实现真正的交互选择 UI**（应该让用户选择资源类型和数量）。

### 2.7 Place Data 硬编码 slotIndex=0

```tsx
sendFreeAction({ type: EFreeAction.PLACE_DATA, slotIndex: 0 });
```
**始终放在第一个位置**，没有让用户选择放到哪一列（应按规则从左到右，但用户需要选择）。

### 2.8 EventLog — 存在组件但实际未在 GameLayout 中使用

`features/log/EventLog.tsx` 和 `EventEntry.tsx` 存在，但 GameLayout 中 **没有任何地方渲染 EventLog 组件**。玩家无法看到游戏事件历史。

### 2.9 OpponentSummary — 存在组件但 Sidebar 未知是否引用

需要验证 `Sidebar.tsx` 是否真正使用了 `OpponentSummary`。

---

## 三、后端引擎 — 发现的细节问题

### 3.1 PlaceData 中 tuckIncome 的 TODO

`freeActions/PlaceData.ts` 第 91 行：
```typescript
// TODO: tuck income requires a deferred player choice (select card to tuck).
```
当电脑槽位触发 tuck income 奖励时，玩家应该选择手牌中的一张来 tuck，但当前未实现该选择流程。

### 3.2 markTrace 效果未通过 AlienState

`BehaviorExecutor.buildMarkTraceAction` 直接修改 `player.traces[]`，但 **没有调用 `AlienState.createTraceInput`** 来让玩家选择放在哪个外星人的哪个发现槽上。规则要求每获得一个 trace 时，必须放置标记在对应外星人的发现空间。

### 3.3 没有服务端测试文件在 src 中

测试全在 `__tests__/` 目录下（120+ 文件），这本身没问题。但部分测试（如 `AreciboObservatoryCard.test.ts`）引用了不存在的卡牌实现文件 — 这可能是写了测试但没完成实现。

---

## 四、序列化/反序列化 — 潜在不完整

### 4.1 Public State 缺失字段汇总

`IPublicPlayerState` 中 **缺失** 的关键信息：

| 缺失字段 | 影响 |
|---|---|
| `income` (base + tucked) | 前端无法显示收入情况 |
| `playedMissions` | 前端无法显示/操作已打出的任务 |
| `completedMissions` | 前端无法显示已完成任务 |
| `endGameCards` | 前端无法显示已打出的终局计分卡 |
| `tuckedIncomeCards` | 前端无法显示 tucked 了哪些卡 |
| `milestoneState` | 前端无法显示里程碑进度（25/50/70 和 20/30） |
| `goldScoringTiles` | 前端无法显示金色计分砖状态 |
| `firstPassOccurred` | 前端无法判断该轮是否已有人首 pass |

---

## 五、修正后的完成度评估

### 按功能域

| 域 | 之前估计 | 实际评估 | 核心差距 |
|---|---|---|---|
| 技术框架 (monorepo/build) | 100% | **100%** | 无 |
| 认证/登录 | 100% | **100%** | 无 |
| 大厅系统 | 100% | **95%** | 缺少准备状态等小功能 |
| WebSocket 通信 | 100% | **90%** | 核心通道完整，但部分事件类型前端未处理 |
| 持久化 | 100% | **85%** | 序列化/反序列化实现了，但 Deserializer 恢复游戏是否完全正确未验证 |
| 游戏引擎核心 | 100% | **85%** | Phase/Turn/Deferred/Input 完整，但 markTrace 路径不完整 |
| 8 主行动 | 100% | **90%** | 全部接入，但个别细节有 TODO |
| 7 自由行动 | 90% | **75%** | PlaceData tuck未完成，ExchangeResources/ConvertEnergy 前端缺交互 |
| 12 科技 | 100% | **90%** | 基本完整，个别效果可能有边界问题 |
| **卡牌系统** | **100%** | **45%** | ~70 张卡的 DESC 效果无法执行；15+ 张 UNHANDLED |
| 里程碑/计分 | 100% | **80%** (引擎) / **30%** (前端) | 引擎有实现但前端未展示 |
| 外星种族 | 15% | **10%** | 框架存在但 0/5 种族实现，alien 卡全部空转 |
| **前端-后端联动** | **100%** | **60%** | 多个关键数据未从 PublicState 暴露，多个 Tab 是占位符 |

### 按 Stage 重新评估

```
Stage 0  Foundation          ✅ 100%
Stage 1  Engine Core         ✅ 95%  (markTrace 路径问题)
Stage 2  Board & Actions     ✅ 90%  (个别 TODO)
Stage 2.5 Tech Effects       ✅ 90%
Stage 3  Cards & Scoring     ⚠️ 45%  (大量 DESC 未实现，计分前端缺)
Stage 4  Persistence & Net   ✅ 85%  (PublicState 字段缺失)
Stage 5  Client Auth & Lobby ✅ 95%
Stage 6  Game UI Board       ⚠️ 75%  (Aliens/Scoring Tab 占位符)
Stage 7  Game UI Interaction ⚠️ 65%  (多个自由行动缺交互, 数据不完整)
Stage 8  Alien Expansion     ❌ 10%
Stage 9  Polish & E2E        ❌ 10%
```

**整体进度：约 65%**（不是之前估计的 85%）

---

## 六、优先修复清单（按严重度排序）

### P0 — 会导致游戏无法正常玩

1. **补全 `IPublicPlayerState` 缺失字段** — income, playedMissions, completedMissions, endGameCards, tuckedIncomeCards
2. **修复 BehaviorExecutor.markTrace** — 必须通过 `AlienState.createTraceInput` 路径让玩家选择放置位置
3. **补全 `IPublicGameState` 缺失字段** — milestoneState, goldScoringTiles
4. **纯 DESC 卡牌（14 张）空转修复** — 这些卡打出来什么效果都没有

### P1 — 核心玩法不完整

5. **实现 `display-card-signal` 效果** — 影响 5 张基础卡
6. **实现 `any-signal` 效果** — 影响 6 张卡
7. **实现 Flyby DESC 效果** — 11 张飞掠卡的行星经过奖励
8. **前端 Aliens Tab** — 连接已有的后端数据，展示发现轨道
9. **前端 Scoring Tab** — 引入已有的 MilestoneTrack, GoldTileSelector, ScoreBreakdown
10. **Exchange Resources / Convert Energy** — 实现前端选择 UI
11. **PlaceData tuck income 选择** — 实现手牌选择流程

### P2 — 功能缺失但不阻断核心流程

12. **Scan+DESC 卡牌** — 4 张自定义扫描行为
13. **Launch/Land/Tech+DESC 卡牌** — 各类特殊效果
14. **EventLog 渲染** — 在 GameLayout 中引入
15. **PlaceData 用户选择列** — 替代硬编码 slotIndex=0
16. **signal-token 效果** — SA 卡牌专属
17. **5 个外星种族具体实现**

### P3 — 打磨

18. 动画系统
19. 响应式设计
20. i18n
21. 完整 E2E 测试
