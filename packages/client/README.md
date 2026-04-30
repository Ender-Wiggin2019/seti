# @seti/client

Vite + React 客户端，用于连接 `@seti/server` 进行游戏联调。

## 运行方式

先在仓库根目录安装依赖：

```bash
pnpm install
```

初始化环境变量：

```bash
cp .env.example .env
```

启动开发环境：

```bash
pnpm dev
```

默认 Vite 端口：`5173`。

## 联调配置

`.env` 默认值：

```dotenv
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

确保后端 `@seti/server` 已运行在对应地址。

## 构建与预览

```bash
pnpm build
pnpm preview
```

## 测试与质量

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm lint
pnpm typecheck
```
