# Client 单测

在仓库根目录执行。

## 全量

```bash
pnpm --filter @seti/client test
```

## Auth 定向

```bash
pnpm --filter @seti/client test -- \
  __tests__/stores/authStore.test.ts \
  __tests__/components/ProtectedRoute.test.tsx
```

## 质量补充

```bash
pnpm --filter @seti/client typecheck
pnpm --filter @seti/client lint
pnpm --filter @seti/client test:watch
pnpm --filter @seti/client test:coverage
```
