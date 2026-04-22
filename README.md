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

### 3) 初始化并迁移 server 数据库（首次）

如果你要跑 `packages/server`，第一次建议先初始化数据库：

```bash
pnpm --filter @seti/server db:prepare
```

这个脚本会先连接到 PostgreSQL 的 `postgres` 默认库并确保目标库存在，然后执行 Drizzle migration。目标库名按当前环境配置推导：

- 优先读取 `DATABASE_URL` 里的库名
- 否则读取 `PGDATABASE` / `PGUSER` / 当前系统用户名

若目标库不存在会自动创建；已存在则跳过。

如需单独执行某一步：

```bash
pnpm --filter @seti/server db:init
pnpm --filter @seti/server db:migrate
pnpm --filter @seti/server db:generate
```

### 4) 最简单开发流程（建议）

首次开发（新机器或新数据库）：

```bash
pnpm install
pnpm --filter @seti/server db:prepare
pnpm dev:client-server
```

日常开发（已经初始化过数据库）：

```bash
pnpm --filter @seti/server db:migrate
pnpm dev:client-server
```

## client + server 联调

推荐一键启动（仓库根目录）：

```bash
pnpm dev:client-server
```

这个命令会：

- 同时启动 `@seti/server` 与 `@seti/client`
- 如果不存在 `packages/client/.env`，会自动从 `.env.example` 复制一份
- 在你按 `Ctrl + C` 时同时关闭两个进程

如果你希望手动分终端控制，也可以使用下面的方式。

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

### Debug 页面

- `/debug/game` 同时支持 `Source: Local` 与 `Source: Server`
  - `Local`：纯前端 mock 状态，可切换 scenario/spectator 与 scan/card 输入调试
  - `Server`：通过 REST 调试端点联动真实 server game（含 end-turn / solar sandbox）
- `/debug/server` 是独立的 ws 联动页，进入后由 server 创建新局并按实时会话推送
- Debug 页面中的位置/尺寸/旋转默认参数集中在 `packages/common/src/constant/debugGame.ts`

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

## E2E / Playwright

推荐入口：

```bash
./scripts/init-e2e-local.sh
./scripts/run-e2e-local.sh
```

默认会准备 E2E 数据库、启动 `@seti/server` + `@seti/client`，并执行 `packages/e2e/tests/game-flow-behavior.spec.ts`。

更多细节见：

- `docs/tests/e2e.md`

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
