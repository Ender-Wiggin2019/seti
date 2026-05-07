# E2E 运行指引

在仓库根目录执行。

## 前置条件

- 已执行 `pnpm install`
- 本机可访问 PostgreSQL
- Node.js 版本满足 `Vite 7` 要求，至少 `20.19.0`

如果当前 shell 的 `node` 版本不够，新脚本会自动尝试从 `~/.nvm/versions/node/` 里挑选一个可用版本。

## 初始化

只准备 E2E 运行环境，不启动服务：

```bash
./scripts/init-e2e-local.sh
```

这个脚本会做三件事：

- 自动选择兼容的 Node 版本
- 自动补齐 `packages/client/.env`
- 执行 `packages/server/scripts/prepare-e2e-db.ts`

`run-e2e-local.sh` 会在本地 E2E 进程中显式打开 debug API 和 debug 前端路由：

- `SETI_ENABLE_DEBUG_API=true`
- `VITE_ENABLE_DEBUG_ROUTES=true`
- `SKIP_E2E_DB_PREPARE=1`（DB 已由 `init-e2e-local.sh` 准备，避免 Playwright global setup 重复 reset）

这只影响本地 E2E 启动的 server/client，用于 `debug-replay`、`debug-snapshot` 以及长前置状态的 free-action checkpoint；production 默认仍关闭 debug 前端路由。

如果你需要手动指定运行时：

```bash
SETI_E2E_NODE_BIN="$HOME/.nvm/versions/node/v23.3.0/bin/node" \
SETI_E2E_PNPM_CLI="$HOME/.nvm/versions/node/v18.17.0/lib/node_modules/pnpm/bin/pnpm.cjs" \
./scripts/init-e2e-local.sh
```

## 一键运行

默认执行行为流 E2E：

```bash
./scripts/run-e2e-local.sh
```

执行其他 spec：

```bash
./scripts/run-e2e-local.sh tests/user-journey.spec.ts
```

按 suite tag 筛选：

```bash
cd packages/e2e
CI=1 SERVER_URL=http://127.0.0.1:3000 CLIENT_URL=http://127.0.0.1:5173 WS_URL=http://127.0.0.1:3000 \
  ./node_modules/.bin/playwright test --project=chromium --grep @smoke
```

当前约定：

- `@smoke`: 最小浏览器烟测。
- `@real-ui`: 真实浏览器、真实 server/client 的生产路径流程。
- `@actions`: main/free action 交互覆盖。
- `@api`: 明确只验证 HTTP API 行为的用例。
- `@debug`: 依赖 debug replay/snapshot/checkpoint 的用例。
- `@responsive`: 响应式 viewport 覆盖。
- `@reconnect`: reload/reconnect 状态恢复覆盖。
- `@slow`: 运行时间明显长于普通 flow 的闭环。

保留本地服务，便于手动调试：

```bash
KEEP_SERVERS=1 ./scripts/run-e2e-local.sh tests/browser-smoke.spec.ts
```

## 可覆盖环境变量

- `SETI_E2E_NODE_BIN`: 显式指定 Node 可执行文件
- `SETI_E2E_PNPM_CLI`: 显式指定 `pnpm.cjs`
- `SETI_E2E_TSX_LOADER`: 显式指定 `tsx/dist/loader.mjs`
- `SERVER_URL`: 默认 `http://127.0.0.1:3000`
- `CLIENT_URL`: 默认 `http://127.0.0.1:5173`
- `WS_URL`: 默认 `http://127.0.0.1:3000`
- `PLAYWRIGHT_PROJECT`: 默认 `chromium`
- `PLAYWRIGHT_RETRIES`: 默认 `0`
- `KEEP_SERVERS`: 设为 `1` 时，脚本退出后不自动关闭 server/client

## 定向命令

如果你只想手动执行最后一步，也可以在 `packages/e2e` 下运行：

```bash
CI=1 \
SERVER_URL=http://127.0.0.1:3000 \
CLIENT_URL=http://127.0.0.1:5173 \
WS_URL=http://127.0.0.1:3000 \
./node_modules/.bin/playwright test tests/browser-smoke.spec.ts --project=chromium --retries=0
```

如果目标 spec 依赖 `/debug/replay`，需要确保手动启动的 client 设置了 `VITE_ENABLE_DEBUG_ROUTES=true`，server 设置了 `SETI_ENABLE_DEBUG_API=true`。

直接运行 Playwright 且不经过 `run-e2e-local.sh` 时，`packages/e2e/global-setup.ts` 会负责执行 `db:prepare:e2e`。这种路径下不要设置 `SKIP_E2E_DB_PREPARE=1`，除非你已经手动准备并重置了 E2E 数据库。
