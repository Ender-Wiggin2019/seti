# Task 7-3: PlayerDashboard

## Title
实现玩家仪表盘 (资源, 电脑, 数据池, 手牌, 任务, 科技)

## 描述
实现当前玩家的完整仪表盘区域，显示所有个人状态：资源余额、收入追踪、数据电脑、数据池、棋子库存、手牌、已打出任务和已获取科技。

## 功能说明

### PlayerDashboard (容器)
- 底部栏左侧区域
- 包含所有玩家个人状态子组件

### ResourceBar
- 信用 / 能量 / 宣传 / 分数
- 数字 + 图标
- 变化时动画 (数字跳动)

### IncomeTracker
- 每轮收入显示 (基础 + 塞入卡)
- 区分信用收入和能量收入

### ComputerView
- 数据电脑: 上排槽位 + 下排槽位
- 每个槽位显示: 空/有数据 token
- 可拖放 (PlaceData free action)
- 覆盖奖励提示

### DataPoolView
- 数据池 (上限 6)
- 当前数量 / 最大数量
- 溢出警告

### PieceInventory
- 可用探针 / 轨道者 / 着陆者 / 扇区标记
- 已部署数量

### HandView
- 手牌扇形布局或网格布局
- 使用 CardRender 渲染
- hover 预览放大
- SelectCard input 时可选择

### PlayedMissions
- 已打出的任务卡列表
- 显示条件/触发状态
- hover 看详情

### TechDisplay
- 已获取的科技 tile
- 按类型分组

### 涉及文件
```
packages/client/src/features/player/
├── PlayerDashboard.tsx  + test
├── ResourceBar.tsx      + test
├── IncomeTracker.tsx    + test
├── ComputerView.tsx     + test
├── DataPoolView.tsx     + test
├── PieceInventory.tsx   + test
├── HandView.tsx         + test
├── PlayedMissions.tsx   + test
├── TechDisplay.tsx      + test
└── OpponentSummary.tsx  + test
```

## 技术实现方案

1. PlayerDashboard: Flex 容器编排子组件
2. ResourceBar: 图标 + 数字 badge
3. ComputerView: Grid 布局槽位, onclick/drag for PlaceData
4. HandView: CSS Grid 或 Flex + transform for fan layout
5. 各组件从 `gameState.players[me]` 读取数据
6. React.memo 优化: 每个子组件 memo + selector hook

## 测试要求
- `ResourceBar.test.tsx`: 正确数值显示, 各资源图标
- `ComputerView.test.tsx`: 槽位状态, 放置交互
- `DataPoolView.test.tsx`: 数量/上限显示, 满时样式
- `HandView.test.tsx`: 卡牌渲染, 选择模式交互
- `PlayerDashboard.test.tsx`: 所有子组件正确渲染

## 参考代码 & 静态资源

### 参考文件
- **`frontend-reference/.../seti/computer.js`** — 可直接参考的逻辑：
  - `posAvailable()` — 判断电脑槽位是否可放
  - `compPosToDataPos()` — 电脑位置到数据位置映射
  - `getComputerReward()` — 放置数据后的奖励预览
  - `addDataToComputer()` — 数据放置逻辑
  - `clearComputer()` — 清空电脑逻辑
- **`frontend-reference/.../seti/components.js`** — `playerBoard` 的完整布局配置：
  - `clickableAreas` — 玩家面板上各可点击区域
  - `positions` — 资源计数器、探针、标记、卡牌的位置定义
  - 条件渲染规则（`__cond_image` 等根据玩家颜色/状态切换显示）
- **`frontend-reference/.../seti/globals.js`** — `getPlayerBoard()`, `countThing()` — 获取玩家面板和统计数据的工具函数

### 静态资源
- `playerboardSE0.0.B.png` → 玩家面板背景图 ★★★
- `playerTokens/data.png` → 数据 token
- `icons/money.png`, `energy.png`, `pop.png`, `vp.png` → 资源图标
- `icons/income.png` → 收入图标
- `icons/missionSatellite.png` → 任务标记
- `icons/questsComplete.png` → 任务完成标记
- `icons/progress.png` → 进度图标
- `distantBonus/bonus1-4.png` → 远距奖励（玩家面板上的成就区域）

## 完成标准
- [ ] 所有玩家状态子组件实现（使用 playerBoard 背景图和资源图标）
- [ ] 数据正确映射到 UI
- [ ] ComputerView 使用参考逻辑实现槽位交互
- [ ] 手牌交互完整
- [ ] 所有单测通过
