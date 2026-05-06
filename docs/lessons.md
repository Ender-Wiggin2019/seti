# Lessons

## E2E 覆盖关键玩法闭环

- 不要把 login/lobby/game start/launch/scan 烟测当成游戏流程覆盖完成。涉及核心规则时，E2E 至少要覆盖用户真实操作到可观察规则结果的闭环。
- 对 alien 相关改动，真实 UI 流程需要显式覆盖 mark trace、三色 discovery 填满、alien reveal、alien 专属规则结果；debug replay/debug snapshot 只能作为补充，不能替代生产路径 E2E。
- 当 UI 操作会触发后续 pending input（例如电脑槽 tuck-for-income 选牌）时，测试 helper 必须处理该真实提示，而不是继续点击后续动作。
- 规则 token 不能只靠颜色或字母表达；anomaly token 在 solar board 上代表奖励，不代表 alien 身份，必须从 `token.rewards` 渲染类似 desc 的 reward icon（例如 `1 credit`），颜色只能作为 trace 辅助状态。
