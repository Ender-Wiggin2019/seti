# Task 0-3: Client 项目脚手架

## Title
搭建 `packages/client` — Vite + React + TanStack Router + Tailwind + shadcn/ui

## 描述
在 monorepo 中新建 `packages/client` 包，配置 Vite 构建、React 18、TanStack Router、Tailwind CSS 4、shadcn/ui、Zustand、Vitest + RTL 测试环境。此阶段产出一个可运行的空 SPA 壳子。

## 功能说明

### 包含内容
- Vite + React 应用骨架 (`index.html`, `main.tsx`, `App.tsx`)
- TanStack Router 路由配置 (空路由占位)
- Tailwind CSS 4 + PostCSS 配置
- shadcn/ui 初始化 (`components.json`, 基础 ui/ 组件)
- Zustand store 骨架 (authStore, gameViewStore, settingsStore)
- Vitest + React Testing Library 配置
- MSW 基础 mock setup
- 环境变量配置 (`.env.example`)
- Provider 栈 (`QueryClientProvider`, `I18nextProvider`, `RouterProvider`)
- 基础 layout 组件 (`AppShell`, `LoadingSpinner`, `ErrorBoundary`)
- Design token 文件 (`config/theme.ts`)
- Tailwind 自定义主题集成

### 目录结构
```
packages/client/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── components.json
├── .env.example
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes.tsx
│   ├── config/
│   │   ├── theme.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── api/           # 空目录预留
│   ├── hooks/         # 空目录预留
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── gameViewStore.ts
│   │   └── settingsStore.ts
│   ├── pages/         # 空目录预留
│   ├── features/      # 空目录预留
│   ├── components/
│   │   ├── ui/        # shadcn/ui 组件
│   │   ├── layout/
│   │   │   └── AppShell.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   └── cn.ts
│   └── types/
│       ├── client.ts
│       └── re-exports.ts
├── test/
│   ├── setup.ts
│   └── mocks/
│       └── handlers.ts
└── e2e/               # 空目录预留 Playwright
```

## 技术实现方案

1. 使用 `pnpm create vite` 初始化 React + TS 模板
2. 安装所有依赖 (见 arch-client.md §2.3)
3. 配置 TanStack Router (type-safe, lazy routes)
4. 配置 Tailwind CSS 4 + design tokens
5. 初始化 shadcn/ui (New York style)
6. 实现 3 个 Zustand store 骨架
7. 配置 Vitest (jsdom 环境, RTL, setup file)
8. 配置 MSW mock handlers
9. 实现 Provider 栈和基础组件

## 测试要求
- `stores/*.test.ts`: 每个 Zustand store 的基本读写测试
- `ErrorBoundary.test.tsx`: 验证错误捕获和 fallback 渲染
- `ProtectedRoute.test.tsx`: 验证未认证重定向
- `pnpm run test` 在 client 包内通过

## 静态资源准备

脚手架搭建完成后，将参考项目中的游戏静态资源复制到 `public/assets/seti/`。详细的资源清单和目录结构见 `docs/arch/arch-client.md` §17.6 和 §17.7。

源目录：`frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/`

```bash
# 复制静态资源
mkdir -p packages/client/public/assets/seti
cp -r frontend-reference/storage.googleapis.com/cgo-projects/seti/assets/* packages/client/public/assets/seti/
```

资源分类：boards (棋盘背景)、wheels (太阳系环)、tokens (玩家棋子)、tech (科技 tile)、cards (卡背)、icons (图标 ×25)、lifes (外星生命)、distantBonus、corporations

## 完成标准
- [ ] `packages/client` 包已创建，monorepo 能识别
- [ ] `pnpm run dev` 启动 Vite dev server，浏览器可访问
- [ ] Tailwind + shadcn/ui 样式正确加载
- [ ] Router 空壳路由工作
- [ ] Vitest 测试可运行且通过
- [ ] `turbo run build test typecheck` 包含 client 包
- [ ] 静态资源已复制到 `public/assets/seti/`（约 78 个文件）
