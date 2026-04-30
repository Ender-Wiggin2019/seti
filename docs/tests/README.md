# 单测运行指引

先在仓库根目录安装依赖：

```bash
pnpm install
```

## 快速入口

- 全量单测：`pnpm test`
- Server 单测：见 `docs/tests/server.md`
- Client 单测：见 `docs/tests/client.md`
- Common 单测：见 `docs/tests/common.md`
- E2E / Playwright：见 `docs/tests/e2e.md`

## 常见场景

```bash
# 只跑 server + client（开发时常用）
pnpm --filter @seti/server test && pnpm --filter @seti/client test

# watch 模式
pnpm --filter @seti/server test:watch
pnpm --filter @seti/client test:watch

# 覆盖率
pnpm --filter @seti/server test:coverage
pnpm --filter @seti/client test:coverage
```
