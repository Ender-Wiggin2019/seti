# Smoke Probe / Scan 截图说明

日期：2026-05-05

截图来源：

1. 用例：`packages/e2e/tests/smoke-probe-scan.spec.ts`
2. 目录：`docs/tests/artifacts/smoke-probe-scan/`
3. 带图内标注版本：`docs/tests/artifacts/smoke-probe-scan/annotated/`

说明方式：

1. 每张图对应一个关键步骤
2. “标注”同时包含：
   - 本文中的文字标注
   - `annotated/` 目录中带顶部说明条的 PNG

## 1. 注册完成

文件：`docs/tests/artifacts/smoke-probe-scan/01-host-registered.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/01-host-registered.png`

标注重点：

1. 页面已从认证流程离开
2. 已进入大厅上下文
3. 说明真实注册成功，不存在注入 auth

## 2. 房间创建完成

文件：`docs/tests/artifacts/smoke-probe-scan/02-room-created.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/02-room-created.png`

标注重点：

1. 房间页已经打开
2. 房间设置已渲染
3. 说明真实 `POST /lobby/rooms` 已完成

## 3. Host 进入游戏

文件：`docs/tests/artifacts/smoke-probe-scan/03-host-in-game.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/03-host-in-game.png`

标注重点：

1. `bottom-dashboard` 已可见
2. 游戏主界面已加载
3. 说明房主已通过真实开局进入游戏页

## 4. Guest 进入游戏

文件：`docs/tests/artifacts/smoke-probe-scan/03-guest-in-game.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/03-guest-in-game.png`

标注重点：

1. 客户端也已进入同一局游戏
2. 双浏览器上下文都到达游戏页
3. 说明真实多人同步链路已成立

## 5. 当前行动玩家确认

文件：`docs/tests/artifacts/smoke-probe-scan/04-active-player-before-launch.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/04-active-player-before-launch.png`

标注重点：

1. `LAUNCH_PROBE` 对当前玩家可用
2. 用于确认本回合行动权归属
3. 是后续回合交接验证的起点

## 6. Launch Probe 后，玩家 1 视角

文件：`docs/tests/artifacts/smoke-probe-scan/05-after-launch-probe-p1.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/05-after-launch-probe-p1.png`

标注重点：

1. 玩家 1 已完成 `LAUNCH_PROBE`
2. 玩家 1 主行动结束
3. 该图用于对照交接前后的本方状态

## 7. Launch Probe 后，玩家 2 视角

文件：`docs/tests/artifacts/smoke-probe-scan/05-after-launch-probe-p2.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/05-after-launch-probe-p2.png`

标注重点：

1. 对手视角已同步到最新局面
2. 说明真实 websocket 广播已生效
3. 下一步会验证 `SCAN` 行动权转移

## 8. Scan 行动已可执行

文件：`docs/tests/artifacts/smoke-probe-scan/06-scan-actor-ready.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/06-scan-actor-ready.png`

标注重点：

1. `SCAN` 按钮已 enabled
2. 说明 `END_TURN` 后回合已正确交接
3. 这是主行动时序验证的核心图

## 9. Scan 输入提示出现

文件：`docs/tests/artifacts/smoke-probe-scan/07-scan-input-prompt.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/07-scan-input-prompt.png`

标注重点：

1. 底部动作区出现 scan 子动作输入
2. 说明 scan 不是单次即时结算，而是进入逐步输入流程
3. 这是“行动队列 / 子行动池 / 输入时序”证据图

## 10. Scan 后，执行者视角

文件：`docs/tests/artifacts/smoke-probe-scan/08-after-scan-actor.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/08-after-scan-actor.png`

标注重点：

1. scan 已完成
2. 执行者事件日志应已增加
3. 说明 scan 结算、日志更新、回合推进都已发生

## 11. Scan 后，对手视角

文件：`docs/tests/artifacts/smoke-probe-scan/08-after-scan-other.png`
标注图：`docs/tests/artifacts/smoke-probe-scan/annotated/08-after-scan-other.png`

标注重点：

1. 对手也同步到了 scan 结果
2. 对手事件日志应已增加
3. 说明双方状态一致，真实多人同步正常

## 12. 截图与目标关系

这组截图直接证明了以下链路已经完整跑通：

1. 真实注册
2. 真实建房
3. 真实加入
4. 真实开局
5. 双端进入同局
6. 主行动 `LAUNCH_PROBE`
7. 回合交接
8. 主行动 `SCAN`
9. scan 输入提示与子流程
10. 事件日志同步

它不单独证明五种外星人、所有自由行动或全部重点卡牌；这些范围由 `docs/tests/real-e2e-closure-report.md` 中列出的其他测试命令与规则测试共同闭环。
