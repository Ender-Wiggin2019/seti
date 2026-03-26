# SETI Project — Task Plan Summary

> 总览：从 `@ender-seti/common` 扩展协议类型，新建 `packages/server` (NestJS) 和 `packages/client` (Vite + React)，实现完整的 SETI 桌游在线版。

### Frontend Reference 说明

`frontend-reference/` 目录提供了可参考的 SETI 游戏实现代码和**可直接复用的静态资源**：

- **参考代码** (`frontend-reference/czech-gaming-online.herokuapp.com/src/projects/seti/`) — 22 个模块，涵盖组件配置、状态机、太阳系模型、科技系统、效果系统等。注意：参考代码使用 CGO 平台的配置化组件引擎，我们使用标准 React 组件。参考代码提供思路和游戏逻辑，不直接复用 UI 代码。
- **静态资源** (`frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/`) — 78 个文件（棋盘背景、太阳系环轮廓、玩家 token、科技 tile、卡背、图标等），可直接复制到 `packages/client/public/assets/seti/`。
- **架构参考** — 详见 `docs/arch/arch-client.md` §17 (Frontend Reference Analysis)，包含模块映射表、组件系统对比、状态机流程、太阳系模型、效果系统分析和完整静态资源目录。

前端任务（Stage 6-9）的每个 task 文件中已添加 **"参考代码 & 静态资源"** 小节，指明该任务可参考的具体文件和可复用的静态资源。

### 架构决策：Common Rules Layer

> **决策时间:** Stage 6-1 实施后
>
> **决策内容:** 纯游戏规则函数（合法性检查、可达空间计算、费用计算等）提取到 `@ender-seti/common/rules/`，Server 和 Client 共用同一套函数。Server 做权威校验，Client 做零延迟乐观 UI。详见 `arch-server.md` §4.10 和 `arch-client.md` §4.3。
>
> **影响范围:**
> - Stage 2 所有任务 — Server 引擎实现时需同步导出纯规则函数到 common
> - Stage 6-7 前端任务 — 使用 common 规则函数做交互高亮和按钮启用判定
> - 已完成的 2-2、2-3 需要 🔄 rework（提取纯函数到 common）

---

## Stage 0: Foundation (基础搭建)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 0-1 | Common 协议类型扩展 | **先行** | ✅ |
| 0-2 | Server 项目脚手架 (NestJS) | 与 0-3 并行 (依赖 0-1) | ✅ |
| 0-3 | Client 项目脚手架 (Vite + React) | 与 0-2 并行 (依赖 0-1) | ✅ |

## Stage 1: Engine Core (引擎核心)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 1-1 | Game 聚合根 + GameOptions + Phase 状态机 | **串行起始** | ✅ |
| 1-2 | Player 子系统 (Resources, Income, Computer, DataPool, Pieces) | 依赖 1-1 | ✅ |
| 1-3 | DeferredAction 队列系统 | 与 1-2 并行 | ✅ |
| 1-4 | PlayerInput 续体系统 | 与 1-2 并行 | ✅ |
| 1-5 | Turn Loop 与回合生命周期 | 依赖 1-1~1-4 | ✅ |

## Stage 2: Board & Actions (棋盘 & 行动)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 2-1 | SolarSystem 棋盘 + 旋转机制 | 与 2-2, 2-3, 2-4 并行 | ⬜ |
| 2-2 | Sector 扇区 + 完成结算 | 与 2-1, 2-3, 2-4 并行 | 🔄 rework: 提取纯规则函数到 common |
| 2-3 | PlanetaryBoard 行星系统 | 与 2-1, 2-2, 2-4 并行 | 🔄 rework: 提取纯规则函数到 common |
| 2-4 | TechBoard + Deck 系统 | 与 2-1, 2-2, 2-3 并行 | ⬜ |
| 2-5 | 8 个 Main Actions 实现 | 依赖 2-1~2-4 | ⬜ |
| 2-6 | 6 个 Free Actions 实现 | 与 2-5 并行 (依赖 2-1~2-4) | ⬜ |

## Stage 3: Cards & Scoring (卡牌 & 计分)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 3-1 | Card 体系 (基类, Behavior DSL, Registry) | **串行起始** | ⬜ |
| 3-2 | 基础卡牌实现 (~10 张代表卡) | 依赖 3-1 | ⬜ |
| 3-3 | Milestone + GoldScoringTile + FinalScoring | 与 3-1 并行 | ⬜ |

## Stage 4: Persistence & Network (持久化 & 网络层)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 4-1 | 序列化/反序列化 (GameSerializer) | **串行起始** | ⬜ |
| 4-2 | Drizzle Schema + Repository + Undo | 依赖 4-1 | ⬜ |
| 4-3 | REST API (Auth + Lobby) | 与 4-2 并行 | ⬜ |
| 4-4 | WebSocket Gateway (game:action/state/waiting) | 依赖 4-1, 4-2 | ⬜ |

## Stage 5: Client Auth & Lobby (客户端认证 & 大厅)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 5-1 | HTTP Client + Auth Store + Auth Pages | **串行起始** | ✅ |
| 5-2 | Lobby 页面 (房间列表 + 创建 + 房间详情) | 依赖 5-1 | ✅ |
| 5-3 | WebSocket Client 集成 (wsClient, useSocket, GameContext) | 与 5-2 并行 | ✅ |

