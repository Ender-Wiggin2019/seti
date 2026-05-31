# TODO

- [x] 添加回归测试：image mode 仍渲染真实的 income 和 mission summary 区域
- [x] 调整 PlayerDashboard：image/text mode 只切换上方 player board 主体
- [x] 运行 focused client test 并记录结果

## Review

- 新增 PlayerDashboard image mode 回归测试，确认真实 `income-tracker` 与 mission summary 区域在 image mode 下仍存在。
- 将 income / mission summary 从 text-mode 专属分支移到 PlayerDashboard 的共享辅助区域；image/text mode 现在只切换上方 player board 主体。
- 验证通过：`pnpm --filter @seti/client test -- PlayerDashboard.test.tsx`、`pnpm --filter @seti/client typecheck`、`pnpm --dir packages/client exec biome check src/features/player/PlayerDashboard.tsx __tests__/features/player/PlayerDashboard.test.tsx`。
