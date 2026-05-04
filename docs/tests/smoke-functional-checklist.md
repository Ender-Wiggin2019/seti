# SETI 真实端到端冒烟功能测试清单

## 1. 目标与约束

本清单服务于当前目标：

1. 不使用 mock。
2. 使用真实前端 + 真实后端 + 真实数据库启动完整流程。
3. 优先通过正式 UI 完成用户行为，不走 debug 页面、不调 `/debug/*`、不注入 auth 状态、不直接发原始 websocket 动作来替代已有 UI。
4. 先形成最细的功能冒烟列表，再据此实现测试。
5. 必须覆盖：
   - 各种主行动与自由行动
   - 行动队列/延迟结算/回合交接时序
   - 重点卡牌效果结算
   - 5 种核心外星人的特殊规则、卡牌、结算

## 2. 覆盖分层

当前仓库里的“测试”需要分成三层看，不能混为一谈：

### A. 真实 UI E2E 冒烟

用于验证：

1. 真实注册/登录
2. 真实大厅/房间/开局
3. 真实 websocket 状态同步
4. 真实游戏页交互
5. 多浏览器上下文下的回合同步与事件同步

限制：

1. 只能覆盖“正式 UI 目前能稳定到达”的状态。
2. 不适合穷举所有复杂卡牌与深层外星人后期结算。

### B. 真实服务端集成/引擎测试

用于验证：

1. 复杂时序
2. 延迟行动队列
3. 外星人发现/结算
4. 重点卡牌逻辑
5. 终局计分/惩罚

限制：

1. 不是浏览器级 E2E。
2. 但依然是“真实规则引擎”，不是 mock。

### C. Debug/Replay 测试

当前仓库存在这类测试，但它们不能算进“真实 UI 冒烟覆盖”完成度，只能算开发辅助。

## 3. 当前已确认的真实 E2E 能力

基于现有代码与配置，已经确认：

1. `packages/e2e/tests/game-flow-user-path.spec.ts`
2. `packages/e2e/tests/game-flow-behavior.spec.ts`
3. `packages/e2e/tests/room-configured-flow.spec.ts`
4. `packages/e2e/tests/smoke-probe-scan.spec.ts`

这些 spec 已满足：

1. 真实 UI 注册/登录
2. 真实创建房间/加入房间/开局
3. 双浏览器上下文同步
4. PASS 交接
5. LAUNCH_PROBE -> END_TURN -> SCAN 的真实动作链

另外，房间创建 UI 可精确配置 `alienModulesEnabled`，而服务端只会从启用的核心外星人中随机取 2 个：

1. 如果只启用 2 个核心外星人，则本局外星人组合是确定的。
2. 这使得“5 种外星人的真实房间配置冒烟”可稳定完成。

## 4. 完成标准

要认为“真实测试体系覆盖到当前目标”，至少需要满足：

1. 有一份完整冒烟清单文档。
2. 文档中每个条目都标明建议测试层级：
   - `E2E`
   - `Engine`
   - `Deferred`
   - `Backlog`
3. 至少有一组真实 Playwright 用例覆盖：
   - auth
   - lobby
   - room config
   - in-game action timing
   - 5 种外星人房间配置可见性/初始化
4. 至少有一组服务端真实测试覆盖：
   - 5 种外星人特殊规则
   - 重点 alien 卡牌
   - 关键延迟结算
   - 终局 alien bonus / penalty
5. 最终运行结果要明确说明：
   - 已跑通哪些
   - 未跑通哪些
   - 哪些仍是缺口

## 5. 真实 E2E 冒烟清单

状态字段说明：

1. `已覆盖`：仓库已有真实 UI E2E。
2. `本轮补充`：本轮新增真实 UI E2E。
3. `待补充`：应该补，但当前未实现。
4. `不适合 E2E`：应改由 engine 层覆盖。

### 5.1 认证与入口

1. 注册新用户并跳转大厅
   - 层级：E2E
   - 状态：已覆盖
2. 登录已有用户并跳转大厅
   - 层级：E2E
   - 状态：已覆盖
