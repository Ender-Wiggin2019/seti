# Server 单测

在仓库根目录执行。

## 全量

```bash
pnpm --filter @seti/server test
```

## Auth + Lobby 定向

```bash
pnpm --filter @seti/server test -- \
  __tests__/auth/jwt-auth.guard.integration.test.ts \
  __tests__/auth/auth.controller.test.ts \
  __tests__/auth/auth.service.test.ts \
  __tests__/lobby/lobby.controller.test.ts \
  __tests__/lobby/lobby.service.test.ts
```

## Gateway 定向

```bash
pnpm --filter @seti/server test -- __tests__/gateway/game.gateway.test.ts
```

## 质量补充

```bash
pnpm --filter @seti/server typecheck
pnpm --filter @seti/server lint
pnpm --filter @seti/server test:watch
pnpm --filter @seti/server test:coverage
```
