# Lessons

## Server 边界错误处理

- 受保护 HTTP 接口不能只相信 JWT 签名；如果请求会依赖 `users.id`，guard 或 service 边界必须确认 token `sub` 对应用户仍存在，孤儿 token 应返回明确 401。
- 数据库外键只能作为最后一道完整性保护，不能替代业务校验；会写 `games.hostUserId` / `game_players.userId` 的 lobby 入口必须在写库前给出可理解的错误。

## E2E 覆盖关键玩法闭环

- E2E 可以复用本地开发数据库，但 reset 只能清游戏持久化状态，不能 truncate `users`；否则浏览器保留的 `seti-auth` token 会指向不存在的用户并导致 `/auth/me` 401。
- 不要把 login/lobby/game start/launch/scan 烟测当成游戏流程覆盖完成。涉及核心规则时，E2E 至少要覆盖用户真实操作到可观察规则结果的闭环。
- 对 alien 相关改动，真实 UI 流程需要显式覆盖 mark trace、三色 discovery 填满、alien reveal、alien 专属规则结果；debug replay/debug snapshot 只能作为补充，不能替代生产路径 E2E。
- 当 UI 操作会触发后续 pending input（例如电脑槽 tuck-for-income 选牌）时，测试 helper 必须处理该真实提示，而不是继续点击后续动作。
- 规则 token 不能只靠颜色或字母表达；anomaly token 在 solar board 上代表奖励，不代表 alien 身份，必须从 `token.rewards` 渲染类似 desc 的 reward icon（例如 `1 credit`），颜色只能作为 trace 辅助状态。
- 当 UI 需要渲染规则、奖励或 desc 图标时，优先复用现有 `DescRender` / `EffectFactory`；不要用手写颜色块、字母或临时图片替代规则图标。
- Solar anomaly token 的正确形态是 `rounded-full` 奖励 pill：左右两侧表达 trace 颜色，中间用 desc reward 图标表达 bonus；不要渲染 alien 图片、方形 token 或仅靠颜色表达奖励。
- Alien board 的 trace reward slot 必须保持规则语义：固定槽是 trace 同色 border 的圆形容器，奖励横向排列；不限数量槽用纵向长条 `rounded-full`，不要伪装成普通圆槽或横向撑开相邻列。
- Anomalies board 的 red/yellow/blue 三条 trace 必须始终横向排列；只有单条 trace 内部的 reward slot 才纵向堆叠，不能因为窄屏响应式把三条 trace 改成竖排。
- Anomalies board 的 reward icon 需要可读，不能为了压缩布局继续使用过小的 `desc-mini`；压缩应优先减少 trace/card padding 和 slot 宽度，而不是牺牲 desc icon 识别度。
- 未发现 alien 的 board 区不能渲染伪 red/yellow/blue trace 列；未知 board 只显示黑色占位背景，真实 trace 信息只存在于 Discovery/Overflow 区。
- 未发现 alien 的黑色占位 board 高度应与已展示 board 区保持一致，避免双列 alien cards 的 Discovery/Overflow 区错位。
- Board trace 的纵向顺序要按规则读法反向呈现，低 index 在最底部；不要用可见 index 文本补救错误顺序。
- E2E 断言不要根据简化 server 脚本硬编码完整流程后的手牌；如果前置真实 UI 动作会消耗随机数或抽牌，必须以最终 UI 可观察状态为准。
- 给用户截图证明 UI 时，截图必须直接露出用户点名的元素；如果响应式布局导致内容分屏，分别截图可见分段并附 DOM/测试定位证据，不要用看不到目标的截图替代。
- public `scenarioPreset` 被禁用时，不要直接删除 `SPEND_SIGNAL_TOKEN` / `DELIVER_SAMPLE` 这类长前置覆盖；先核实 common/server/client 是否已有真实实现，再把前置状态迁移到明确的 Debug Replay checkpoint 或补自然 UI 路径。
- `SPEND_SIGNAL_TOKEN` 是条件 free action，和 movement 一样由 free-action bar 暴露，只在 scan pool、有 signal token 且 card row 非空时可用；`DELIVER_SAMPLE` 是 Mascamites sample mission 的交付分支，不能用普通 move/sample 移动覆盖代替。

## 规则文档抽取

- 源文档缺失完整卡牌图标或 board 数据时，先在项目内 `frontend-reference` asset/config 和已有 `docs/arch/aliens/*` / FAQ 里补足；用户确认过的 open point 要迁移到 Confirmed Decisions，并在同一规则目录记录来源和冲突优先级。
- `frontend-reference` 只能作为行为/数据参考；写实现规则时必须同时规定 server/client/common 分工，并把 `automa`、`pop`、`fly/look/comp`、`life*` 等 source alias 映射到项目内规范枚举和领域命名。
