# demo-a2ui Monorepo

SETI 相关项目的 Monorepo，使用 `pnpm workspace` + `turbo` 管理多包开发。

## 包结构

- `packages/web`：Next.js Web 服务（重点入口，默认开发建议）
- `packages/client`：Vite + React 客户端（新客户端）
- `packages/server`：NestJS 游戏服务端
- `packages/common`：通用规则、类型、协议
- `packages/cards`：卡牌 UI 与资源包

## 快速开始

### 1) 安装依赖

```bash
pnpm install
```

### 2) 启动重点服务（web / Next）

在仓库根目录执行：

```bash
pnpm dev
```

等价于：

```bash
pnpm --filter @seti/web dev
```

默认端口 `3000`。

## client + server 联调

需要两个终端分别启动：

终端 1（启动 server）：

```bash
pnpm --filter @seti/server dev
```

终端 2（启动 client）：

```bash
cp packages/client/.env.example packages/client/.env
pnpm --filter @seti/client dev
```

默认情况下：

- `server` 监听 `http://localhost:3000`（可用 `PORT` 覆盖）
- `client` 会读取：
  - `VITE_API_URL=http://localhost:3000`
  - `VITE_WS_URL=http://localhost:3000`

## 各包常用命令

### web（Next）

```bash
pnpm --filter @seti/web dev
pnpm --filter @seti/web build
pnpm --filter @seti/web start
pnpm --filter @seti/web test
```

### client（Vite）

```bash
pnpm --filter @seti/client dev
pnpm --filter @seti/client build
pnpm --filter @seti/client test
```

### server（Nest）

```bash
pnpm --filter @seti/server dev
pnpm --filter @seti/server build
pnpm --filter @seti/server start
pnpm --filter @seti/server test
```

### common（rules/types）

```bash
pnpm --filter @ender-seti/common build
pnpm --filter @ender-seti/common test
```

### cards（card package）

```bash
pnpm --filter @ender-seti/cards build
```

## 质量命令（根目录）

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
