# Task 6-1: GamePage 布局 + 响应式 Grid

## Title
实现游戏核心页面布局 (三栏 Grid + TopBar + BottomBar + 响应式)

## 描述
实现 GamePage 作为核心游戏页面的布局编排器，包含 TopBar（回合/阶段/当前玩家）、三栏主体布局（Board Area + Right Sidebar + Bottom Bar）、以及响应式断点适配。

## 功能说明

### GamePage (`/game/:gameId`)
- 路由参数: gameId
- 包裹 GameContextProvider
- 处理 search params (debug, playerId)
- 加载 fallback: REST GET /game/:id/state

### GameLayout
- TopBar: 回合指示器 | 阶段 | 当前玩家 | 计时器
- 三栏布局:
  - 左/中: 主棋盘区域 (tab 切换不同棋盘视图)
  - 右: 侧边栏 (EventLog + OpponentSummary + AlienBoards)
  - 底: 底部栏 (PlayerDashboard + HandView + ActionMenu/InputRenderer)
- FreeActionBar: 底部持久工具栏

### 响应式断点
| 视口 | 布局 |
|------|------|
| Desktop ≥1280px | 完整三栏 |
| Tablet 768-1279px | 侧边栏折叠为底部抽屉 |
| Mobile <768px | 单栏, tab 切换, 底部全屏 sheet |

### Board Sub-View Tabs
- Solar System / Sectors / Planets / Tech / Cards / Aliens / Scoring
- 使用 shadcn Tabs 组件
- 内容区域为后续 task 的组件占位

### 涉及文件
```
packages/client/src/
├── pages/
│   └── game/
│       ├── GamePage.tsx
│       ├── GameLayout.tsx
│       └── GameOverDialog.tsx
├── components/
│   └── layout/
│       ├── TopBar.tsx (游戏内 TopBar)
│       └── Sidebar.tsx
```

## 技术实现方案

1. GamePage: route loader + GameContextProvider 包裹
2. GameLayout: CSS Grid / Flexbox 三栏
3. TopBar: 从 GameContext 读取 round/phase/currentPlayer
4. Board area: shadcn Tabs 骨架 (内容 placeholder)
5. Bottom bar: 三分区 (dashboard / hand / action)
6. Tailwind 响应式: `lg:grid-cols-[1fr_300px]` etc.
7. GameOverDialog: 终局弹窗 (后续 Stage 7 填充)

## 测试要求

### 组件测试 (RTL)
- `GamePage.test.tsx`:
  - 正确创建 GameContextProvider
  - 加载状态显示 spinner
  - gameId 参数传递正确
- `GameLayout.test.tsx`:
  - 三栏布局正确渲染
  - TopBar 信息正确显示 (mock gameState)
  - Tab 切换工作
  - 各区域 placeholder 存在
- 响应式: 使用 matchMedia mock 测试不同断点

### E2E 可行性
- GamePage 加载 → 布局正确 → tab 切换 → 响应式缩放
- 适合 Playwright viewport 测试

## 完成标准
- [ ] GamePage 路由和 Provider 配置正确
- [ ] 三栏布局在桌面端正确显示
- [ ] 响应式断点切换正确
- [ ] Tab 导航工作
- [ ] TopBar 显示游戏状态信息
- [ ] 所有单测通过
