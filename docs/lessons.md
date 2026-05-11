# Lessons

## 身份与持久化边界

- JWT 通过签名验证后，仍要确认 `sub` 对应用户存在；所有写 `users.id` 外键的入口都应在写库前返回明确 401，数据库外键只做最后防线。
- E2E reset 只清游戏持久化状态，保留 `users`，避免浏览器保存的 token 指向被删除账号。

## 验证策略

- 每个 bug 或需求都要先有旧实现失败、新实现通过的可观察断言；跑过“相关测试”不等于覆盖了用户报告点。
- Smoke 只证明路径可达；核心规则要覆盖真实用户操作到可观察规则结果，长流程用固定样例或显式 deterministic setup，并说明它不是 mock/debug/WS shortcut。
- UI/规则回归先列矩阵再断言：actor/view、text/image、action/card 类型、条件显示正反面、server/common 投影到 DOM/图片/alt/test id 的一致性。
- 验证结束前反问：如果原 bug 仍存在，这个测试会失败吗；不会就补更具体断言。

## E2E 真实路径

- 生产路径 E2E 不使用 debug endpoint、localStorage 注入、raw websocket action 或 mock network；debug replay/checkpoint 只能作为明确标注的长前置补充。
- Helper 必须处理真实 pending input（如 tuck-for-income），不能越过 UI 继续点击后续动作。
- 截图证据必须直接露出用户点名元素；响应式布局导致分屏时，分别截图并附 DOM/test locator 证据。

## UI 语义渲染

- 规则、奖励、desc 图标统一走 `DescRender` / `EffectFactory`；不要用颜色块、字母或临时图片替代。
- Token/board 视觉要表达规则语义：solar anomaly token 是奖励 pill（trace 色辅助、desc icon 居中），alien trace slot 用同色 border 容器，hidden board 不泄露真实 trace。
- Anomalies board 保持 red/yellow/blue 三列横排；单列内部按规则读法让低 index 在底部，压缩布局优先减 padding/slot 宽度，不牺牲 desc icon 可读性。

## Solo / Alien 规则覆盖

- Alien/Solo 改动要覆盖 mark trace、三色 discovery、reveal、专属规则结果；未发现 board 只显示未知占位，真实 trace 只在 Discovery/Overflow 或 reveal 后 board 中出现。
- `scenarioPreset` 被禁用时，先核实 common/server/client 是否已有真实实现；长前置可迁移到明确 Debug Replay checkpoint，不要删除关键覆盖或用普通动作替代特殊规则。
- `SPEND_SIGNAL_TOKEN` 是条件 free action；`DELIVER_SAMPLE` 是 Mascamites sample mission 交付分支，测试和实现都不能用普通 move/sample 代替。

## 规则文档与参考数据

- 源资料缺图或数据时，优先从 `frontend-reference`、`docs/arch/aliens/*`、FAQ 补足；用户确认点迁入 Confirmed Decisions，并记录来源与冲突优先级。
- `frontend-reference` 只作为行为/数据参考；实现规格必须写清 common/server/client 分工，并把 source alias 映射到项目规范命名。
