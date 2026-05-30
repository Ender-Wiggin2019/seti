# Lessons

## 身份与持久化边界

- JWT 通过签名验证后，仍要确认 `sub` 对应用户存在；所有写 `users.id` 外键的入口都应在写库前返回明确 401，数据库外键只做最后防线。
- E2E reset 只清游戏持久化状态，保留 `users`，避免浏览器保存的 token 指向被删除账号。

## 验证策略

- 每个 bug 或需求都要先有旧实现失败、新实现通过的可观察断言；跑过“相关测试”不等于覆盖了用户报告点。
- Smoke 只证明路径可达；核心规则要覆盖真实用户操作到可观察规则结果，长流程用固定样例或显式 deterministic setup，并说明它不是 mock/debug/WS shortcut。
- UI/规则回归先列矩阵再断言：actor/view、text/image、action/card 类型、条件显示正反面、server/common 投影到 DOM/图片/alt/test id 的一致性。
- checklist 按实体列出时，测试也要按实体可追踪：例如 11 个 corporation 不能只用一个循环测试覆盖，至少要用 per-corporation 命名的 `it.each`/单测，让失败能直接指向具体 corporation。
- 验证结束前反问：如果原 bug 仍存在，这个测试会失败吗；不会就补更具体断言。

## E2E 真实路径

- 生产路径 E2E 不使用 debug endpoint、localStorage 注入、raw websocket action 或 mock network；debug replay/checkpoint 只能作为明确标注的长前置补充。
- 本地 E2E harness 必须隔离端口并强制端口绑定；如果已有 dev server 占用默认端口，不能让 Vite 自动换端口或让测试混用旧 client。
- E2E runtime 版本要匹配 Vite/Playwright 的真实要求；Node 22.11 虽然大于 20.19，但仍不满足 Vite 的 22.12+ 要求。
- Helper 必须处理真实 pending input（如 tuck-for-income），不能越过 UI 继续点击后续动作。
- 截图证据必须直接露出用户点名元素；响应式布局导致分屏时，分别截图并附 DOM/test locator 证据。
- 涉及 game 页 UI 的验收不能只停在 app shell 或 debug route；必须至少通过 UI 新建一个真实 game 并进入 `/game/{gameId}`，再断言目标区域。

## UI 语义渲染

