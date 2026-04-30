# Task 6-4: PlanetaryBoardView + TechBoardView

## Title
实现行星面板视图和科技面板视图

## 描述
实现两个棋盘 tab 视图：PlanetaryBoardView（显示各行星轨道/着陆槽位）和 TechBoardView（12 个科技堆叠 + 2VP 标记）。

## 功能说明

### PlanetaryBoardView
- 每个行星一张卡片/区域
- 显示: 轨道占位列表 + 着陆占位列表
- 首次到达奖励标记
- 月球区域 (锁定/解锁 + 占位)
- SelectPlanet input 时高亮可选行星

### PlanetCard (单个行星)
- 行星名称 + 图标
- 轨道区: 已有 orbiter tokens (玩家颜色)
- 着陆区: 已有 lander tokens
- 奖励标记 (已领取灰显)
- 月球区域

### TechBoardView
- 12 个科技堆叠的网格 (4×3, 按颜色分组)
- 每个堆叠显示: 剩余数量 + 2VP 可用 + 已取走玩家

### TechStack (单个堆叠)
- 科技类型名称
- tile 堆叠视觉 (显示剩余数量)
- 2VP tile 状态 (有/无)
- 已获取玩家标记
- SelectTech input 时高亮可选堆叠

### 数据映射
- `gameState.planetaryBoard` → PlanetaryBoardView
- `gameState.techBoard` → TechBoardView

### 涉及文件
```
packages/client/src/features/board/
├── PlanetaryBoardView.tsx
├── PlanetaryBoardView.test.tsx
├── PlanetCard.tsx
├── PlanetCard.test.tsx
├── TechBoardView.tsx
├── TechBoardView.test.tsx
├── TechStack.tsx
└── TechStack.test.tsx
```

## 技术实现方案

1. PlanetaryBoardView: Grid/Flex 布局各行星
2. PlanetCard: shadcn Card + 内部区域
3. TechBoardView: 4×3 Grid 按颜色行分组
4. TechStack: 堆叠视觉 + 状态 badge
5. 交互: PlayerInput highlight 同 SectorView 模式

## 测试要求
- `PlanetaryBoardView.test.tsx`:
  - 正确渲染所有行星
  - 轨道/着陆 token 正确按玩家颜色显示
  - 首次奖励状态正确
  - SelectPlanet input 高亮
- `TechBoardView.test.tsx`:
  - 12 个堆叠正确渲染
  - 2VP 可用状态显示
  - 已取走标记
  - SelectTech input 高亮

## 参考代码 & 静态资源

### 参考文件
- **`frontend-reference/.../seti/tech.js`** — 可直接复用的逻辑：
  - `hasTech()`, `canUseTech()`, `canAcquireTech()` — 科技状态判定
  - `upgradeTech()`, `upgradeTechSideEffects()` — 升级效果（包含 `rotateSystem` 触发）
  - `techStatId()` — 科技统计 ID
  - 3 条科技线路：`comp`(电脑)、`fly`(飞行)、`look`(观测)，每线 4 级
- **`frontend-reference/.../seti/components.js`** — 搜索 `technologyBoard` 和 `techTile`，理解科技面板的布局配置
- **`frontend-reference/.../seti/solarSystem.js`** — `allPlanets` 行星列表，`evalVisit()` 中行星访问效果

### 静态资源
**行星面板：**
- `planetBoard-SE0.4.0.jpg` → 行星面板完整图片 ★★★

**科技面板：**
- `techTiles/techComp1-4.webp` → 电脑线路 4 级 tile
- `techTiles/techFly1-4` (.webp/.jpg) → 飞行线路 4 级 tile
- `techTiles/techLook1-4` (.webp/.jpg) → 观测线路 4 级 tile
- `techBonus/tech1.png`, `tech3.png`, `tech4.png`, `tech6.png` → 科技奖励标记
- `techBonus/techRotation1-3.png` → 旋转奖励标记
- `techBonus/data.png`, `launch.png` → 数据/发射奖励
- `2vpToken.png` → 2VP token

**玩家 token：**
- `playerTokens/redProbe.png`, `whiteProbe.png`, `purpleProbe.png` → 用于轨道/着陆显示

## 完成标准
- [ ] PlanetaryBoardView 完整渲染（使用 planetBoard 背景图）
- [ ] TechBoardView 完整渲染（使用 tech tile 静态资源）
- [ ] 交互高亮工作
- [ ] 所有单测通过
