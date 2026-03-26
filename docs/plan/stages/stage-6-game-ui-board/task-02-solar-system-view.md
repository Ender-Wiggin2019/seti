# Task 6-2: SolarSystemView (静态资源同心环)

## Title
实现太阳系静态资源可视化 (同心环 + 圆盘 + 探针 + 交互)

## 描述
实现客户端的太阳系棋盘可视化组件。使用前端参考项目的静态资源（wheel PNG + token PNG）进行图层化渲染，不再要求 SVG。支持点击空间进行移动交互，以及 PlayerInput 高亮。

## 功能说明

### SolarSystemView
- 相对定位容器，随父容器缩放
- 渲染同心环图层（ring 4 固定，ring 1-3 可旋转）
- 每个空间使用绝对定位的交互热点（button/div）
- 探针 token 使用 PNG 图标渲染在对应空间上

### WheelLayer
- 单个可旋转圆盘的图层组件（`<img>`）
- CSS `transform: rotate()` 驱动旋转动画
- 包含属于此圆盘的空间热点映射

### ProbeToken
- 玩家颜色的探针 PNG 图标
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
├── WheelLayer.tsx
├── WheelLayer.test.tsx
├── ProbeToken.tsx
└── ProbeToken.test.tsx
```

## 技术实现方案

1. SolarSystemView: 外层相对定位容器 + 固定宽高比（`aspect-square`）
2. ring 图层: 使用 `wheels/wheel1outline.png` ~ `wheel4.png`
3. 空间热点: 使用 `systemPosToCoords()` + 极坐标换算生成绝对定位 click target
4. WheelLayer: `<img>` + `transform: rotate(angle * 45deg)`
5. ProbeToken: 按玩家颜色映射 `playerTokens/*Probe.png`
6. 交互: onClick handler on spaces → sendFreeAction / sendInput
7. 高亮: 可到达空间使用脉冲边框或发光遮罩（不依赖 SVG）

## 实施拆分（先细化）

### Step A: 资源与底座（最小可见）
- 建立 `SolarSystemView` 容器，固定 1:1 比例，接入 `wheels/` 4 层图片
- 输出 `WheelLayer`，支持按 `disc.angle` 做 45° 步进旋转
- 先完成纯展示，不接交互

### Step B: 空间热点与坐标映射
- 基于 32 个 space（4 环 x 8 方位）生成绝对定位热点
- 使用 `systemPosToCoords` 思路 + 极坐标换算，保证热点与轮盘视觉对齐
- 为每个热点添加 `data-testid`，方便 RTL/Playwright 定位

### Step C: 探针渲染与玩家颜色映射
- 输出 `ProbeToken`，按玩家颜色映射 `tokens/probes/*.png`
- 支持同空间多探针错位显示
- 保持 token 层级高于轮盘和热点

### Step D: 交互与高亮
- 点击己方探针所在空间进入“选中”状态
- 基于 `adjacency` 高亮可达空间；点击可达空间触发 `sendFreeAction(MOVEMENT)`
- 保留 hover 信息（spaceId / probe 数）用于调试和可用性

### Step E: 测试与 GameLayout 集成
- `SolarSystemView.test.tsx`：32 热点渲染、移动回调、高亮状态
- `WheelLayer.test.tsx` / `ProbeToken.test.tsx`：角度与资源映射校验
- 将 `GameLayout` 的 Board Tab 从占位块替换为 `SolarSystemView`

## 测试要求

### 组件测试 (RTL)
- `SolarSystemView.test.tsx`:
  - 渲染正确数量的空间热点（32 个）
  - 探针 token 在正确位置
  - 可交互空间有 click handler
  - 不可交互空间无 click handler
- `WheelLayer.test.tsx`:
  - 旋转角度正确应用 transform
  - 图层资源路径映射正确
- `ProbeToken.test.tsx`:
  - 正确颜色渲染
  - 位置样式正确

### E2E 可行性
- 图层交互: 点击空间热点 → 探针移动 → 状态更新
- Playwright 通过 `data-testid` 或角色选择器定位空间热点

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
- `wheels/wheel1outline.png`, `wheel2outline.png`, `wheel3outline.png`, `wheel4.png` → 太阳系 4 层环盘图，可直接做图层渲染
- `playerTokens/redProbe.png`, `whiteProbe.png`, `purpleProbe.png` → 探针图标
- `playerTokens/redSky.png`, `whiteSky.png`, `purpleSky.png` → 天空标记图标

### 图层渲染建议
参考 `arch-client.md` §17.4 的极坐标转换公式（用于空间热点和 token 定位）：
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
- [x] 太阳系图层正确渲染（使用 wheel outline 静态资源）
- [x] 3 个圆盘独立旋转
- [x] 探针正确显示在空间上（使用 probe 静态资源）
- [x] 空间交互 (click/hover) 工作
- [x] PlayerInput/选择态高亮集成（基于 adjacency 可达空间）
- [x] 坐标转换使用统一极坐标规则（与 common 规则保持一致）
- [x] 所有单测通过
