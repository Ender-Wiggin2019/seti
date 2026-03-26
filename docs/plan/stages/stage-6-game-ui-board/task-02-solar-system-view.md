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

## 参考代码 & 静态资源

### 参考文件（重要）
- **`frontend-reference/.../seti/solarSystem.js`** — 核心参考！包含：
  - 32 位置模型：`pos = (distance - 1) * 8 + rot`，distance ∈ {1,2,3,4}，rot ∈ {0..7}
  - `systemPosToCoords()` / `coordsToSystemPos()` — 位置 ID ↔ 坐标转换
  - `getPhysicalRotation(wheel)` — 计算累计旋转角度
  - `rotateWheel()` / `rotateSystem()` — 旋转逻辑（ring 1-3 旋转，ring 4 不旋转）
  - `getPath()` / `moveCost()` — 探针移动路径和成本
  - `evalVisit()` — 进入空间触发效果
- **`frontend-reference/.../seti/components.js`** — `generateWheelPositions(level)` 生成每环 8 个极坐标位置，`getWheelSize(level)` 映射环级到尺寸
- **`frontend-reference/.../seti/highlight.js`** — `isClickable()` 中探针移动的有效目标判定

### 静态资源（可直接复用）
- `wheels/wheel1outline.png` ~ `wheel4outline.png` → 4 个环的轮廓图，可作为 SVG 背景或叠加层
- `wheels/wheel4.png` → ring 4 的填充版本
- `playerTokens/redProbe.png`, `whiteProbe.png`, `purpleProbe.png` → 探针图标
- `playerTokens/redSky.png`, `whiteSky.png`, `purpleSky.png` → 天空标记图标

### SVG 渲染建议
参考 `arch-client.md` §17.4 的 SVG 结构和极坐标转换公式：
```typescript
function spacePosition(ring: number, sectorIndex: number) {
  const radius = RING_RADII[ring]; // e.g. [100, 180, 260, 340]
  const angle = (sectorIndex / 8) * 2 * Math.PI - Math.PI / 2;
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
}
```

## Common Rules Layer 集成

> 详见 `arch-client.md` §4.3 和 `arch-server.md` §4.10。

本任务需要使用 `@ender-seti/common/rules/` 中的纯函数实现零延迟交互：

| 交互场景 | Common 函数 | UI 效果 |
|----------|-------------|---------|
| 探针移动高亮 | `getReachableSpaces()` | 可到达空间脉冲发光 |
| 移动路径预览 | `getMovePath()`, `getMoveCost()` | 虚线路径 + 费用数字 |
| 空间坐标渲染 | `systemPosToCoords()` | 位置 ID → SVG 像素坐标 |
| 点击验证 | `getAdjacentSpaceIds()` | 判断点击目标是否有效 |

```typescript
// SolarSystemView.tsx
import { getReachableSpaces, getMovePath, getMoveCost } from '@ender-seti/common/rules';
import { systemPosToCoords } from '@ender-seti/common/rules';

// 当有移动 pending input 时，高亮可达空间
const reachable = getReachableSpaces(gameState.solarSystem, selectedProbeSpaceId, movementPoints);
```

**注意:** 这些 common 函数由 Task 2-1 实现。如果 2-1 尚未完成，可先用 mock 数据 / hardcoded 占位。

## 完成标准
- [ ] SVG 太阳系正确渲染（使用 wheel outline 静态资源）
- [ ] 3 个圆盘独立旋转
- [ ] 探针正确显示在空间上（使用 probe 静态资源）
- [ ] 空间交互 (click/hover) 工作
- [ ] PlayerInput 高亮集成（使用 common 规则函数）
- [ ] 坐标转换使用 `common/rules/coordinates.ts`
- [ ] 所有单测通过
