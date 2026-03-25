# Task 9-2: 观战模式 + 响应式设计 + 无障碍

## Title
实现观战模式、完善响应式布局和无障碍支持

## 描述
实现完整的观战模式（只读视角、所有手牌隐藏）、完善各断点的响应式布局、以及基础无障碍支持。

## 功能说明

### 观战模式 (`/game/:gameId/spectate`)
- GameContextProvider 检测 spectate 路由 → `isSpectator = true`
- 所有手牌隐藏 (只有 handSize)
- ActionMenu / FreeActionBar / InputRenderer 隐藏
- OpponentSummary 显示所有玩家平等
- 只读 game:state 接收

### 响应式完善
| 断点 | 调整 |
|------|------|
| Desktop ≥1280px | 完整三栏 (已实现) |
| Tablet 768-1279px | 侧边栏 → 底部抽屉 (sheet); 棋盘全宽 |
| Mobile <768px | 单栏; 棋盘 tab 可滑动; 底部栏 → 全屏 sheet |

- 棋盘 SVG 使用 viewBox 自适应
- 卡牌尺寸响应式缩放
- 触摸友好的交互区域 (≥44px tap target)

### 无障碍 (Accessibility)
- 所有交互元素: `aria-label`
- 键盘导航: 卡牌选择 (arrow keys + Enter)
- 色盲友好: 扇区颜色 + 图案 + 文字标签
- 屏幕阅读器: `aria-live` 区域播报游戏事件
- Focus trap: Dialog/Sheet 内 focus 管理

### 涉及文件
- 修改 GameContextProvider (spectator logic)
- 修改 GameLayout (responsive breakpoints)
- 修改各 feature 组件 (a11y attributes)

## 技术实现方案

1. 观战: 路由配置 /game/$gameId/spectate → GamePage with isSpectator
2. 响应式: Tailwind responsive variants + shadcn Sheet for mobile
3. 无障碍: aria-* attributes + keyboard handler + Radix a11y (shadcn built-in)

## 测试要求
- 观战模式: 单测验证 ActionMenu/FreeActionBar/InputRenderer 不渲染
- 响应式: Playwright viewport 测试 (1280px / 768px / 375px)
- 无障碍: axe-core 自动化检查 (vitest-axe 或 Playwright a11y)

## 完成标准
- [ ] 观战模式功能完整
- [ ] 3 个断点布局正确
- [ ] 基础无障碍检查通过
- [ ] 键盘导航工作