3. 两个独立浏览器上下文分别完成注册/登录
   - 层级：E2E
   - 状态：已覆盖

### 5.2 大厅与房间

1. 房主创建 2 人房
   - 层级：E2E
   - 状态：已覆盖
2. 房主创建 3 人房/4 人房
   - 层级：E2E
   - 状态：本轮补充
3. 客户端正确显示房间设置
   - 层级：E2E
   - 状态：已覆盖
4. 第二玩家加入房间
   - 层级：E2E
   - 状态：已覆盖
5. 房主启动游戏
   - 层级：E2E
   - 状态：已覆盖
6. 所有玩家从房间进入游戏页
   - 层级：E2E
   - 状态：已覆盖

### 5.3 房间规则配置

1. 玩家数配置正确回显
   - 层级：E2E
   - 状态：已覆盖
2. `undoAllowed` 配置正确回显
   - 层级：E2E
   - 状态：已覆盖
3. `timerPerTurn` 配置正确回显
   - 层级：E2E
   - 状态：已覆盖
4. 外星人池可按 UI 精确勾选
   - 层级：E2E
   - 状态：本轮补充
5. 只启用两个外星人时，开局后游戏内只出现这两个外星人版面
   - 层级：E2E
   - 状态：本轮补充

### 5.4 开局与基础同步

1. 双方都收到初始 `game:state`
   - 层级：E2E
   - 状态：已覆盖
2. setup tuck 完成后进入主动作阶段
   - 层级：E2E
   - 状态：已覆盖
   - 证据：`real-flow.ts` 的 `launchGameByUi` / `enterGameByUi` 会通过正式 UI 处理 setup card prompt；随后多条真实 E2E 均通过 `waitForActionOwner` 等待主行动按钮变为 enabled。
3. 当前行动玩家正确显示可执行主行动
   - 层级：E2E
   - 状态：已覆盖
4. 非当前玩家不可执行主行动
   - 层级：E2E
   - 状态：已覆盖

### 5.5 主行动真实冒烟

1. PASS
   - 层级：E2E
   - 状态：已覆盖
2. LAUNCH_PROBE
   - 层级：E2E
   - 状态：已覆盖
3. SCAN
   - 层级：E2E
   - 状态：已覆盖
4. ANALYZE_DATA
   - 层级：E2E
   - 状态：本轮补充
   - 证据：`packages/e2e/tests/main-action-analyze-data.spec.ts` 使用正式注册/建房/进房/开局流程，通过确定性 seed、真实 `PLAY_CARD`、`USE_CARD_CORNER`、`PLACE_DATA` 填满顶行电脑，结束当前回合并由另一玩家 `PASS` 后，再通过真实 UI 执行 `ANALYZE_DATA`、消耗能量并选择 `alien-0-discovery-blue-trace`。
5. RESEARCH_TECH
   - 层级：E2E
   - 状态：本轮补充
6. PLAY_CARD
   - 层级：E2E
   - 状态：本轮补充
7. ORBIT
   - 层级：E2E
   - 状态：本轮补充
8. LAND
   - 层级：E2E
   - 状态：本轮补充

说明：`ORBIT/LAND/PLAY_CARD/ANALYZE_DATA/RESEARCH_TECH` 的真实 UI 覆盖价值高，但到达条件更多，已拆分多条 spec，避免塞进一个超长用例。`ANALYZE_DATA` 使用短前置链路覆盖，不再依赖多次 `SCAN` 扫满电脑。

### 5.6 自由行动真实冒烟

1. END_TURN
   - 层级：E2E
   - 状态：已覆盖
2. MOVEMENT
   - 层级：E2E
   - 状态：本轮补充
3. COMPLETE_MISSION
   - 层级：E2E
   - 状态：本轮补充
   - 备注：通过真实注册/建房/加入/开局/回合交接，使用正式房间 seed 固定起手 NIAC Program；玩家真实打出 NIAC、用 `USE_CARD_CORNER` 清空手牌，再通过 `COMPLETE_MISSION` 领取任务奖励。
4. PLACE_DATA
   - 层级：E2E
   - 状态：本轮补充
