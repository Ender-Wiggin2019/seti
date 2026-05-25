# TODO

当前没有开放 TODO。

已完成的历史 checklist 已于 2026-05-25 清理。需要追溯时，优先查看相关 `docs/review/` 文档和 git 历史。

## 2026-05-25 code clean smoke 验收

- [x] 读取 `scripts/smoke-web.sh` 与现有 E2E/启动脚本，确认真实浏览器验收入口和端口策略。
- [x] 运行 `scripts/smoke-web.sh`，验证 `/`, `/card/1`, `/card/39`, `/card/128`, `/prelude` 返回 HTML 200。
- [x] 启动真实 client/server，不使用 mock、debug endpoint、localStorage 注入或 raw websocket action。
- [x] 通过 Browser 真实操作完成登录、创建/进入房间、开始游戏、进入 `/game/{gameId}`。
- [x] 在游戏页执行可见用户动作并检查控制台/页面状态，确认 code clean 未破坏主流程。
- [x] 在本节末尾记录 review 结果、证据和剩余风险。

### Review

- `./scripts/smoke-web.sh 3101` 通过，确认 `/`, `/card/1`, `/card/39`, `/card/128`, `/prelude` 均返回 HTML 200。
- `SKIP_E2E_DB_PREPARE=1 pnpm --filter @seti/e2e exec playwright test tests/browser-smoke.spec.ts --project=chromium --retries=0` 通过，覆盖真实 UI 注册、创建 2 人房、加入、开局、进入游戏页和 PASS 同步。
- Browser 实操复用当前仓库真实 server/client：注册 `browser-smoke-1779704665044-bm1jnu`，创建单人房 `bd31275b-6dcf-47c3-9495-17a36160fd7c`，进入 `/game/bd31275b-6dcf-47c3-9495-17a36160fd7c`。
- Browser 游戏页实操完成：开局收入卡牌选择、卡牌 tab 可见 3 张卡、科技 tab 可见 12 个 tech stack、主行动 `跳过` 生效、事件日志出现第 1 回合结束，随后进入第 2 回合主行动待命。
- Browser console warning/error 检查为空。截图证据位于 `docs/review/browser-smoke-2026-05-25/`。
- 剩余风险：本次没有跑完整 E2E 全套，只跑了脚本路由冒烟、重点双用户 smoke 和 Browser 单局主流程；更深的规则分支仍需依赖已有针对性 E2E/单测。
