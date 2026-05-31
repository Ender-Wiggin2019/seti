# Lessons

## 身份与持久化边界

- JWT 通过签名验证后，仍要确认 `sub` 对应用户存在；所有写 `users.id` 外键的入口都应在写库前返回明确 401，数据库外键只做最后防线。
- E2E reset 只清游戏持久化状态，保留 `users`，避免浏览器保存的 token 指向被删除账号。

## 验证策略

- 每个 bug 或需求都要先有旧实现失败、新实现通过的可观察断言；跑过“相关测试”不等于覆盖了用户报告点。
- Smoke 只证明路径可达；核心规则要覆盖真实用户操作到可观察规则结果，长流程用固定样例或显式 deterministic setup，并说明它不是 mock/debug/WS shortcut。
- UI/规则回归先列矩阵再断言：actor/view、text/image、action/card 类型、条件显示正反面、server/common 投影到 DOM/图片/alt/test id 的一致性。
- checklist 按实体列出时，测试也要按实体可追踪；例如 11 个 corporation 不能只用一个循环测试覆盖，至少要用 per-corporation 命名的 `it.each`/单测，让失败能直接指向具体 corporation。
- 验证结束前反问：如果原 bug 仍存在，这个测试会失败吗；不会就补更具体断言。
- 涉及 game 页 UI 的验收不能只停在 app shell、debug route 或 text-mode 专用 selector；必须进入真实 `/game/{gameId}`，并按当前默认渲染模式断言目标区域。
- 截图证据必须直接露出用户点名元素；响应式布局导致分屏时，分别截图并附 DOM/test locator 证据。

## E2E 真实路径

- 生产路径 E2E 不使用 debug endpoint、localStorage 注入、raw websocket action 或 mock network；debug replay/checkpoint 只能作为明确标注的长前置补充。
- 本地 E2E harness 必须隔离端口并强制端口绑定；如果已有 dev server 占用默认端口，不能让 Vite 自动换端口或让测试混用旧 client。
- E2E runtime 版本要匹配 Vite/Playwright 的真实要求；Node 22.11 虽然大于 20.19，但仍不满足 Vite 的 22.12+ 要求。
- Helper 必须处理真实 pending input（如 tuck-for-income），不能越过 UI 继续点击后续动作。

## Hotspot 与校准页

- Flow debug 和 UI 校准 debug 要分 route：`/debug/game` 用来验证真实/调试游戏流程，hotspot 位置校准放在 `/debug/hotspots`，用 fixtures + tabs 覆盖组件。
- Hotspot 校准编辑不能拖动即持久化；位置/尺寸调整应先进非持久化 draft，只有显式 Save 才写入持久配置。
- Text mode 和 image mode 使用不同坐标系时，hotspot override 必须按 variant 拆分命名空间；模式切换控件要明确显示 `Image Mode` / `Text Mode` 与选中态。
- Hotspot 几何只能有一个共享实现：`xPercent` / `yPercent` 要先换算到 scene 坐标，拖动、移动、缩放都基于同一 base geometry；矩形 resize 要分别写 width/height，不能默认正方形。
- 拖动坐标系优先使用实际定位坐标系 `offsetParent`，不能简单取 `parentElement`；图片 overlay 常有分组 wrapper 或 0 宽高 wrapper。
- 全板透明 overlay wrapper 应设为 `pointer-events-none`，只让内部具体 `HotspotAnchor` / `HotspotButton` 接 pointer，避免后渲染空层挡住可拖 anchor。
- Debug 页面需要可控密度：interactive hit areas 和 pure anchors 应能独立显示/隐藏，hover/focus 再显示详细信息，避免标签长期遮挡校准。
- 校准范围不能只按可点击按钮定义；叠在图片资源上的 token、marker、trace、badge、card overlay、readout 都应进入可保存 anchor，或在 review 中明确排除。
- 当一个可点击区域也是需要校准的视觉元素时，保留按钮语义并补同位 anchor；否则 `/debug/hotspots` 会缺少可独立拖动目标。
- Debug fixture 的 id 必须和真实 game public state 完全一致，不能用 `space-0` 这类本地假 id 代替 `ring-1-cell-0`；占用 token/marker 应复用所在 canonical slot 的 hotspot id。
- Debug fixture 必须摆满需要校准的完整内容集合；仅在组件单测里构造满状态不够，校准页本身也要显示完整 tech/token/slot 内容。
- 回归不能只数 slot；有状态视觉内容时要断言每个 slot 的真实内容，例如 12 个 player-board tech slot 都要有 tech tile 图片来源。

## Board 语义与数据源

- 规则、奖励、desc 图标统一走 `DescRender` / `EffectFactory`；不要用颜色块、字母或临时图片替代。
- 修 board 状态时不要用“新数组 + deprecated 单值”长期并存来兼容；除非明确有外部协议约束，否则当前 public/runtime state 只能保留一个规范字段，旧快照兼容放在 deserializer 边界。
- 新项目不要为旧 snapshot/debug 数据保留并行兼容路径；board/text-mode 位置类视图应以 server public state 为唯一数据源，测试也要提供新协议数据。
- 给复合 board 增加局部 image/text mode override 时，不能只改最外层组件；所有读取全局 `useTextMode()` 的子渲染器都要接收同一个 override，并用相反全局 mode 做回归测试。
- Token/board 视觉要表达规则语义：solar anomaly token 是奖励 pill（trace 色辅助、desc icon 居中），alien trace slot 用同色 border 容器，hidden board 不泄露真实 trace。
- 不要把 Anomalies 的 solar sector token 协议扩成通用 alien token；新 alien 的 board token 应独立建 public state/组件，并按规则只投影到实际所在 board。
- Anomalies board 保持 red/yellow/blue 三列横排；单列内部按规则读法让低 index 在底部，压缩布局优先减 padding/slot 宽度，不牺牲 desc icon 可读性。
- UI 缩放控件不能只改 `max-width`；如果用户预期布局变小，必须改实际 reserved `width`/`height`，并在浏览器里检查 `getBoundingClientRect()`。