5. EXCHANGE_RESOURCES
   - 层级：E2E
   - 状态：本轮补充
6. CONVERT_ENERGY_TO_MOVEMENT
   - 层级：E2E
   - 状态：本轮补充
7. USE_CARD_CORNER
   - 层级：E2E
   - 状态：本轮补充
8. BUY_CARD
   - 层级：E2E
   - 状态：本轮补充
9. SPEND_SIGNAL_TOKEN
   - 层级：E2E
   - 状态：本轮补充
   - 备注：通过正式大厅建房/加入/开局流程，使用正式 `scenarioPreset=spend-signal-token` 建立可恢复的 scan 前置状态；测试通过真实 UI 执行 `SCAN`、展开自由行动、点击 `SPEND_SIGNAL_TOKEN`、选择卡牌、确认、选择信号扇区，并验证 signal token 消耗且返回 scan 子行动池。未使用 `/debug/*`、DB 改状态或 raw websocket action driving。
10. DELIVER_SAMPLE
   - 层级：E2E
   - 状态：本轮补充
   - 备注：通过正式大厅建房/加入/开局流程，使用正式 `scenarioPreset=deliver-sample` 与正式 Mascamites 房间配置建立样本胶囊可交付状态；测试通过真实 UI 查看 Aliens 页胶囊、点击 `DELIVER_SAMPLE`，并验证胶囊消失、delivered sample 出现在 Mascamites 版面且按钮变为 disabled。

### 5.7 时序与行动队列

这些是当前目标里的重点，必须明确列成独立项。

1. 主行动后进入 `AWAIT_END_TURN`
   - 层级：E2E
   - 状态：已覆盖
2. 主行动后允许继续执行合法自由行动，再 End Turn
   - 层级：E2E
   - 状态：本轮补充
3. PASS 后立即进行回合交接
   - 层级：E2E
   - 状态：已覆盖
4. SCAN 子行动池按输入逐步解析后才能结束回合
   - 层级：E2E
   - 状态：已覆盖
5. 多个待处理输入按顺序串联
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`DeferredActionsQueue.test.ts` 覆盖 input 暂停与恢复；`Pass.test.ts` 覆盖 discard -> end-of-round card selection；`PlayCard.test.ts` 覆盖 mission prompt 串联与完成/跳过分支。
6. 延迟动作队列在回合末按优先级结算
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`DeferredActionsQueue.test.ts` 覆盖优先级排序、同优先级 FIFO、drain 期间新插入 action 重新排序；`Priority.test.ts` 锁定 `MILESTONE < DISCOVERY < TURN_HANDOFF` 等优先级关系。
7. 里程碑、外星人发现、扇区完成在主行动后正确插队/排队
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`Game.ts` 主行动 pipeline 固定插入 `ResolveSectorCompletion`，回合间 pipeline 固定插入 `ResolveMilestone -> ResolveDiscovery -> TURN_HANDOFF`；`Milestone.test.ts` 覆盖 neutral milestone 后再 discovery；`ResolveSectorCompletion.test.ts` 覆盖真实 game queue drain。

### 5.8 扇区与扫描

1. Earth sector 标记
   - 层级：E2E
   - 状态：已覆盖
2. Card row 对应颜色扇区标记
   - 层级：E2E
   - 状态：已覆盖
3. 扫描输入池中“先做子项再 Done”
   - 层级：E2E
   - 状态：已覆盖
4. 扇区完成、胜负判定、平局后置者获胜
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`SectorFulfillmentEffect.test.ts` 与 `ResolveSectorCompletion.test.ts` 覆盖 fulfilled sector resolve、winner bonus、later marker tie-break、多扇区顺序选择。
5. 扇区重置与 second place 留标
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`SectorFulfillmentEffect.test.ts` 覆盖 reset 后 second-place marker 保留在 index 0、其他 marker 回收、第二名额外 marker 回收。

## 6. 重点卡牌结算清单

这里的“重点卡牌”不追求一次性穷举全牌库，而是优先覆盖已经实现了 alien / 特殊规则 / 复杂时序的卡。

### 6.1 基础牌与通用动作牌

