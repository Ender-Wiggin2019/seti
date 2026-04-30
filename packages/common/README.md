# @ender-seti/common

通用规则、类型、协议与共享数据包，供 `web` / `client` / `server` 复用。

## 运行方式

该包不是独立服务，不需要 `dev server`。

在包目录执行：

```bash
pnpm build
```

## 常用命令

```bash
pnpm clean
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## 被其他包使用

- 在 workspace 中通过 `@seti/common` / `@ender-seti/common` 进行依赖引用
- 产物输出在 `dist/`
