# Task 9-1: 动画系统

## Title
实现游戏动画 (旋转, 探针移动, token 放置, 高亮脉冲)

## 描述
为游戏 UI 添加流畅的动画效果，让游戏操作有视觉反馈和生命力。

## 功能说明

### 旋转动画
- 太阳系圆盘旋转: CSS `transform: rotate()` transition
- 旋转持续时间: 800ms (theme.animation.rotationDuration)
- 监听 `game:event { type: 'ROTATION' }` 触发

### 探针移动动画
- 探针从 A 空间到 B 空间的平滑过渡
- 持续时间: 400ms (theme.animation.tokenMoveDuration)
- 使用 CSS transition 或 FLIP 动画

### Token 放置动画
- 数据 token 放置到电脑: scale 弹性
- 标记放置到扇区: fade-in + scale
- 轨道/着陆 token: slide-in

### 高亮脉冲
- PlayerInput 可选目标: 1.5s 循环 pulse
- 使用 `animate-pulse` Tailwind class
- 边框发光: `ring-2 ring-yellow-400`

### 数字变化动画
- 资源/分数变化: 数字滚动
- +/- 弹出 indicator

### 涉及文件
- 修改现有的 board/player/input 组件添加动画
- 新建动画工具 hook (useAnimation, useTransitionState)

## 技术实现方案

1. 圆盘旋转: CSS transition on transform
2. 探针移动: React state + CSS transition 或 Framer Motion (可选)
3. Token 放置: CSS keyframes + Tailwind animate
4. 高亮: Tailwind animate-pulse + ring utilities
5. 数字: requestAnimationFrame counter 或 CSS counter

## 测试要求
- 动画类测试主要依赖 E2E / 视觉回归
- 单测验证: 动画状态 hook 的状态转换正确
- 不测试动画视觉效果本身

## 参考代码

### 参考文件
- **`frontend-reference/.../seti/solarSystem.js`** — `rotateWheel()`, `rotateSystem()` — 旋转逻辑，包括哪些 token 随旋转移动、哪些被推动
- **`frontend-reference/.../seti/highlight.js`** — `isClickable()` 返回 `"animated"` 标志，指示需要脉冲动画的元素
- **`frontend-reference/.../seti/components.js`** — `variables.rotation` 定义了旋转变量域 (0..7)，条件渲染 `__cond_transform` 展示了旋转变换的条件逻辑

### 动画触发映射
| game:event type | 动画 | 参考 |
|---|---|---|
| `ROTATION` | 圆盘 CSS rotate transition | `solarSystem.js` rotateWheel |
| `PROBE_MOVE` | 探针位移 transition | `solarSystem.js` getPath |
| `TOKEN_PLACE` | scale + fade-in | `computer.js` addDataToComputer |
| `SCORE_CHANGE` | 数字滚动 + 弹出 indicator | `doEffect.js` vp 效果 |

## 完成标准
- [ ] 旋转动画流畅
- [ ] 探针移动平滑
- [ ] Token 放置有视觉反馈
- [ ] 高亮脉冲清晰可见
- [ ] 不影响 60fps 性能