1. 会额外触发 trace input 的基础牌
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`BehaviorExecutor.test.ts` 覆盖 `markTrace` 通过 `AlienState` 生成真实 trace input；`BaseRepresentativeCards.test.ts` 覆盖 `Card 75` 的 ANY trace；`PlayCard.test.ts` 覆盖 Analyze/PlayCard 相关 trace prompt 串联。
2. 会抽牌并影响 undo 锁定的牌
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`BehaviorExecutor.test.ts` 与 `BaseRepresentativeCards.test.ts` 覆盖 drawCards 走真实 main deck/card row refill；`drawCard.test.ts` 覆盖抽牌并调用 turn lock；`GameManager`/serializer 层另有 undo checkpoint 覆盖。
3. 会触发 mission register / complete 的牌
   - 层级：Engine
   - 状态：已覆盖
   - 证据：`PlayCard.test.ts` 覆盖 quick mission 立即完成、跳过后自由行动完成、full mission 自身不触发、trigger mission 分支逐步完成；`ProbeMissionCards.test.ts` 与 `TechMissionCards.test.ts` 覆盖多类 mission condition/reward。

### 6.2 Centaurians 重点卡牌

1. `ET.31` income message
   - 层级：Engine
   - 状态：已覆盖
2. `ET.34` delayed red trace
   - 层级：Engine
   - 状态：已覆盖
3. `ET.35` delayed trace then discard
   - 层级：Engine
   - 状态：已覆盖
4. `ET.37` credit + any trace
   - 层级：Engine
   - 状态：已覆盖
5. `CentaurianMessageCard`
   - 层级：Engine
   - 状态：已覆盖

### 6.3 Exertians 重点卡牌

1. 发现时发三张外星牌
   - 层级：Engine
   - 状态：已覆盖
2. discovery marker 额外发牌
   - 层级：Engine
   - 状态：已覆盖
3. 面朝下打出 Exertian card
   - 层级：Engine
   - 状态：已覆盖
4. +20 / +40 里程碑带来的额外 face-down play
   - 层级：Engine
   - 状态：已覆盖

### 6.4 Mascamites 重点卡牌/动作

1. 采样时从可见样本中选择
   - 层级：Engine
   - 状态：已覆盖
2. `DELIVER_SAMPLE` 完成任务并发放样本奖励
   - 层级：Engine
   - 状态：已覆盖
3. 已交付样本转蓝色 trace slot
   - 层级：Engine
   - 状态：已覆盖
4. 胶囊移动不计入常规 probe limit
   - 层级：Engine
   - 状态：已覆盖

### 6.5 Oumuamua 重点卡牌/动作

1. Oumuamua tile discover 初始化
   - 层级：Engine
   - 状态：已覆盖
2. sector vs tile signal 二选一输入
   - 层级：Engine
   - 状态：已覆盖
3. tile 完成发 exofossil 并重置
   - 层级：Engine
   - 状态：已覆盖
4. 视作合法 planet 可 orbit / land
   - 层级：Engine
   - 状态：已覆盖

### 6.6 Anomalies 重点卡牌/动作

1. 发现时创建 3 根 anomaly columns
   - 层级：Engine
   - 状态：已覆盖
2. 发现时在 Earth / Earth+3 / Earth-3 创建 token
   - 层级：Engine
   - 状态：已覆盖
3. 旋转触发 Earth sector 对应 token 奖励
   - 层级：Engine
   - 状态：已覆盖
4. 仅玩家 marker 生效，neutral 不生效
   - 层级：Engine
   - 状态：已覆盖

## 7. 五种外星人规则覆盖矩阵

### 7.1 Anomalies

1. 特殊规则
   - 发现后生成三色 anomaly column
   - 太阳系上生成三枚 anomaly token
   - 旋转时依据 Earth 所在扇区触发 token 奖励
2. 卡牌
   - `SignsOfLife`、`AreWeBeingObserved`、`ListeningCarefully`、`AmazingUncertainty`
3. 结算
   - 旋转触发奖励
   - neutral marker 无效
4. 推荐层级
   - 真实 E2E：房间配置 + 版面出现
   - Engine：触发与奖励细节
