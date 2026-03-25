# Task 6-2: SolarSystemView (SVG 同心环)

## Title
实现太阳系 SVG 可视化 (同心环 + 圆盘 + 探针 + 交互)

## 描述
实现客户端的太阳系棋盘可视化组件。使用 SVG 渲染同心环结构、3 个可旋转圆盘、探针 token、行星空间、宣传图标等。支持点击空间进行移动交互，以及 PlayerInput 高亮。

## 功能说明

### SolarSystemView
- SVG 容器，随父容器缩放
- 渲染同心环（外圈静态，内部 3 个圆盘）
- 每个空间为 SVG 元素 (circle/rect)
- 探针 token 渲染在对应空间上

### DiscLayer
- 单个可旋转圆盘的 SVG group
- CSS `transform: rotate()` 驱动旋转动画
- 包含属于此圆盘的空间

### ProbeToken
- 玩家颜色的探针图标
- 放置在空间坐标上

### 空间交互
- Hover: 显示空间信息 tooltip
- Click: 
  - 移动模式: 点击相邻空间移动探针
  - SelectSector input: 点击选择扇区
- PlayerInput 高亮: 可到达空间脉冲发光

### 数据映射
- 从 `gameState.solarSystem` 读取:
  - spaces (位置, 类型, 占用)
  - disc angles (旋转角度)
  - probes (哪个玩家在哪个空间)
  - adjacency (高亮可到达空间)

### 涉及文件
```
packages/client/src/features/board/
├── SolarSystemView.tsx
├── SolarSystemView.test.tsx
├── DiscLayer.tsx
├── DiscLayer.test.tsx
├── ProbeToken.tsx
└── ProbeToken.test.tsx
```

## 技术实现方案

1. SolarSystemView: 外层 `<svg viewBox="...">` 容器
2. 每个环用 `<circle>` 绘制
3. 空间用 `<circle>` 或 `<rect>` 放在极坐标计算的位置
4. DiscLayer: `<g transform="rotate(angle)">` 包裹圆盘空间
5. ProbeToken: 玩家颜色 circle + 标识
6. 交互: onClick handler on spaces → sendFreeAction / sendInput
7. 高亮: `cn('ring-2 ring-yellow-400 animate-pulse')` 类名

## 测试要求

### 组件测试 (RTL)
- `SolarSystemView.test.tsx`:
  - 渲染正确数量的空间元素
  - 探针 token 在正确位置
  - 可交互空间有 click handler
  - 不可交互空间无 click handler
- `DiscLayer.test.tsx`:
  - 旋转角度正确应用 transform
  - 包含正确的子空间
- `ProbeToken.test.tsx`:
  - 正确颜色渲染
  - 位置属性正确

### E2E 可行性
- SVG 交互: 点击空间 → 探针移动 → 状态更新
- Playwright 可通过 SVG selector 定位元素

## 完成标准
- [ ] SVG 太阳系正确渲染
- [ ] 3 个圆盘独立旋转
- [ ] 探针正确显示在空间上
- [ ] 空间交互 (click/hover) 工作
- [ ] PlayerInput 高亮集成
- [ ] 所有单测通过
