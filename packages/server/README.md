# @seti/server

NestJS 游戏服务端，提供 API / WebSocket 能力。

## 运行方式

先在仓库根目录安装依赖：

```bash
pnpm install
```

启动开发环境（监听文件变更）：

```bash
pnpm dev
```

默认端口：`3000`，可通过环境变量覆盖：

```bash
PORT=3001 pnpm dev
```

## 构建与生产启动

```bash
pnpm build
pnpm start
```

## 测试与质量

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm lint
pnpm typecheck
```