5. 当前状态
   - 状态：已覆盖
   - 证据：`AnomaliesAlienPlugin.test.ts` 覆盖发现、column/token 初始化、旋转奖励、neutral marker 无效；`AnomaliesCards.test.ts` 与对应单卡测试覆盖 ET.11-ET.20 的代表卡效果。

### 7.2 Centaurians

1. 特殊规则
   - 发现后建立 personal message milestone
   - 里程碑达成后从 reward market 领取收益
2. 卡牌
   - `ET.31`, `ET.34`, `ET.35`, `ET.37`, `CentaurianMessageCard`
3. 结算
   - 多条 message 同 turn end 连续结算
   - income / trace / reward-slot 互斥分支
4. 推荐层级
   - 真实 E2E：房间配置 + 版面出现
   - Engine：message milestone 与 reward slot
5. 当前状态
   - 状态：已覆盖
   - 证据：`CentauriansAlienPlugin.test.ts` 覆盖发现、message milestone、reward slots、连续 message FIFO；`CentaurianMessageCard.test.ts` 与 `Milestone.test.ts` 覆盖 ET.31/34/35/37 的延迟结算分支。

### 7.3 Exertians

1. 特殊规则
   - 发现后每人拿三张 Exertian 牌
   - discovery marker 额外拿牌
   - 面朝下埋牌
   - +20 / +40 里程碑触发额外埋牌机会
   - 终局 danger penalty
2. 卡牌
   - face-down Exertian cards 全部属于重点对象
3. 结算
   - 发现分发
   - 里程碑触发
   - 终局惩罚
4. 推荐层级
   - 真实 E2E：房间配置 + 版面出现
   - Engine：发牌/埋牌/终局 penalty
5. 当前状态
   - 状态：已覆盖
   - 证据：`ExertiansAlienPlugin.test.ts` 覆盖发现发牌、discovery marker 额外发牌、face-down play、+20/+40 milestone；`FinalScoring.test.ts` 覆盖 fulfilled face-down cards 与 danger penalty。

### 7.4 Mascamites

1. 特殊规则
   - Jupiter/Saturn 样本池
   - 采样生成胶囊
   - 胶囊走太阳系移动规则
   - 运回任务点后转成交付样本与蓝色 trace slot
2. 卡牌
   - `ET.1` 等 sample-delivery mission
   - `BreedingSample`
   - `MassSampleCollection`
   - `RoverExploration`
   - `TheQueen`
3. 结算
   - collect
   - move
   - deliver
   - reward slot claim
4. 推荐层级
   - 真实 E2E：房间配置 + 版面出现
   - Engine：样本/胶囊/交付/蓝槽
5. 当前状态
   - 状态：已覆盖
   - 证据：`MascamitesAlienPlugin.test.ts` 覆盖样本池、可见样本选择、胶囊移动、probe limit 排除、交付、蓝色 trace slot；`MascamitesCards.test.ts` 覆盖 ET.1-ET.10 代表卡和样本任务流程。

### 7.5 Oumuamua

1. 特殊规则
   - 固定 ring-3 slot
   - 当前扇区随旋转变化
   - 扫描时扇区/陨石 tile 二选一
   - tile 完成给 exofossil
2. 卡牌
   - `ExofossilDiscovery`
   - `VisitorInTheSky`
   - `AlteredTrajectory`
3. 结算
   - discover
   - tile mark
   - tile completion reset
   - orbit/land legality
4. 推荐层级
   - 真实 E2E：房间配置 + 版面出现
   - Engine：tile 与 exofossil 全流程
5. 当前状态
   - 状态：已覆盖
   - 证据：`OumuamuaAlienPlugin.test.ts` 覆盖 discover 初始化、固定 ring-3 slot、sector/tile choice、tile completion reset、orbit/land 合法性；`ExofossilDiscoveryCard.test.ts`、`VisitorInTheSkyCard.test.ts`、`AlteredTrajectoryCard.test.ts` 等覆盖代表卡。

## 8. 本轮实施优先级

### P0（已完成）

