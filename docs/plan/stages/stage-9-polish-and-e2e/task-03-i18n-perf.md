# Task 9-3: i18n + 性能优化 + 错误处理兜底

## Title
实现国际化、性能优化和全面的错误处理

## 描述
添加完整的国际化支持 (EN/zh-CN)、优化前端性能达到 performance budget、以及完善全链路的错误处理。

## 功能说明

### i18n (国际化)
- react-i18next (已有依赖)
- 翻译文件结构:
  ```
  src/locales/
  ├── en/
  │   ├── common.json     # 通用 UI
  │   ├── auth.json        # 登录注册
  │   ├── lobby.json       # 大厅
  │   └── game.json        # 游戏
  └── zh-CN/
      └── ...              # 相同结构
  ```
- 游戏内所有文案使用 `t()` 函数
- 卡牌名称复用 `@ender-seti/common` 的 locale

### 性能优化
| 指标 | 目标 |
|------|------|
| 初始 bundle (gzip) | < 200KB (不含卡牌素材) |
| LCP (game page) | < 2s |
| 状态更新 → 渲染 | < 16ms (60fps) |
| WebSocket event → 视觉更新 | < 100ms 感知 |

优化手段:
- Route-level code splitting (React.lazy + TanStack Router lazy)
- React.memo on leaf components
- Selector hooks (避免全量 re-render)
- useDeferredValue for non-critical UI
- requestAnimationFrame batch for WebSocket state
- Card sprite sheets (existing in @ender-seti/cards)

### 错误处理
| 错误源 | 处理 |
|--------|------|
| REST 4xx | Toast + 表单错误提示 |
| REST 5xx | Toast + 重试按钮 |
| WebSocket 断开 | 自动重连 + "Reconnecting..." overlay |
| game:error | Toast + 重新显示当前 input |
| 无效输入 | Server 重发 game:waiting |
| 渲染错误 | ErrorBoundary per feature section |

### 涉及文件
- 新建 locales/ 翻译文件
- 修改各组件添加 `t()` 调用
- 修改 vite.config.ts 添加 code splitting
- 修改组件添加 React.memo
- 完善 ErrorBoundary

## 技术实现方案

1. i18n: 初始化 i18next, 创建翻译 JSON, 替换硬编码文案
2. 性能: vite build 分析 → code split → memo → selector hooks
3. 错误: ErrorBoundary wrapper per feature area + global toast

## 测试要求
- i18n: 测试语言切换后文案正确
- 性能: Lighthouse CI 门禁 (LCP, bundle size)
- 错误: ErrorBoundary 测试 (throw in child → fallback render)

## 完成标准
- [ ] EN + zh-CN 翻译完成
- [ ] Bundle size < 200KB gzip
- [ ] LCP < 2s
- [ ] ErrorBoundary 覆盖所有 feature area
- [ ] 游戏内无硬编码文案