## Stage 6: Game UI — Board Views (游戏 UI — 棋盘视图)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 6-1 | GamePage 布局 + 响应式 Grid | **串行起始** | ✅ |
| 6-2 | SolarSystemView (SVG 同心环) | 与 6-3, 6-4, 6-5 并行 (依赖 6-1) | ⬜ |
| 6-3 | SectorGrid + SectorView | 与 6-2, 6-4, 6-5 并行 | ⬜ |
| 6-4 | PlanetaryBoardView + TechBoardView | 与 6-2, 6-3, 6-5 并行 | ⬜ |
| 6-5 | CardRowView + EndOfRoundStacks + CardDetail | 与 6-2, 6-3, 6-4 并行 | ⬜ |

## Stage 7: Game UI — Interaction (游戏 UI — 交互)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 7-1 | InputRenderer 分发器 + 全部 Input 组件 | **串行起始** | ⬜ |
| 7-2 | ActionMenu + FreeActionBar | 与 7-1 并行 | ⬜ |
| 7-3 | PlayerDashboard (资源, 电脑, 手牌, 任务) | 与 7-1, 7-2 并行 | ⬜ |
| 7-4 | EventLog + OpponentSummary + GameOverDialog | 依赖 7-1~7-3 | ⬜ |

## Stage 8: Alien Expansion (外星种族扩展)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 8-1 | Alien Plugin 接口 + AlienRegistry + 发现流程 | **串行起始** | ⬜ |
| 8-2 | 首个 Alien 实现 (Centaurians) + 验证 | 依赖 8-1 | ⬜ |
| 8-3 | 剩余 Alien 实现 (Anomalies, Exertians, Mascamites, Oumuamua) | 依赖 8-2, 各 alien 间可并行 | ⬜ |
| 8-4 | Alien UI 组件 (AlienBoardView, DiscoveryTrack) | 与 8-2 并行 | ⬜ |

## Stage 9: Polish & E2E (打磨 & 端到端测试)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 9-1 | 动画系统 (旋转, 探针移动, 高亮, token) | 与 9-2, 9-3 并行 | ⬜ |
| 9-2 | 观战模式 + 响应式设计 + 无障碍 | 与 9-1, 9-3 并行 | ⬜ |
| 9-3 | i18n + 性能优化 + 错误处理兜底 | 与 9-1, 9-2 并行 | ⬜ |
| 9-4 | E2E 测试 (Playwright 多玩家完整流程) | 依赖 9-1~9-3 | ⬜ |

---

## Dependency Graph (阶段间依赖)

```
Stage 0 (Foundation)
  ├─→ Stage 1 (Engine Core) ─→ Stage 2 (Board & Actions) ─→ Stage 3 (Cards & Scoring)
  │                                                              │
  │                                                              ↓
  │                                                        Stage 4 (Persistence & Network)
  │                                                              │
  │   ┌──────────────────────────────────────────────────────────┘
  │   ↓
  ├─→ Stage 5 (Client Auth & Lobby) ─→ Stage 6 (Game UI Board) ─→ Stage 7 (Game UI Interaction)
  │                                                                         │
  │                                                                         ↓
  │                                    Stage 8 (Alien Expansion) ←──────────┤
  │                                                                         │
  │                                                                         ↓
  └────────────────────────────────────────────────────────────→ Stage 9 (Polish & E2E)
```

**关键并行路径：**
- Server 路径：Stage 0 → 1 → 2 → 3 → 4 → 8
- Client 路径：Stage 0 → 5 → 6 → 7 → 9
- Client 使用 Mock 数据时，Stage 5~7 可在 Server Stage 4 完成前提前开发
- Stage 8 (Alien) 可在 Server 完成 Stage 3 后、Client 完成 Stage 7 后开始
- Stage 9 (Polish) 是最终汇合阶段

---

## Frontend Reference 模块速查

> 详见 `docs/arch/arch-client.md` §17

| 参考文件 | 用途 | 对应我们的任务 |
|---|---|---|
| `components.js` | 声明式 UI 布局配置 | Stage 6 所有 board 组件 |
| `states.js` | 游戏状态机和交互处理 | 7-1 InputRenderer, 7-2 ActionMenu |
| `solarSystem.js` | 太阳系模型和旋转 | 6-2 SolarSystemView, 9-1 动画 |
| `tech.js` | 科技系统（可复用逻辑） | 6-4 TechBoardView |
| `computer.js` | 数据电脑（可复用逻辑） | 7-3 ComputerView |
| `highlight.js` | 高亮判定 | 7-1 pendingInput 集成 |
| `doEffect.js` | 效果系统 | 7-4 EventLog 图标映射 |
| `look.js` | 扫描行动 | 6-3 SectorGrid |
| `life.js` / `amoebaLife.js` / `alphabetLife.js` | 外星生命 | 8-4 Alien UI |
| `globals.js` | 通用工具函数 | Server-side, 部分 display helper |

### 静态资源速查 (78 files)

| 类别 | 路径 | 数量 | 复用优先级 |
|---|---|---|---|
| 棋盘背景 | `boards/` | 6 | ★★★ |
| 太阳系环 | `wheels/` | 5 | ★★★ |
| 玩家 token | `tokens/` | 9 | ★★★ |
| 科技 tile | `tech/tiles/` | 12 | ★★★ |
| 科技奖励 | `tech/bonuses/` | 9 | ★★ |
| 卡背 | `cards/` | 4 | ★★★ |
| 图标 | `icons/` | 25 | ★★★ |
| 远距奖励 | `distantBonus/` | 4 | ★★ |
| 外星生命 | `lifes/` | 3 | ★★ |
| 公司 | `corporations/` | 2 | ★ |