1. 补充“指定外星人池”的真实 E2E。
2. 确认 5 种外星人都能通过正式房间配置稳定出现在游戏中。
3. 跑通现有真实流程 E2E：
   - `room-configured-flow`
   - `smoke-probe-scan`
   - 新增的 alien-pool spec

### P1（已完成）

1. 补充真实 E2E：
   - movement
   - research tech
   - orbit / land
   - play card
   - analyze data
   - complete mission
2. 复核 server alien plugin tests 是否都在 CI/本地可跑。
   - 本轮验证：`pnpm --filter @seti/server test -- __tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts __tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts __tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts __tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts __tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts __tests__/engine/cards/alien/AnomaliesCards.test.ts __tests__/engine/cards/alien/MascamitesCards.test.ts __tests__/engine/cards/alien/CentaurianMessageCard.test.ts __tests__/engine/scoring/FinalScoring.test.ts`，结果 `9 passed / 109 tests`。

### P2（已完成审计）

1. 为“重点卡牌效果结算”补更系统的覆盖索引文档。
2. 把延迟队列、里程碑、扇区完成的时序验证整理成单独的 engine 集成测试矩阵。

### Backlog

1. 为 Space Agency / expansion 牌库补正式房间配置入口后，可把 `SPEND_SIGNAL_TOKEN` 从 formal scenario 冒烟升级为完整自然牌库路径。
2. 为 Mascamites 样本任务补更短的自然 UI 前置链路后，可把 `DELIVER_SAMPLE` 从 formal scenario 冒烟升级为完整采样-移动-交付路径。

## 9. 当前缺口结论

截至本轮补充后，真实 UI E2E 已覆盖：

1. 五种外星人的房间配置组合与游戏内展示矩阵
2. movement / orbit / land / research tech / play card / analyze data 的真实用户路径
3. 多个常用自由行动串联，包括 `USE_CARD_CORNER -> COMPLETE_MISSION`
4. 通过正式 scenario preset 覆盖 `SPEND_SIGNAL_TOKEN` 与 `DELIVER_SAMPLE` 的真实 UI 点击与状态变化。

当前不再保留明确的真实 UI E2E 行动缺口。仍需注意：`SPEND_SIGNAL_TOKEN` 与 `DELIVER_SAMPLE` 目前走 formal scenario preset 来缩短随机长前置链路，后续可在扩展牌库配置和 Mascamites 自然采样链路更稳定后升级为完整自然路径。

但在 server 真实测试层，五种外星人的核心插件逻辑已具备相当覆盖，尤其：

1. `AnomaliesAlienPlugin.test.ts`
2. `CentauriansAlienPlugin.test.ts`
3. `ExertiansAlienPlugin.test.ts`
4. `MascamitesAlienPlugin.test.ts`
5. `OumuamuaAlienPlugin.test.ts`

因此本轮工作的正确方向不是“把所有复杂规则都塞进一个浏览器冒烟用例”，而是：

1. 让真实 E2E 负责正式用户流、正式配置、正式同步、正式基础行动。
2. 让 engine 测试负责复杂规则、复杂卡牌、复杂结算。
3. 用这份清单明确区分完成度，避免把 debug 测试误算成真实 E2E 覆盖。

## 10. 本轮实际验证结果

### 10.1 真实 UI E2E

已运行真实前后端与真实数据库的 Playwright 子集：

```bash
./scripts/run-e2e-local.sh tests/alien-pool-config.spec.ts tests/free-action-movement.spec.ts tests/free-action-buy-card.spec.ts tests/free-action-exchange.spec.ts tests/free-action-place-data.spec.ts tests/free-action-card-corner.spec.ts tests/free-action-complete-mission.spec.ts tests/main-action-play-card.spec.ts tests/main-action-research-tech.spec.ts tests/main-action-orbit-land.spec.ts tests/main-action-analyze-data.spec.ts tests/room-multiplayer.spec.ts tests/room-configured-flow.spec.ts tests/game-flow.spec.ts tests/game-flow-behavior.spec.ts tests/game-flow-user-path.spec.ts tests/smoke-probe-scan.spec.ts
```

结果：`20 passed (1.6m)`。

