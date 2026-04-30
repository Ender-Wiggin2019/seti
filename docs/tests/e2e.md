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

保留本地服务，便于手动调试：

```bash
KEEP_SERVERS=1 ./scripts/run-e2e-local.sh tests/game-flow-behavior.spec.ts
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
./node_modules/.bin/playwright test tests/game-flow-behavior.spec.ts --project=chromium --retries=0
```
