# @seti/web

Next.js Web 服务，是当前仓库默认开发入口。

## 运行方式

在仓库根目录安装依赖：

```bash
pnpm install
```

启动开发环境（会自动执行资源同步脚本）：

```bash
pnpm --filter @seti/web dev
```

默认端口：`3000`（Next 默认端口）。

## 构建与启动

```bash
pnpm --filter @seti/web build
pnpm --filter @seti/web start
```

说明：

- `prebuild` / `predev` 会先执行 `scripts/sync-card-assets.sh`
- `postbuild` 会执行 `next-sitemap` 生成 sitemap

## 测试与质量

```bash
pnpm --filter @seti/web test
pnpm --filter @seti/web test:watch
pnpm --filter @seti/web lint
pnpm --filter @seti/web typecheck
```

## 常见问题

- 如果样式或卡牌资源缺失，先重新执行一次 `pnpm --filter @seti/web dev`，确认预处理脚本已执行。
- 如果端口冲突，可用 `pnpm --filter @seti/web dev -- --port 3001` 临时切换端口。
