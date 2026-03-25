# Task 0-2: Server 项目脚手架

## Title
搭建 `packages/server` — NestJS + Vitest + Drizzle 工程骨架

## 描述
在 monorepo 中新建 `packages/server` 包，配置 NestJS 框架、Vitest 测试环境、TypeScript 编译、以及与 Turbo 的集成。此阶段不实现业务逻辑，只搭建可运行的空壳。

## 功能说明

### 包含内容
- NestJS 应用骨架 (`app.module.ts`, `main.ts`)
- TypeScript 配置 (strict mode, path aliases)
- Vitest 配置 (node 环境, coverage 门禁)
- package.json (scripts: dev, build, test, lint, typecheck)
- 空的模块目录结构 (engine/, gateway/, lobby/, auth/, persistence/, shared/)
- 与 `@ender-seti/common` 的 workspace 依赖声明
- 基础 SeededRandom 和 GameError 工具类

### 目录结构
```
packages/server/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── engine/          # 空目录，预留
│   ├── gateway/         # 空目录
│   ├── lobby/           # 空目录
│   ├── auth/            # 空目录
│   ├── persistence/     # 空目录
│   └── shared/
│       ├── rng/
│       │   ├── SeededRandom.ts
│       │   └── SeededRandom.test.ts
│       └── errors/
│           ├── GameError.ts
│           └── GameError.test.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
└── drizzle.config.ts   # 占位
```

## 技术实现方案

1. `pnpm init` 在 `packages/server/` 下
2. 安装 NestJS 核心依赖 (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-socket.io`, etc.)
3. 安装 Vitest + coverage 插件
4. 配置 tsconfig.json (strict, ESM, path alias `@seti/common`)
5. 配置 vitest.config.ts (node env, globals, coverage thresholds: 90%)
6. 实现 `SeededRandom` (基于 seed 的确定性 RNG) + 单测
7. 实现 `GameError` (带 error code 的自定义异常) + 单测
8. 确保 `turbo run build/test` 能识别并运行

## 测试要求
- `SeededRandom.test.ts`: 验证同 seed 产生相同序列，不同 seed 产生不同序列，shuffle 确定性
- `GameError.test.ts`: 验证错误码和消息正确传递
- `pnpm run test` 在 server 包内通过

## 完成标准
- [ ] `packages/server` 包已创建，monorepo 能识别
- [ ] NestJS 应用可启动 (`pnpm run dev`)
- [ ] Vitest 测试可运行且通过
- [ ] `turbo run build test typecheck` 包含 server 包