补充运行剩余两个 formal scenario UI 冒烟：

```bash
./scripts/run-e2e-local.sh tests/free-action-spend-signal-token.spec.ts tests/free-action-deliver-sample.spec.ts
```

结果：`2 passed (21.8s)`。

该子集覆盖：

1. UI 注册/登录、房间创建、加入、开局、进游戏页。
2. 2/3/4 人房配置回显。
3. 五种核心外星人的正式房间配置矩阵与游戏内版面出现。
4. `PASS`、`LAUNCH_PROBE`、`SCAN`、`PLAY_CARD`、`RESEARCH_TECH`、`ORBIT`、`LAND`、`ANALYZE_DATA`。
5. `END_TURN`、`MOVEMENT`、`CONVERT_ENERGY_TO_MOVEMENT`、`PLACE_DATA`、`EXCHANGE_RESOURCES`、`USE_CARD_CORNER`、`BUY_CARD`、`COMPLETE_MISSION`、`SPEND_SIGNAL_TOKEN`、`DELIVER_SAMPLE`。
6. 主行动后 `AWAIT_END_TURN`、自由行动插入、回合交接、事件同步。

`main-action-analyze-data.spec.ts` 另单独目标运行：`1 passed (6.9s)`。

### 10.2 Engine/Server 规则验证

行动队列、时序、扇区、重点基础牌子集：

```bash
pnpm --filter @seti/server test -- __tests__/engine/deferred/DeferredActionsQueue.test.ts __tests__/engine/deferred/Priority.test.ts __tests__/engine/deferred/ResolveSectorCompletion.test.ts __tests__/engine/effects/scan/SectorFulfillmentEffect.test.ts __tests__/engine/actions/Pass.test.ts __tests__/engine/actions/PlayCard.test.ts __tests__/engine/cards/BaseRepresentativeCards.test.ts
```

结果：`7 passed / 65 tests`。

五种核心外星人插件、外星牌、终局结算子集：

```bash
pnpm --filter @seti/server test -- __tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts __tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts __tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts __tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts __tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts __tests__/engine/cards/alien/AnomaliesCards.test.ts __tests__/engine/cards/alien/MascamitesCards.test.ts __tests__/engine/cards/alien/CentaurianMessageCard.test.ts __tests__/engine/scoring/FinalScoring.test.ts
```

结果：`9 passed / 109 tests`。

### 10.3 No-Mock 审计

计入本清单真实 UI 覆盖的 spec 没有使用：

1. `injectAuth`
2. `/debug/*`
3. raw websocket action driving
4. DB 直接改状态

当前只有少数正式 UI 用例在建房请求上使用 `page.route` 注入 deterministic seed 或 formal scenario preset：

1. `free-action-complete-mission.spec.ts`
2. `main-action-analyze-data.spec.ts`
3. `free-action-spend-signal-token.spec.ts`
4. `free-action-deliver-sample.spec.ts`

这不是模拟服务端响应；请求仍发往真实 `/lobby/rooms`，由真实后端创建房间、持久化数据库并启动真实 websocket/game flow。用途仅是让正式牌序或正式 scenario 稳定，避免把冒烟测试变成随机长链路。

### 10.4 仍需说明的真实 UI 边界

1. `SPEND_SIGNAL_TOKEN`
   - 已纳入正式 UI E2E，但走 formal scenario preset 来稳定 signal token 与 scan 前置状态。
   - 仍未覆盖完整自然牌库路径，原因是当前默认 formal room setup 只加载 `baseCards`，base 牌库没有稳定可达的 signal-token 资源来源；完整自然路径需要正式扩展配置入口或更稳定的 Space Agency/外星牌链路。
2. `DELIVER_SAMPLE`
   - 已纳入正式 UI E2E，但走 formal scenario preset 来稳定 Mascamites 样本胶囊与任务前置状态。
   - 仍未覆盖完整自然采样链路，原因是正式 UI 前置需要发现 Mascamites、抽到并打出样本任务牌、采样生成 capsule、把 capsule 移动到任务目的地，再交付；该链路适合后续拆成更长的专项 E2E。
