# SETI Project — Task Plan Summary

> 总览：从 `@ender-seti/common` 扩展协议类型，新建 `packages/server` (NestJS) 和 `packages/client` (Vite + React)，实现完整的 SETI 桌游在线版。

---

## Stage 0: Foundation (基础搭建)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 0-1 | Common 协议类型扩展 | **先行** | ✅ |
| 0-2 | Server 项目脚手架 (NestJS) | 与 0-3 并行 (依赖 0-1) | ✅ |
| 0-3 | Client 项目脚手架 (Vite + React) | 与 0-2 并行 (依赖 0-1) | 🔨 |

## Stage 1: Engine Core (引擎核心)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 1-1 | Game 聚合根 + GameOptions + Phase 状态机 | **串行起始** | ⬜ |
| 1-2 | Player 子系统 (Resources, Income, Computer, DataPool, Pieces) | 依赖 1-1 | ⬜ |
| 1-3 | DeferredAction 队列系统 | 与 1-2 并行 | ⬜ |
| 1-4 | PlayerInput 续体系统 | 与 1-2 并行 | ⬜ |
| 1-5 | Turn Loop 与回合生命周期 | 依赖 1-1~1-4 | ⬜ |

## Stage 2: Board & Actions (棋盘 & 行动)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 2-1 | SolarSystem 棋盘 + 旋转机制 | 与 2-2, 2-3, 2-4 并行 | ⬜ |
| 2-2 | Sector 扇区 + 完成结算 | 与 2-1, 2-3, 2-4 并行 | ⬜ |
| 2-3 | PlanetaryBoard 行星系统 | 与 2-1, 2-2, 2-4 并行 | ⬜ |
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
| 5-1 | HTTP Client + Auth Store + Auth Pages | **串行起始** | ⬜ |
| 5-2 | Lobby 页面 (房间列表 + 创建 + 房间详情) | 依赖 5-1 | ⬜ |
| 5-3 | WebSocket Client 集成 (wsClient, useSocket, GameContext) | 与 5-2 并行 | ⬜ |

## Stage 6: Game UI — Board Views (游戏 UI — 棋盘视图)

| # | Task | 并行/串行 | 状态 |
|---|------|----------|------|
| 6-1 | GamePage 布局 + 响应式 Grid | **串行起始** | ⬜ |
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