- Flow debug 和 UI 校准 debug 要分 route：`/debug/game` 用来验证真实/调试游戏流程，hotspot 位置校准应放在独立 `/debug/hotspots`，用 fixtures + tabs 覆盖组件，不要把流程验证页当 UI 编辑器复用。
- Hotspot 校准编辑不能拖动即持久化；位置/尺寸调整应先进非持久化草稿，只有显式 Save 才写入持久配置，这样刷新页面可以丢弃误改。
- Hotspot 拖动坐标系不能简单取 `parentElement`；图片 overlay 常有分组 wrapper，拖动应优先使用实际定位坐标系 `offsetParent`，否则 planet board 这类空 wrapper 会得到 0 宽高。
- Hotspot debug 页面需要可控密度；interactive hit areas 和 pure anchors 应能独立显示/隐藏，避免一次展示过多 label 导致无法校准。
- Hotspot 校准范围不能只按“可点击按钮”定义；凡是叠在 game 图片资源上的绝对定位 token、marker、trace、badge、card overlay，也要进入可保存 anchor 或在 review 中明确排除。
- Alien board 的 trace hotspot 不能只覆盖最底部/第一个 slot；通常所有 server 暴露为合法 option 的 trace slot 都应可标记，尤其 Mascamites blue sample path 这类非直列 trace。
- Alien board trace 奖励、slot id 和 fixture 数据不能在 server/client 各手写一份；如果 debug hotspot、server public state 和真实规则都要读同一组奖励，先放到 common，再由 server plugin 和 client fixture 共同消费。
- Hotspot debug fixtures 不能只模拟一个合法动作模式；校准页应按 common/server 语义覆盖完整坐标集合，例如 planet board 要同时展示全部 planet、orbit、land、moon slot，否则 LAND-only fixture 会漏掉 orbit 和不在选项里的 planet。
- Hotspot debug fixture 的 id 必须和真实 game public state 完全一致；不能用 `space-0` 这类本地假 id 代替 server 的 `ring-1-cell-0`，否则 debug 页保存成功但 game 路由不会命中同一个 override key。
- Text mode 和 image mode 的 board hotspot 不应共享同一位置 override；如果两种模式使用不同坐标系，保持同一交互组件，但用 mode variant 拆分本地配置命名空间。
- Hotspot debug 页的模式切换必须显式显示可选模式名和选中态，例如 `Image Mode` / `Text Mode`；不要用 `Text Mode Off` 这类状态文案，否则用户容易在错误 namespace 下编辑。
- Sector debug fixture 不能只塞部分 signals；如果 server 语义保证 sector 最终总是填满容量，就要把 debug 示例也填满，空位会把状态示例误读成渲染 bug。
- Rival board progress 不能只暴露当前 marker；12 个 printed progress spot 都是需要校准的 anchor，当前 marker 只是其中一个 slot 的视觉内容。
- Hotspot debug 页的组件清单要包含 Personal Player Board；即使它不是传统点击大板，叠在 `playerBoard.png` 上的资源、tech、computer、income、mission 区域也应进入 `player-board` scene，并按 image/text variant 保存。
- 做 SETI 客户端整体文案时，不能把“太空科幻”泛化成终端、观测台、档案室或任务控制台；若用户点名 Space Agency/太空机构，应先读取 `docs/arch/spaceAgency/rulebook.md`，围绕“强大组织、各自愿景/方法/动机、首次接触竞争、组织能力/快速起步”来命名。
- 规则、奖励、desc 图标统一走 `DescRender` / `EffectFactory`；不要用颜色块、字母或临时图片替代。
- 修 board 状态时不要用“新数组 + deprecated 单值”长期并存来兼容；除非明确有外部协议约束，否则当前 public/runtime state 只能保留一个规范字段，旧快照兼容放在 deserializer 边界。
- 新项目不要为旧 snapshot/debug 数据保留并行兼容路径；board/text-mode 位置类视图应以 server public state 为唯一数据源，测试也要提供新协议数据，而不是依赖组件内推导兜底。
- Planet board 的 text/image 两种模式都要覆盖交互语义；如果 image mode 能点 moon，text mode 的 moon block 也要能通过相同 main-action payload 发 `isMoon`。
- Planet board E2E 不要只断言 text-mode `planet-card-*`；image mode 默认渲染 `planet-target-*` 和 token overlay，测试应显式切 text mode 或同时支持 image-mode selectors。
- Token/board 视觉要表达规则语义：solar anomaly token 是奖励 pill（trace 色辅助、desc icon 居中），alien trace slot 用同色 border 容器，hidden board 不泄露真实 trace。
- 不要把 Anomalies 的 solar sector token 协议扩成通用 alien token；新 alien 的 board token 应独立建 public state/组件，并按规则只投影到实际所在 board（如 Glyphids planet token 在 planet board，不在 solar board）。
- Anomalies board 保持 red/yellow/blue 三列横排；单列内部按规则读法让低 index 在底部，压缩布局优先减 padding/slot 宽度，不牺牲 desc icon 可读性。
- UI 缩放控件不能只改 `max-width`；如果用户预期布局变小，必须改实际 reserved `width`/`height`，并在浏览器里检查 `getBoundingClientRect()`，不只看 style attribute。
- Player input 是动作提示区域，不应直接塞完整 board 级组件；tech/card 等输入要用紧凑选择控件，并把完整 board 保留在对应 board tab。
- 当把某个 pending input 改成 board/map 交互时，不能只接 board click；还必须让 action dock 停止渲染原始 `SelectOption` 列表，并用专门的轻量提示覆盖截图中可见的用户路径。
- 对 board/map 接管的 `SelectOption`，不要把非地图响应一并藏掉；例如 `done`/`skip` 这类结束选项仍要在提示区保留明确按钮，否则用户完成一次地图操作后会被困在没有响应控件的 pending input。
- Player input 的 compact tech 不能只显示 tile/name；若 public tech board 提供 stack 状态，必须显示 first 2VP 状态和 printed/back bonus，并复用 `TechStack` 的 bonus 语义。
- Player input 中所有真实卡牌展示都应走统一 client `CardRender` 包装；tuck income 的 `HandView -> CardRender` 路径是参考实现，quick-start/prelude 等卡牌预览也要复用同一入口。
- 接入 prelude card 时不要重写正常图片版组件；image mode 继续用维护中的 `@seti/cards/PreludeCard`，只在 client `CardRender` 的 text mode 分支补对应文本渲染。
- Text mode card 的价格应是左上角紧凑 readout，例如 `3 C` / `3 E`；数字更大更粗，资源字母更小，不要再用右上角 `#id + full priceType` 堆叠。
- Text mode desc 不能直接输出翻译字符串；应先用通用 desc parser 安全拆分 `<br>` 和 `{token}`，换行渲染成真实 DOM，token 渲染成可读文本。
- 给复合 board 增加局部 image/text mode override 时，不能只改最外层组件；所有读取全局 `useTextMode()` 的子渲染器都要接收同一个 override。回归测试要把全局 mode 设成相反值，验证局部入参不会被全局状态污染。

## Solo / Alien 规则覆盖

- Alien/Solo 改动要覆盖 mark trace、三色 discovery、reveal、专属规则结果；未发现 board 只显示未知占位，真实 trace 只在 Discovery/Overflow 或 reveal 后 board 中出现。
- `scenarioPreset` 被禁用时，先核实 common/server/client 是否已有真实实现；长前置可迁移到明确 Debug Replay checkpoint，不要删除关键覆盖或用普通动作替代特殊规则。
- `SPEND_SIGNAL_TOKEN` 是条件 free action；`DELIVER_SAMPLE` 是 Mascamites sample mission 交付分支，测试和实现都不能用普通 move/sample 代替。

## 规则文档与参考数据

- PDF 资产提取优先保存原始嵌入图片或 native-pixel crop；不要把页面高倍率渲染裁切冒充原始素材，交付前用原图尺寸和清晰度审计说明来源限制。
- 源资料缺图或数据时，优先从 `frontend-reference`、`docs/arch/aliens/*`、FAQ 补足；用户确认点迁入 Confirmed Decisions，并记录来源与冲突优先级。
- `frontend-reference` 只作为行为/数据参考；实现规格必须写清 common/server/client 分工，并把 source alias 映射到项目规范命名。
- 用户确认某机制只需现有选项控制时，不要新增语义相近的 helper 或 public boolean；server/common/client 应读取同一个 options 字段，避免出现第二套开关语义。
- 当出现 Gain Card, Draw Card 等相关文字时，需要明确是 Draw Any Card 还是直接 Draw from Deck。必须明确这个语义。

## 卡牌实现结构

- SETI 卡牌有 gameplay-specific custom logic 时，必须一张卡一个 `*Card.ts` class 文件；不要为了批量实现把多个 card class 聚合到一个大文件里，即使逻辑相近也只抽共享 helper。
- 新增专用卡测试也优先一张卡一个 `*Card.test.ts`；只有确认保留泛型注册的卡，才使用小范围 generic regression 测试文件。