## Player Board 与输入区

- Player board image mode 不能只做视觉锚点；应保持和真实 board 操作等价的粒度：launch/scan/analyze 触发 main action，place data 触发 free action，12 个 tech slot 独立暴露。
- Player board tech tile hotspot 尺寸要跟原始 tech tile 素材一致；当前原始素材是 `197x276`，不能用方形占位尺寸。
- Player board computer b/d 两列是内置 publicity/tuck 奖励，`techSlotAvailable: false`；image hotspot/debug fixture 不能给它们渲染 bottom tech/data slot anchor。
- Player input 是动作提示区域，不应直接塞完整 board 级组件；tech/card 等输入要用紧凑选择控件，并把完整 board 保留在对应 board tab。
- 当某个 pending input 改成 board/map 交互时，action dock 要停止渲染原始 `SelectOption` 列表，但 `done`/`skip` 这类非地图响应仍要保留明确按钮。
- Player input 的 compact tech 不能只显示 tile/name；若 public tech board 提供 stack 状态，必须显示 first 2VP 状态和 printed/back bonus，并复用 `TechStack` 的 bonus 语义。
- Player input 中所有真实卡牌展示都应走统一 client `CardRender` 包装；tuck income 的 `HandView -> CardRender` 路径是参考实现，quick-start/prelude 等卡牌预览也要复用同一入口。

## Planet、Solar、Rival 与 Alien Board

- Planet board 的 text/image 两种模式都要覆盖交互语义；如果 image mode 能点 moon，text mode 的 moon block 也要能通过相同 main-action payload 发 `isMoon`。
- Oumuamua image-mode 调位置时不能改变既有旋转坐标系；如果用户只反馈定位偏移，保留原来的旋转角/局部朝向，只把可调量接到相同坐标系里。
- Sector debug fixture 不能只塞部分 signals；如果 server 语义保证 sector 最终总是填满容量，debug 示例也要填满。
- Rival board progress 不能只暴露当前 marker；12 个 printed progress spot 都是需要校准的 anchor，当前 marker 只是其中一个 slot 的视觉内容。
- Alien board trace hotspot 不能只覆盖最底部/第一个 slot；所有 server 暴露为合法 option 的 trace slot 都应可标记，尤其 Mascamites blue sample path 这类非直列 trace。
- Alien board trace 奖励、slot id 和 fixture 数据不能在 server/client 各手写一份；如果 debug hotspot、server public state 和真实规则都要读同一组奖励，先放到 common，再由 server plugin 和 client fixture 共同消费。
- Alien/Solo 改动要覆盖 mark trace、三色 discovery、reveal、专属规则结果；未发现 board 只显示未知占位，真实 trace 只在 Discovery/Overflow 或 reveal 后 board 中出现。
- `SPEND_SIGNAL_TOKEN` 是条件 free action；`DELIVER_SAMPLE` 是 Mascamites sample mission 交付分支，测试和实现都不能用普通 move/sample 代替。
- `scenarioPreset` 被禁用时，先核实 common/server/client 是否已有真实实现；长前置可迁移到明确 Debug Replay checkpoint，不要删除关键覆盖或用普通动作替代特殊规则。

## 文案、卡牌与 Desc 渲染

- 做 SETI 客户端整体文案时，不能把“太空科幻”泛化成终端、观测台、档案室或任务控制台；若用户点名 Space Agency/太空机构，应先读取 `docs/arch/spaceAgency/rulebook.md`。
- 接入 prelude card 时不要重写正常图片版组件；image mode 继续用维护中的 `@seti/cards/PreludeCard`，只在 client `CardRender` 的 text mode 分支补对应文本渲染。
- Text mode card 的价格应是左上角紧凑 readout，例如 `3 C` / `3 E`；数字更大更粗，资源字母更小，不要再用右上角 `#id + full priceType` 堆叠。
- Text mode desc 不能直接输出翻译字符串；应先用通用 desc parser 安全拆分 `<br>` 和 `{token}`，换行渲染成真实 DOM，token 渲染成可读文本。

## 规则文档与参考数据

- PDF 资产提取优先保存原始嵌入图片或 native-pixel crop；不要把页面高倍率渲染裁切冒充原始素材，交付前用原图尺寸和清晰度审计说明来源限制。
- 源资料缺图或数据时，优先从 `frontend-reference`、`docs/arch/aliens/*`、FAQ 补足；用户确认点迁入 Confirmed Decisions，并记录来源与冲突优先级。
- `frontend-reference` 只作为行为/数据参考；实现规格必须写清 common/server/client 分工，并把 source alias 映射到项目规范命名。
- 用户确认某机制只需现有选项控制时，不要新增语义相近的 helper 或 public boolean；server/common/client 应读取同一个 options 字段，避免出现第二套开关语义。
- 当出现 Gain Card、Draw Card 等相关文字时，需要明确是 Draw Any Card 还是直接 Draw from Deck。

## 卡牌实现结构

- SETI 卡牌有 gameplay-specific custom logic 时，必须一张卡一个 `*Card.ts` class 文件；不要为了批量实现把多个 card class 聚合到一个大文件里，即使逻辑相近也只抽共享 helper。
- 新增专用卡测试也优先一张卡一个 `*Card.test.ts`；只有确认保留泛型注册的卡，才使用小范围 generic regression 测试文件。
