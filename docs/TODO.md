# TODO

## 当前任务：Cloudflare Workers 接入评估

假设与权衡：
- 本轮只做 server/client 接入 Cloudflare Workers 的可行性评估和方案文档，不改运行代码、不引入 Cloudflare 配置文件。
- “接入 Cloudflare Workers”按两种目标分别判断：client 静态资源部署到 Cloudflare Pages/Workers Assets；server 运行在 Cloudflare Workers runtime。
- 如果 server 不能直接接入，需要明确阻塞依赖、必要改造、推荐阶段性路线和验证方式；不在没有确认的情况下启动迁移实现。
- 评估以当前仓库代码和 package 配置为准，不假设未来会替换框架或数据库。

- [x] 审计 server runtime 依赖
  - 验证: 定位 Nest/Express、Socket.IO、Postgres/Drizzle、Node API、长连接/内存状态等 Workers 兼容性风险
- [x] 审计 client 部署与 API/WS 配置
  - 验证: 明确 Vite build 是否可作为静态资源部署，以及 API/WS endpoint 如何切换到 Cloudflare 域名
- [x] 形成接入结论与改造路线
  - 验证: 给出“能/不能直接接入”的结论、推荐架构、改造清单、风险和验证计划
- [x] 生成方案文档
  - 验证: 文档落在 `docs/` 下，能作为后续实施计划入口
- [x] 记录 review
  - 验证: 本段末尾补充文档路径、结论摘要和未执行项

Review:
- 已生成方案文档：`docs/cloudflare-workers-assessment.md`。
- 结论：`packages/client` 可以先接入 Cloudflare Static Assets / Pages；`packages/server` 不能以当前 Nest `app.listen` + Socket.IO gateway + `pg.Pool` + 进程内 `GameManager` cache/timer/checkpoint 的形态原样运行在 Cloudflare Workers runtime。
- 推荐路线：先把 client 静态部署到 Cloudflare，server 保持 Node origin 并通过 Cloudflare DNS/Tunnel/HTTPS 暴露；后续如需 full Workers 化，新建 Worker API adapter，并把 per-game realtime/game runtime 迁到 Durable Object。
- 本轮验证：阅读并核对 `packages/server/src/main.ts`、`packages/server/src/gateway/game.gateway.ts`、`packages/server/src/gateway/GameManager.ts`、`packages/server/src/persistence/drizzle.module.ts`、`packages/client/src/config/env.ts`、`packages/client/src/api/httpClient.ts`、`packages/client/src/api/wsClient.ts`；确认现有 `packages/client/dist` 约 170 个文件，最大单文件约 2.3 MiB，适合静态资源托管。
- 格式验证：尝试运行 `pnpm exec biome check docs/cloudflare-workers-assessment.md docs/TODO.md`，Biome 按当前配置忽略 Markdown，结果为 0 files processed；已人工复读文档和 TODO 顶部段落。
- 未执行项：没有新增 `wrangler` 配置、没有改 server/client 运行代码、没有跑构建或 E2E；本轮产物是评估方案，真实迁移需另起实施任务并按阶段验证。

## 当前任务：Solo E2E 冒烟完整化

假设与权衡：
- 本轮按 `$e2e-guide` 执行，E2E 不 mock network/websocket，不注入 auth state，不调用 `/debug/*`，不直接驱动 websocket action。
- “完整冒烟”不等于覆盖所有规则分支；本轮目标是把 solo 的真实用户主路径补到可验证：UI 注册/登录、创建 solo 房间、启动真实 game、核心面板存在、Rival panel 细节存在、PASS 后 rival 自动状态更新、同一用户第二会话能看到同步状态。
- “不同 alien 的结算”按可维护的矩阵设计：冒烟层验证 enabled alien 的 board/settlement surface 与已发现后的关键 UI 结果；已经存在的 Anomalies/Centaurians/Oumuamua slow real-ui 流程继续作为深度结算覆盖，本轮优先补齐 solo smoke 的维度和缺口，不用 debug replay 替代。
- 工作区已有未提交改动；本轮只改 E2E/spec/helper 与 TODO 记录，不回滚既有改动。

- [x] 审计现有 solo/alien E2E 与 helper
  - 验证: 明确哪些测试是真实 UI、哪些覆盖 UI 存在、哪些覆盖状态更新、哪些覆盖 alien 结算
- [x] 扩展 solo smoke 的真实用户流程
  - 验证: UI 注册后用第二 browser context 通过登录进入同一个 solo game，不使用 token 注入
- [x] 补齐 solo game UI 多维断言
  - 验证: bottom dashboard/actions/hand、resource bar、event log、board/cards/aliens tabs、rival progress cycle、deck/current card/computer/objectives/tech pile/action card render 都可见且结构合理
- [x] 补齐状态更新与跨会话同步断言
  - 验证: human PASS 后 event log 增加，Rival current card 可见，PASS 回到 enabled；第二会话观察到同一 Rival panel snapshot 与 event log 更新
- [x] 设计并实现 alien 结算矩阵 smoke
  - 验证: 每个 core alien 的启用组合有明确 expected settlement selectors；冒烟层至少断言对应 board surface，深度 slow real-ui 用例覆盖 Anomalies/Centaurians/Oumuamua 已发现结算，Mascamites/Exertians 若缺真实 UI 深度路径则在 review 中列为残余缺口
- [x] 运行定向验证
  - 验证: E2E tsc 通过；目标 Playwright spec 在隔离真实 server/client/db 下通过
- [x] 记录 review
  - 验证: 本段末尾补充改动、命令结果、覆盖矩阵和残余风险

Review:
- Solo smoke：`packages/e2e/tests/solo-smoke.spec.ts` 从单页“能开局 + PASS 后快照变化”扩展为真实双会话流程。Host 通过 UI register/create solo room/start game；observer 通过 UI login 进入同一个 room/game，没有 token 注入、没有 debug endpoint、没有 websocket shortcut。
- UI 覆盖：host 会话断言 bottom actions/dashboard/hand、resource bar、income/data、main actions、Board/Cards/Aliens tabs、event log；Rival panel 断言 progress cycle 12 slot、active slot、draw/discard/current card、tech pile 三类计数、3 张 objective、completed objective pile、6 个 computer slot、rules dialog。Alien smoke surface 断言两个 alien card、discovery/overflow zone 和 red/yellow/blue trace columns。
- 状态更新：PASS 后只由 actor 会话处理真实 EOR pending input，避免同用户双会话重复提交；断言 PASS 回到 enabled、event log 增加、Rival current card 可见、event log hover card 存在，并验证 observer 会话最终看到与 host 一致的 Rival panel snapshot 与增加后的 event log。
- Alien 结算矩阵：新增 `packages/e2e/tests/alien-settlement-real-flow.spec.ts`，补齐之前缺少深度真实 UI 覆盖的 Mascamites 与 Exertians。两个用例都走真实 2-player UI、真实卡牌/行动/输入完成三色 discovery，再断言 Mascamites sample board / trace columns 与 Exertians milestone / trace columns。Anomalies、Centaurians、Oumuamua 继续由现有 `alien-discovery-real-flow.spec.ts`、`centaurians-real-flow.spec.ts`、`oumuamua-real-flow.spec.ts` 覆盖深度结算。
- 验证通过：`node_modules/.pnpm/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit`。
- 验证通过：`NINJA_ENV=production ./scripts/run-e2e-local.sh tests/solo-smoke.spec.ts`，1 passed，17.5s。
- 验证通过：`NINJA_ENV=production ./scripts/run-e2e-local.sh tests/alien-settlement-real-flow.spec.ts`，2 passed，49.0s。
- 验证通过：`pnpm exec biome check packages/e2e/tests/solo-smoke.spec.ts packages/e2e/tests/alien-settlement-real-flow.spec.ts docs/TODO.md`。Biome 当前实际检查 2 个 TS spec，docs Markdown 仍按现有配置忽略。
- 运行说明：首次验证前本机已有同项目 3000/5173 进程，导致 `run-e2e-local.sh` 端口占用且复用环境较慢；已停止这两个同项目进程后用脚本启动干净 server/client 完成最终验证。

## 当前任务：client toast 层级与 Rival progress cycle 优化

假设与权衡：
- error toast 的“最高层级”指它至少应高于现有 Dialog overlay（当前 `z-[1000]`），使 server error 在弹窗、overlay 或 debug 浮层上方仍可见；本轮只调整 toast portal 容器层级，不引入全局 z-index token 重构。
- Rival progress 的 cycle 指 12 个 progress slot 视觉上环形排布，而不是当前 `grid-cols-6` 两行；保留 `progressSlot` 当前 slot 高亮、`progress` 总数 readout、image/text mode 的填充差异。
- 这是 client-only UI 修复，不改 server 规则、common 协议或 rival progress 计数逻辑。
- 工作区已有未提交改动；本轮只在相关 client 文件和测试上做最小增量，不回滚既有改动。

- [x] 写失败测试：toast portal 层级高于 Dialog
  - 验证: 当前 `z-[100]` 会让测试失败；修复后 toast root 明确使用高于 `z-[1000]` 的语义层级
- [x] 写失败测试：Rival progress 使用环形 cycle 排版
  - 验证: 当前 `grid grid-cols-6` 两行实现会失败；修复后 12 个 slot 仍存在且容器标记为 radial/cycle layout
- [x] 实现最小 UI 修复
  - 验证: 只改 `toast.tsx` 的 portal 层级和 `RivalPanel.tsx` 的 progress cycle 排版/样式，不触碰 rival 规则逻辑
- [x] 运行定向验证
  - 验证: `pnpm --filter @seti/client test -- RivalPanel.test.tsx toast.test.tsx` 或对应定向测试通过；必要时跑 client typecheck
- [x] 浏览器视觉检查
  - 验证: 本地 client 中 error toast 可盖过 dialog；Rival progress 在 desktop/mobile 或窄容器下保持环形、文字不溢出
- [x] 记录 review
  - 验证: 本段末尾补充实际改动、命令结果和残余风险

Review:
- Toast 修复：`Toaster` portal 容器从 `z-[100]` 提升到 `z-[1100]`，高于现有 Dialog overlay 的 `z-[1000]`，server error toast 不会再被 modal/overlay 遮挡。
- Rival progress 修复：`RivalProgressCycle` 从 `grid grid-cols-6` 两行布局改为 128px 环形轨道，12 个 slot 通过 rotate/translate 排布在同一半径上；保留 `progressSlot` 当前高亮、image mode 填充色和 text mode 边框色。
- 测试：新增 `Toast.test.tsx` 覆盖 toast z-index 高于 Dialog；扩展 `RivalPanel.test.tsx` 覆盖 `data-layout="radial-cycle"`、不再使用 `grid-cols-6`、12 个 slot 和当前 slot transform。
- 红灯确认：修复前 `RivalPanel.test.tsx` 失败于缺少 `data-layout="radial-cycle"`；`Toast.test.tsx` 失败于 `expected 100 to be greater than 1000`。
- 验证通过：`pnpm --filter @seti/client test -- RivalPanel.test.tsx Toast.test.tsx`（11 tests）、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check packages/client/src/components/ui/toast.tsx packages/client/src/features/solo/RivalPanel.tsx packages/client/__tests__/components/Toast.test.tsx packages/client/__tests__/features/solo/RivalPanel.test.tsx`。
- 浏览器验证：使用 bundled Node 启动 Vite 后通过 Playwright 动态挂载 `RivalPanel` / `Toaster`，确认 cycle 为 `radial-cycle`、slot count 为 12、所有 slot 半径均为 52px、toast computed z-index 为 1100，高于 overlay 1000。默认 Node 18 无法启动 Vite，已改用 Codex bundled Node；Vite 服务验证后已停止。

## 当前任务：修复 lobby 孤儿用户 500

假设与权衡：
- 当前错误来自有效 JWT 的 `sub` 在 `users` 表中不存在，`LobbyService.createRoom` 直接写 `games.hostUserId` 触发外键失败。
- 这属于身份边界问题：受保护 HTTP 接口应在 JWT 验签后确认用户仍存在；lobby 对会写用户外键的入口再做一次最小防御校验。
- 本轮只修 `auth` / `lobby` 的明确错误返回，不引入全局数据库异常映射，不改游戏规则或前端。

- [x] 写失败测试：孤儿 JWT 访问受保护 HTTP 接口返回 401
  - 验证: `jwt-auth.guard.integration.test.ts` 能在用户不存在时失败于当前 200 行为
- [x] 写失败测试：lobby 创建/加入时 userId 不存在返回明确 401
  - 验证: `lobby.service.test.ts` 覆盖写 `games` / `game_players` 前的校验
- [x] 实现最小修复
  - 验证: guard 验签后查用户，lobby 写用户外键前校验用户存在
- [x] 运行定向验证
  - 验证: auth guard / lobby service 测试通过，必要时 server typecheck 通过
- [x] 记录 review
  - 验证: 本段末尾补充实际改动、命令结果和残余风险

Review:
- Root cause：`JwtAuthGuard` 之前只验 JWT 签名，不确认 `sub` 对应用户仍存在；`LobbyService.createRoom` 随后直接写 `games.hostUserId`，孤儿用户 ID 触发数据库外键错误并冒成 500。
- Auth 修复：`JwtAuthGuard` 现在验签后调用 `AuthService.getProfile(payload.sub)`，孤儿 JWT 会在进入 controller 前返回 401；无 token / 无效 token 仍保持原有 401。
- Lobby 修复：`createRoom` 和 `joinRoom` 在写 `games.hostUserId` / `game_players.userId` 前调用 `ensureUserExists`，即使 service 被绕过 guard 直接调用，也返回 `UnauthorizedException('User not found. Please sign in again.')`，不会让 FK 错误承担业务校验。
- 测试：新增失败优先测试覆盖孤儿 JWT 和 lobby orphan user 写入；红灯分别失败于 200 / resolved room，修复后通过。
- 验证通过：`pnpm --filter @seti/server test -- jwt-auth.guard.integration.test.ts lobby.service.test.ts`（17 tests）、`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/server lint`。
- 残余风险：WebSocket gateway 当前仍只验 JWT 签名，没有同步查 `users`；本次错误来自 HTTP lobby 创建房间，未扩大到 gateway 行为，后续可以单独补同样的身份存在性校验。

## 当前任务：Solo / Rival client UI 完整化

假设与权衡：
- 本轮按用户列出的 client UI 需求补齐 solo rival board、rival card/objective render 和 event log；server 只补 public event 所需的最小字段，不把 rival AI 放到 client。
- Image mode 优先使用已存在或可明确映射的图片资源；若某张 rival action/objective 正面图缺失，必须回退到同一个独立 Rival card text renderer，不能临时用无意义图片伪装。
- Text mode 使用独立 Rival card/objective 组件，不复用普通 SETI card 的 `TextCard` 结构，但奖励/规则图标仍优先复用 `DescRender`。
- progress cycle 以规则里的 12 格 progress track 为准，使用 `progressSlot` 标记当前位置；image mode 小圆填充颜色，text mode 仅边框颜色。
- tech pile 从 public player state 中 synthetic rival 的 `techs` 统计三类 tech 数量，不在 client 推断隐藏状态。

- [x] 写失败测试：Rival board 通用渲染
  - 验证: progress cycle 12 个编号小圆、当前 slot 高亮且 image/text mode 样式不同；tech pile 三类计数可见；rule 按钮打开多语言 dialog
- [x] 写失败测试：Rival card/objective 独立渲染
  - 验证: text mode objective 与 action card 使用 desc/文案渲染；image mode 通过 card id/objective id 查图片，缺图时回退文字卡
- [x] 写失败测试：Rival event log
  - 验证: server 自动 rival turn 产生 public log event，client 展示具体 card id/action 文案，hover/focus 可看到同一个 Rival card render
- [x] 实现 common/server 最小协议补齐
  - 验证: `RivalTurnController` eventLog 包含 card id/action kind；common event type 或 ACTION details 类型覆盖该事件
- [x] 实现 client UI 组件与 i18n
  - 验证: en/zh-CN/pt-BR 至少覆盖新增 key；RivalPanel/EventEntry 组件测试通过
- [x] 运行定向验证与浏览器检查
  - 验证: common/server/client 定向测试、typecheck，必要时启动本地 app 用 Playwright 检查 solo UI
- [x] 完成审计并记录 review
  - 验证: 对照用户每条需求逐项映射到文件/测试/命令结果，缺口不得标记完成

Review:
- Rival board：`RivalPanel` 现在渲染 12 格 progress cycle，image mode 以背景色填充圆点，text mode 仅保留彩色边框；同时新增三类 tech pile 计数、header 规则按钮和多语言规则 dialog。`GameLayout` 从 synthetic rival public player state 传入 `techs`，不在 client 推断隐藏状态。
- Rival card/objective render：新增独立 `RivalActionCardRender` 与 `RivalObjectiveCard`，image mode 通过 id 查 `/assets/seti/solo/action-cards/S.*.jpg` 与 `/assets/seti/solo/objective-cards/SOLO.*.png`；text mode 使用独立文字卡，文案从 common action/objective data 生成并走 en/zh-CN/pt-BR i18n。已从 `frontend-reference` 的 `deckData.automaActions` / `deckData.soloGoals` 同步 19 张 rival action 图和 24 张 objective 图到 client public assets。
- Event log：`RivalTurnController` 在自动 rival action 成功解析后追加 public `ACTION / RIVAL_ACTION` event，details 包含 `cardId`、`actionKind`，species replacement 时包含 `removedCardId`；`EventEntry` 特判该 event，展示具体卡牌和行动文本，并在 hover/focus 区域复用同一个 Rival action card renderer。
- 验证通过：`pnpm --filter @seti/client test -- RivalPanel.test.tsx EventEntry.test.tsx`（13 tests）、`pnpm --filter @seti/server test -- RivalTurnController.test.ts`（40 tests）、`pnpm typecheck`、`pnpm lint`、针对本轮触达文件的 `pnpm exec biome format ...`。
- 真实 UI 验证：隔离端口运行 `PORT=3100 SERVER_URL=http://127.0.0.1:3100 WS_URL=http://127.0.0.1:3100 VITE_API_URL=http://127.0.0.1:3100 VITE_WS_URL=http://127.0.0.1:3100 NINJA_ENV=production ./scripts/run-e2e-local.sh tests/solo-smoke.spec.ts`，1 passed；Browser 手动打开本地 solo game，确认可见 Rival panel、12 个 progress slot、tech pile、3 张 objective 图片均加载为 215x215，规则 dialog 可打开并显示中文文案。
- 验证说明：完整 `pnpm format:check` 会扫描既有 `packages/e2e/playwright-report` 生成物并输出第三方 bundle 格式 diff，本轮未把它作为最终格式门禁；已对本轮触达源码、测试、locale、TODO 文件做定向 Biome format check。

## 当前任务：Solo / Rival 全流程 E2E 验证

假设与权衡：
- 本轮只按 `docs/arch/solo/architecture.md` 的 E2E 矩阵验证 solo 全流程，不用 debug endpoint、localStorage 注入或直接 websocket action。
- 现有 `solo-smoke.spec.ts` 已覆盖 solo room 创建、1 human 启动、Rival panel/objective row、human PASS 后 rival 自动回合；本轮需要补齐 docs 明确列出的 round transition 与 trace/alien discovery E2E 证据。
- 如果完整打到自然 alien discovery 过长，优先使用真实 UI 操作加稳定 room seed；不把 server 单测当作 E2E 替代。

- [x] 对照 `docs/arch/solo` 审计现有 solo E2E 覆盖
  - 验证: 明确列出 create/start/auto-turn、round transition、trace discovery 三条 E2E 要求的覆盖状态
- [x] 补齐 docs 要求的 solo round transition E2E
  - 验证: 真实 UI 中 human PASS 后处理 EOR，rival 自动 pass/回合切换，round 进入下一轮并回到 human 可操作
- [x] 补齐 docs 要求的 solo rival trace / alien discovery E2E
  - 验证: 真实 UI 中观察到 rival 相关 panel/state 变化，并能看到 alien discovery 或 trace contribution 的用户可见结果
- [x] 运行目标 E2E 套件和类型检查
  - 验证: e2e 专用 tsc 与 solo 相关 Playwright specs 通过
- [x] 做完成审计并记录 review
  - 验证: 本段末尾补充实际命令、覆盖证据和残余风险

Review:
- 覆盖映射：`solo-smoke.spec.ts` 已覆盖真实 UI 创建 solo room、1 human 启动 game、Rival panel/objective row、human PASS 后 rival 自动行动并回到 human 可操作；新增 `solo-full-flow.spec.ts` 覆盖 docs E2E matrix 中的 round transition 与 rival discovery trace contribution。
- 新增 E2E：`advances through a solo round transition with only one human player` 使用稳定 seed，在真实 UI 中循环 PASS，断言 round stack 从第 0 轮推进到后续轮次且 PASS 重新可用。
- 新增 E2E：`lets the rival contribute a discovery trace through server-side automation` 使用稳定 seed，在真实 UI 中观察 Aliens tab 的 discovery trace slot 出现 `title^="rival:"`，验证 synthetic rival 自动流程对 alien discovery 区域产生用户可见 trace contribution；本用例不声明完整 alien reveal。
- 合规审计：solo specs 静态扫描未发现 debug endpoint、localStorage auth 注入、`WsTestClient` 或直接 WebSocket action 驱动；房间创建仍走 UI flow，seed 只通过现有 `createRoomByUi` request override 稳定配置。
- 验证通过：`node_modules/.pnpm/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit`。
- 验证通过：临时隔离 Postgres 下运行 `NINJA_ENV=production PGHOST=127.0.0.1 PGPORT=55434 PGUSER=$(whoami) PGDATABASE=seti_e2e ./scripts/run-e2e-local.sh tests/solo-smoke.spec.ts tests/solo-full-flow.spec.ts`，3 passed；`NINJA_ENV=production` 仅用于禁用本机 Vite 可执行文件上的 Console Ninja 外部 build hook。

## 当前任务：Solo / Rival 命名统一与继续实现

假设与权衡：
- 本轮先按 `docs/arch/solo/README.md#123-canonical-naming` 审查实现命名；`frontend-reference` 里的 `automa` / `life*` / `fly` / `look` / `comp` / `rover` / `satellite` 只当来源别名，不进入 domain code。
- 优先统一会进入 common/server/client 协议或规则判断的命名；截图、源文档、旧参考说明里的原始别名不改。
- 对已经序列化到旧 snapshot 的字段值做兼容读取，不为了命名统一破坏旧 solo 存档。
- 命名统一后，再从现有 review 残余风险中选一个边界清楚的 solo 规则切片继续实现，避免一次性铺开 species 全量规则。

- [x] Review 当前 solo 命名实现，定位 source alias 与 common/rule 规范不一致的位置
  - 验证: 能列出实际代码中的 alias 命中点，并区分文档/资产名与 domain code
- [x] 写失败测试锁定 canonical naming
  - 验证: common/server 定向测试先失败，证明测试能捕获旧 `automaBoard*` / `lifeIndex` / objective trigger alias
- [x] 统一 common/server/client 中的 solo 命名
  - 验证: public state、serializer/deserializer、rival action data、objective tracker 使用规范命名并兼容旧值
- [x] 继续实现一个缺失的 solo 规则切片
  - 验证: 先写失败测试，再实现并跑通过
- [x] 跑定向验证并补 review
  - 验证: common/server/client 相关测试、typecheck/lint 覆盖本轮改动
- [x] 审计补缺：client Rival panel 渲染公开的 objective row
  - 验证: `RivalPanel.test.tsx` 先失败后通过，能看到 revealed/completed objective 和 task marker 进度
- [x] 扩展 solo smoke 观察 objective row
  - 验证: 真实 UI solo game 中 `rival-objectives` 可见，不通过 debug shortcut
- [x] 复跑补缺验证并更新 review
  - 验证: client 定向测试、e2e tsc、solo smoke、root typecheck/lint 通过

Review:
- 命名审查结论：domain code 中实际遗留的 frontend-reference alias 主要是 `automaBoard*` board id、rival action candidate 的 `lifeIndex`、objective trigger 的 `techfly` / `techlook` / `techcomp` / `lifeblue` / `missionrover` 等字符串；文档、源参考说明和兼容映射中的原始 alias 保留。
- Common: 新增 canonical `TRivalBoardConfigId`、`ERivalObjectiveTrigger`、`TRivalObjectiveTriggerKey`，把 board id 改为 `rival-board-*`，action kind 改为 `launch-probe` / `research-tech` / `scan` / `analyze-data` / `species-replacement-check` 等项目语义名，action data 用 `alienIndex` 取代 `lifeIndex`；species special action cards 已按规则文档使用 printed ID 映射，而不是 frontend-reference Ref ID；Mascamites sample conversion 使用 `collectMascamitesSample` 语义 flag，不沿用 frontend `discardBug` 命名。
- Server: `RivalObjectiveTracker` 改为匹配 canonical objective trigger；`GameDeserializer` 对旧 snapshot 的 `automaBoard*` 做归一化读取；rival tech preference map 改为 `rival-board-*` key。
- 继续实现的规则切片：rival Scan tech 会在 scan/telescope 行动中额外从 card row 标记 1 个 signal 并消耗 1 张 Scan tech；Analyze 会消耗 1 张 Computer tech 获得 3 VP + 1 progress；Probe tech 会在 lander placement 中优先 moon landing 并消耗 1 张 Probe tech；rival probe movement 会在多条可达路径中选择移动 publicity 最高的路径，并把经过路径获得的 publicity 加到 rival 资源；rival probe final conversion 先用 Probe tech 抢 moon，之后按 first-orbit / first-land bonus 唯一可用项选择，只有两者同态时才回到卡面 orbiter/lander priority；`S.15` Mascamites special card 在 Saturn/Jupiter lander placement 后会随机消耗该 planet 的 1 个 sample，跳过 sample reward，并把 sample 转成 Mascamites board 上可标记的蓝色 slot；`S.17` Oumuamua special card 的 probe target 可落地 Oumuamua，结算 Oumuamua lander 的 2 exofossil reward，fallback scan 会标记 Oumuamua tile 而不是普通 sector；`S.16` Anomalies special card 会在 rival 未领先下一个 anomaly trace 时标记对应 column、转换 column reward 并额外获得 3 VP，否则落到 free tech；`S.18` Centaurians special card 会在 rival 没有未解决 message milestone 且总数少于 3 时放置新的 +15 milestone，并继续结算 default scan follow-up；solo rival 触发 Centaurians message milestone 时会自动选择右侧可用 reward，避免给 synthetic rival 生成 client 输入；`S.19` Exertians special card 会在 rival Exertian face-down cards + danger traces 少于 5 时盖放一张随机 Exertian card，否则落到 Earth scan，且 solo rival face-down Exertian card 在终局按 fulfilled 计分。
- E2E: 新增真实 UI `solo-smoke.spec.ts`，通过创建房间弹窗打开 Solo Rival、选择 difficulty，验证 1 个 human 可启动 game、渲染 Rival panel、human 执行 PASS 后 rival 自动行动并更新 action discard/current card；`createRoomByUi` helper 支持通过真实 UI 配置 solo。
- 审计补缺：`RivalPanel` 现在渲染公开的 objective row，包含 revealed objectives、task marker 进度和 completed objective pile；组件测试先失败于缺少 `rival-objectives`，再通过。`solo-smoke.spec.ts` 增加真实 UI objective row 断言，并把 rival 自动行动断言改为观察 Rival panel 状态变化，避免 round reset 时 discard 从非零归零导致误判。
- 验证通过：`pnpm --filter @ender-seti/common test -- rivalActionCards.test.ts`、`pnpm --filter @seti/server test -- GameDeserializer.test.ts GameSerializer.test.ts GameSetup.test.ts RivalObjectiveTracker.test.ts RivalTurnController.test.ts FinalScoring.test.ts`、`pnpm --filter @seti/client test -- CreateRoomDialog.test.tsx RoomCard.test.tsx GameSettingsPanel.test.tsx RivalPanel.test.tsx GameLayout.test.tsx`、`pnpm typecheck`、`pnpm lint`；最新补跑 common 数据测试 3 tests、server 定向套件 123 tests、client 定向套件 35 tests 通过。
- E2E 验证通过：用临时隔离 Postgres 跑 `PGHOST=127.0.0.1 PGPORT=55432 PGUSER=$(whoami) PGDATABASE=seti_e2e ./scripts/run-e2e-local.sh tests/solo-smoke.spec.ts`，1 passed，覆盖 solo room start、objective row、human PASS、rival auto turn 和 Rival panel；e2e 专用 `node_modules/.pnpm/node_modules/.bin/tsc -p packages/e2e/tsconfig.json --noEmit` 已通过。

## 当前任务：实现 Solo / Rival server 和 client 功能

假设与权衡：
- 按 `docs/arch/solo/README.md` 与 `docs/arch/solo/architecture.md` 实现，不另起 `SoloGame`；solo 是 2-seat rules game：1 个 human + 1 个 synthetic rival。
- 本轮先交付可运行的 solo 闭环：创建 solo 房间、1 人开局、server 初始化 rival 状态、序列化/投影、client 配置与只读 rival 面板、基础 rival action deck 自动回合。
- Rival 行为先覆盖 rule/design 明确且可稳定复用现有引擎的基础动作：action card reveal、first possible candidate、pass、progress/resource conversion、launch、paid/free tech、analyze/computer、telescope signal、probe placement 的最小可执行路径。
- Objectives 与 alien special card 先以 typed config / state / projection 建模并接入 setup；若发现完整结算需要大规模规则补齐，分独立 TDD 切片实现，不在 client 复制 AI。
- icon 渲染优先复用 `@seti/cards` 的 `DescRender` / `EffectFactory`；`progress` 等 common/card 缺失图标才使用已迁移到 `packages/client/public/assets/seti/icons` 的 frontend-reference 资产。

- [x] 写失败测试：GameOptions / lobby 支持 solo 选项、1 人开局、禁止第 2 个 human 加入
  - 验证: server lobby 单测先失败，再通过
- [x] 写失败测试：Game.create solo 会生成/接受 synthetic rival，并初始化 rival state，不给 rival 正常手牌/资源/setup tuck
  - 验证: server engine solo setup 单测覆盖 public state、progress、deck、computer
- [x] 写失败测试：serializer/deserializer/projectGameState 保留 optional rival state，旧多人 snapshot 兼容
  - 验证: persistence 单测覆盖 round-trip 和缺省字段
- [x] 实现基础 rival action resolver 与 GameManager 自动 rival 回合
  - 验证: server solo action 单测覆盖 reveal first candidate、empty deck pass、launch/tech/progress/analyze 至少一条闭环
- [x] 实现 client solo 创建/房间展示/只读 rival 面板
  - 验证: client 组件测试覆盖 toggle、difficulty、required human count、rival icon 渲染
- [x] 补齐 rival action card 数据，替换 advanced/species 占位序列
  - 验证: common 数据测试对齐 `docs/arch/solo/frontend-reference-data.md` 的 basic/advanced/species 表
- [x] 修正 solo 终局胜负规则：human 必须严格高于 rival，tie 归 rival
  - 验证: server final scoring 单测覆盖 solo tie
- [x] 实现 event-backed objective tracker：human end turn 时检查静态条件与本回合 trigger event，并补齐 revealed row
  - 验证: server 单测覆盖 16 VP / data pool / publicity、tech/trace/probe/planet/mission/sector dominance trigger、单次 event 只标记一个 task
- [x] 补齐 rival tech 与 analyze 关键规则：按 board priority 选 tech、转换 tech bonus、analyze 放置 blue life trace
  - 验证: server solo action 单测覆盖 preferred tech、first-take fallback、tech bonus 转换/忽略、blue trace placement
- [x] 补齐 rival telescope 基础规则：default 结算 2 个 card-row signal + 1 个 Earth signal，Earth mode 结算 1 个 card-row signal + 2 个 Earth signal，同色 sector 按 rival priority 选择
  - 验证: common 数据测试覆盖 telescope mode；server solo action 单测覆盖 card-row 右侧批量选择、Earth mode 计数、能赢 sector 优先
- [x] 补齐 solo 随机起始玩家与开局 rival 自动行动 guard
  - 验证: server setup / GameManager 单测覆盖随机先手、先手分数、注册时 rival active 自动推进、setup input 未完成时不提前自动推进
- [x] 跑最终验证并补 review
  - 验证: 定向 server/client 测试、`pnpm typecheck`、必要 lint 通过

Review:
- Server: `GameOptions` / lobby 支持 solo 选项、1 人开局和 synthetic rival；`GameSetup` 初始化 rival player 与 `RivalState`；serializer/deserializer/projection 保留 optional solo/rival state 并兼容旧多人 snapshot。
- Server: 新增 `engine/solo/*`，覆盖 rival action deck reveal、first possible candidate、pass、round reset、between-round objective payment、end-game objective VP、progress/resource/data conversion、launch、paid/free tech、按 board priority research tech、tech bonus 转换、analyze blue trace、telescope default/Earth mode 计数、card-row arrow selection、同色 sector priority、基础 probe/orbit/land；`GameManager` 在 human 行动后和注册 checkpoint 后按 guard 自动推进 rival turn。
- Server: `RivalObjectiveTracker` 已接入 mission turn events，覆盖静态目标、tech/trace/probe/comet/card cost/mission completion/planet mission/sector dominance trigger，并保持 single event 只标记第一个匹配的未完成 task。
- Common: 新增 typed solo config/protocol 和 `rivalActionCards`，已把 basic/advanced/species action card 数据替换为显式表驱动定义，并用 common 数据测试对齐 `frontend-reference-data.md`。
- Client: solo 创建/房间展示/设置面板/房间人数判断已接入；游戏布局在 solo state 下渲染只读 `RivalPanel`，奖励/icon 优先走 `DescRender`，缺失 progress icon 使用迁移资产。
- Final scoring: solo rival 不计 gold tile；human 必须严格高于 rival 才赢，tie 归 rival。
- 验证通过：`pnpm --filter @ender-seti/common lint`、`pnpm --filter @seti/server lint`、`pnpm typecheck`、`pnpm --filter @ender-seti/common test -- rivalActionCards.test.ts`、`pnpm --filter @seti/server test -- GameOptions.test.ts lobby.service.test.ts GameSetup.test.ts GameSerializer.test.ts GameDeserializer.test.ts RivalObjectiveTracker.test.ts RivalTurnController.test.ts GameManager.test.ts FinalScoring.test.ts MissionTracker.test.ts Movement.test.ts ResolveSectorCompletion.test.ts`、`pnpm --filter @seti/client test -- RivalPanel.test.tsx GameLayout.test.tsx`。
- 残余规则风险：rival automated input 的更多边界；solo smoke 已通过真实浏览器路径验证。

## 当前任务：Solo / Rival 整体架构设计

假设与权衡：
- 本次只做架构设计文档，不直接改 common/server/client 实现代码。
- 设计落点放在 `docs/arch/solo/architecture.md`，与既有 `docs/arch/solo/README.md` 规则说明和 `frontend-reference-data.md` 数据抽取互相引用。
- 目标是用 `isSoloMode` 作为房间/游戏选项 flag，把 Rival 作为 server 内部非人类 actor 接进现有多人 `Game` 回合、棋盘、得分、序列化和投影链路；不新建平行的 `SoloGame` 引擎。
- 若规则需要自动选择，本设计优先把自动策略封装在 Rival resolver/service，而不是让 client 或 gateway 猜测规则。

- [x] 复核 solo 规则、前端参考数据和现有多人架构入口
  - 验证: 设计能引用 setup、turn loop、action pipeline、player state、serialization、projection、lobby/client settings 的实际落点
- [x] 形成 common/server/client/persistence 的模块拆分方案
  - 验证: 可复用多人规则的位置明确，solo 特有状态不会污染普通多人协议
- [x] 明确 Rival 行动解析、回合交接、自动输入和特殊 alien/objective 扩展策略
  - 验证: 每类 solo action 都有归属模块和可测试的解析边界
- [x] 补兼容性、扩展性、迁移步骤和测试矩阵
  - 验证: 设计覆盖旧房间、普通多人、存档反序列化、UI 只读投影和未来 difficulty/species 扩展
- [x] 记录 review
  - 验证: 本段末尾补充实际输出和残余风险

Review:
- 新增 `docs/arch/solo/architecture.md`，确定 solo 以 `isSoloMode` 开启，但运行时仍作为 2-seat rules game：一个 human `Player` 加一个 synthetic rival `Player`，solo 专属进度、action deck、objective、computer 等放入 `Game.rivalState`。
- 设计明确 common/server/client/persistence 分工：common 放 typed solo config/protocol，server 放 `engine/solo/*` resolver/controller/tracker，client 只做房间配置和只读渲染，不复制 rival AI。
- 复用策略已按现有代码入口拆分：`Game` phase、`Player` identity、`Deck<T>`、`SolarSystem`、`PlanetaryBoard`、`Sector`、`TechBoard`、`AlienState`、`MilestoneState`、`FinalScoring`、serializer/projection 都列出复用或包装边界。
- 兼容性方案：`playerCount` 保持 rules seat count，solo 内部为 2；lobby/client 用 required human players 判断 1 人开局；`rivalState` DTO 为 optional，旧多人 snapshot 缺失该字段时按多人加载。
- 验证：已检查文档存在且非空，关键章节和关键术语覆盖通过；`pnpm exec biome check docs/arch/solo/architecture.md docs/TODO.md` 未处理文件，因为当前 Biome 配置忽略 docs Markdown，故本次不以 Biome 作为文档验证。

## 当前任务：整理 Solo / Rival 规则文档

假设与权衡：
- 本次只根据 `docs/references/SE_rulebook_EN_36_web.raw.md` 和 `docs/references/Rival_Reminders.pdf` 生成规则说明，不修改游戏实现。
- 输出放在 `docs/arch/solo/`，优先写成可供实现和测试引用的 Markdown 文档。
- 若两份资料存在冲突、PDF 图示文字无法可靠提取，或 solo 卡/图标含义无法从资料中确认，先询问用户，不做猜测性规则。

- [x] 提取 rulebook 中 solo/rival 相关章节
  - 验证: 能定位 setup、rival board/deck、rival turn、actions、objectives、endgame 等完整段落
- [x] 提取 `Rival_Reminders.pdf` 中的提醒/流程
  - 验证: 文本或截图能覆盖 PDF 页内所有可读规则点
- [x] 对照两份资料，整理成 `docs/arch/solo/` 下的清晰规则文档
  - 验证: 文档按 setup、状态模型、回合流程、行动解析、特殊规则、结算/胜负组织
- [x] 复核规则疑点并记录来源
  - 验证: 无法确认的点列入问题；确认的点在 review 中说明来源
- [x] 根据用户确认修订待确认规则点
  - 验证: passing、action card 数据、alien special、progress/tech config、round reset 都进入确认决策
- [x] 从 `frontend-reference` 与 alien notes 补齐实现数据
  - 验证: `docs/arch/solo/frontend-reference-data.md` 覆盖 action sequences、board config、species FAQ constraints
- [x] 补充 `frontend-reference` 使用边界与规范命名规则
  - 验证: 规则明确 server/client/common 分工，且 source alias 到 common enum/domain name 有映射
- [x] 记录结果
  - 验证: 在本段末尾补充 Review

Review:
- 新增 `docs/arch/solo/README.md`，按 setup、rival state、资源转换、tech、回合流程、行动解析、species replacement、passing、objectives、milestones、endgame 和 implementation checklist 整理 solo/rival 规则。
- 新增 `docs/arch/solo/frontend-reference-data.md`，从 `frontend-reference` 抽取 rival action card 候选序列、species replacement map、difficulty setup、progress 起点、preferred-tech order、computer slot reward，并补充 `docs/arch/aliens/*` / FAQ 的 species special 约束；`automaBoard2-4.jpg` 使用 `components.js` 引用的同源 storage 路径临时拉取并核对。
- 使用 `pypdf` / `PyMuPDF` 临时虚拟环境抽取并渲染 `Rival_Reminders.pdf`，同时渲染 rulebook 第 22-27 页截图核对 raw markdown 中缺失的图示信息。
- 已将 `Rival_Reminders.pdf` 补充的优先级规则合入：tech 选择、1 probe in play、orbiter/lander 空位/占位优先级、life trace、telescope、computer 立即填充、gold tile 不计分、passing、objective 结算。
- 已根据用户确认修订：passing 移除 EOR 栈顶；used/revealed rival action cards 在回合切换时洗回；action card 数据来自 `frontend-reference`；特殊 alien card 结合 existing alien notes / FAQ；progress track 起点和 preferred-tech mapping 以 board asset/config 数据为准。
- 已补充架构规则：`frontend-reference` 仅作为行为参考，server 负责 rival 结算，client 只渲染公共状态，shared config/type 优先放入 `packages/common`；同时列出 `automa`、`pop`、`fly/look/comp`、`rover/satellite`、`life*`、deck tier 等 source alias 的规范命名映射。
- 本次只改文档，不改游戏实现；验证方式为源文档抽取、截图核对和文档复读。

## 当前任务：修复 Biome / lint / tsc 验证链

假设与权衡：
- 当前 `pnpm typecheck` 已通过；`@seti/e2e` 没有 root typecheck 脚本，需要单独用 `tsc -p packages/e2e/tsconfig.json --noEmit` 验证。
- `pnpm lint` 的失败集中在 Biome import/export 排序、格式化和一个 `noNonNullAssertion` warning；先做 Biome 建议的最小修复，不扩大重构。
- `pnpm format:check` 把 `backend-reference` 参考目录扫入 Biome，触发旧语法/JSONC 解析错误；优先把明显非项目源码的 reference 目录排除，而不是改参考代码。
- 只修改能直接解释为“让 lint/format/typecheck 通过”的行；已有大量未提交改动保持原样，不回滚。

- [x] 建立失败基线
  - 验证: `pnpm lint` 失败于 `packages/common/src/index.ts` export 排序；分包 lint 还暴露 client/server Biome 格式和 import 排序问题
- [x] 建立类型检查基线
  - 验证: `pnpm typecheck` 通过；`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit` 通过
- [x] 收窄 root Biome format 扫描范围
  - 验证: `pnpm format:check` 不再进入 `backend-reference` 参考目录
- [x] 修复 Biome 排序、格式化和 lint warning
  - 验证: common/client/server 分包 lint 通过
- [x] 跑最终验证
  - 验证: `pnpm lint`、`pnpm typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm format:check` 全部通过
- [x] 记录 review
  - 验证: 在本段末尾补充实际改动和残余风险

Review:
- `biome.json` 为 formatter 单独限定可格式化的项目源码/配置路径，避免 `biome format .` 扫描 `backend-reference`、截图、本地 agent 状态等非项目源码；`format:check` 当前检查 1253 个文件。
- 修复 common export 排序、client/server 已有改动中的 Biome 格式问题，并把 server probe movement 的 `solarSystem!` 改成显式初始化 guard。
- 执行 `pnpm format` 后，项目内已有未格式化测试文件被 Biome 机械格式化；未修改 reference 目录内容。
- 验证通过：`pnpm lint`、`pnpm typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm format:check`。
- 残余风险：root `pnpm typecheck` 仍不包含 `@seti/e2e` 包，后续如果希望纳入统一链路，需要给 `packages/e2e/package.json` 增加 typecheck 脚本并接入 turbo。

## 当前任务：修正 Anomalies token 与 alien board trace 渲染

假设与权衡：
- `solarSystem.alienTokens[].rewards` 已经包含奖励数据；本次只修 client 渲染，不改协议和规则结算。
- 规则奖励图标必须走 `DescRender` / `EffectFactory` 链路，不能用颜色块、alien 图片或手写临时图形替代。
- Alien board trace 的视觉顺序和槽形状属于 UI 语义问题，优先用组件测试锁定，再用目标 E2E 截图复查。
- Hand 中出现多张 Anomalies card 需要先解释来源；只有确认不是规则/测试副作用后才改实现。

- [x] 先写失败测试：solar anomaly token 必须是 rounded-full pill，左右显示 trace 色，中间通过 desc reward 渲染 `credit-1` / `energy-1`
  - 验证: `SolarSystemView` 单测能防止退回方形图片、纯色点或非 desc 渲染
- [x] 先写失败测试：alien board trace slot 使用 trace 同色圆形 border，奖励并排显示，且不显示 index
  - 验证: `AlienBoardView` 单测覆盖固定 slot、无限 slot 和 draw alien card 专用 token
- [x] 先写失败测试：board trace 顺序为低 index 在最底部
  - 验证: trace column / anomaly reward ladder 使用反向纵向布局
- [x] 实现最小 UI 修复
  - 验证: 只改 board 组件、cards export 和必要测试 mock
- [x] 跑组件测试、typecheck、目标 E2E 并核对截图
  - 验证: `AlienBoardView` / `SolarSystemView` 相关测试通过，目标 E2E 通过并能说明截图含义
- [x] 记录结果与 hand anomaly card 数量原因
  - 验证: TODO Review 写明 ET.16 抽牌导致 hand 中多张 anomaly card 的来源

Review:
- `SolarSystemView` 的 anomaly token 已改为 `rounded-full` pill：左右两侧是 trace 颜色，中间用 `DescRender` 渲染 `{credit-1}` 等 reward desc。
- `AlienBoardView` 的 trace reward 容器统一为 trace 同色 border：固定槽保持圆形，`maxOccupants === -1` 的不限数量槽改为纵向长条 `rounded-full`。
- Anomalies board reward ladder 删除可见 index，使用 `flex-col-reverse` 保证低 index 在最底部；普通 trace column 同样反向纵向排列。
- draw alien card reward 继续由 common presentation 产出 `{draw-alien-card-1}`，client 通过 `DescRender` 渲染，避免退回普通 draw card 图标。
- Hand 中出现多张 Anomalies card 的来源是 E2E 在 reveal 后按规则打出 `ET.16`：先打出 1 张，再从 Anomalies face-up/deck 抽 3 张，手牌净增 2，属于本次 card 结算断言的一部分。
- 验证通过：`pnpm --filter @seti/client test -- AlienBoardView.test.tsx SolarSystemView.test.tsx`（实际运行 client 全量 53 files / 176 tests）、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`。
- 使用 @浏览器 打开 `http://localhost:5173/debug/replay` 复核并截图，输出：`browser-anomalies-vertical-trace-collapsed.png`。

## 当前任务：Anomaly token reward icon 修正

假设与权衡：
- Server 已经通过 `solarSystem.alienTokens[].rewards` 下发 anomaly token 奖励，问题在 client Board marker 的视觉语义，不需要改 common/server 协议。
- Anomaly token 在 solar board 上代表奖励，不代表 alien 身份；渲染必须优先走现有 reward/desc icon 路径（`EffectFactory`），trace color 只作为辅助状态。
- 只修 solar-system alien token marker 和对应组件测试；E2E 继续用现有真实流程截图验证。

- [x] 先写失败测试：solar-system anomaly token 必须渲染 `token.rewards` 对应的 reward icon
  - 验证: `SolarSystemView` 单测在渲染 alien 头像时失败，缺少 `trace-reward-icon-credit-1`
- [x] 实现最小 UI 修复
  - 验证: token 内出现 reward icon，trace 颜色仅作为角标/描边
- [x] 重新跑组件测试、typecheck、目标 E2E 并确认截图
  - 验证: 单测/typecheck/E2E 通过，Board tab token 截图能看到类似 desc 的 reward icon

Review:
- `SolarSystemView` 的 solar alien token marker 已从 alien 头像改为 `token.rewards` -> `toTraceRewardPresentations` -> `EffectFactory`，颜色仅保留为 trace 辅助角标和描边。
- `SolarSystemView` 单测新增断言：Anomalies token 内必须有 `trace-reward-icon-credit-1`，防止退回头像、字母或纯色点。
- 已验证组件测试：`pnpm --filter @seti/client test -- SolarSystemView.test.tsx` 通过（实际运行 client 全量 53 files / 176 tests）。
- 重新生成 `05-anomaly-tokens-board-p1.png`，确认 Board tab 上的 anomaly token 显示类似 desc 的 reward icon，而不是 alien 头像。

## 当前任务：补齐 main action 与 alien 关键流程 E2E

假设与权衡：
- 现有 `packages/e2e/tests/main-action-*.spec.ts` 已经分别覆盖了 `PLAY_CARD`、`RESEARCH_TECH`、`ORBIT`、`LAND`、`ANALYZE_DATA`，本任务不重复堆同类断言，优先补“真实用户流里没有闭环证明”的部分。
- `debug-replay` / `debug-snapshot` 已覆盖部分 alien 规则，但按 E2E 约束不能把 debug endpoint、localStorage 注入或直接 WS 驱动算作生产路径覆盖。
- 若自然走完整游戏路径过长，允许使用稳定 seed/现有 UI 房间配置来降低随机性；不新增 debug-only 测试入口。

- [x] 复核现有 E2E 覆盖和可复用 helper
  - 验证: 列出每个 main action/free action 已覆盖 spec，确认新增测试只补缺口
- [x] 先写失败测试：真实 UI 完成 mark trace 后在 Aliens tab 可观察到 trace slot 占用
  - 验证: 定向运行新增/修改 spec，先失败在缺少断言或缺少可定位 UI 状态处
- [x] 先写失败测试：真实 UI 填满 alien discovery 三色槽并在 end turn 后 reveal alien board
  - 验证: `alien-*-hidden-board` 消失，具体 alien board/deck/规则区出现，双方页面同步
- [x] 先写失败测试：发现后的 alien 专属规则至少覆盖一个可交互规则路径
  - 验证: 通过可见 UI 操作触发规则结果，例如 Anomalies token/column、Mascamites sample、Oumuamua trace column 中最短可稳定的一条
- [x] 补最小实现或 helper
  - 验证: 不使用 `/debug/*`、不注入 auth、不中途直接发 WS action；只加必要 selector/testid/helper
- [x] 跑定向 E2E 与相关单测
  - 验证: `./scripts/run-e2e-local.sh <target spec>` 通过；如改了 client/server helper，再跑对应单测或 typecheck
- [x] 补 Anomalies 卡结算断言
  - 验证: 真实 UI reveal 后打出 `ET.16`，玩家 Anomalies hand card 数量按 “打出 1 张、抽 3 张” 净增 2
- [x] 补 mark trace 奖励结算断言
  - 验证: 真实 UI 选择 discovery trace slot 后玩家 publicity 增加 slot reward，证明 mark trace 结算执行

Review:
- 新增 `packages/e2e/tests/alien-discovery-real-flow.spec.ts`，用真实 UI 完成注册、建房、加入、开局、launch probe、play card、mark red/yellow traces、pass/end-of-round、play/data corner、填电脑槽、analyze data、mark blue trace、Anomalies reveal。
- 新测试不使用 `/debug/*`、localStorage auth 注入或直接 WS action；只通过 UI 操作和房间创建请求中的稳定 seed 降低随机性。
- 为 alien trace occupant 增加稳定 `data-testid`，使 E2E 能观察到 trace slot 被玩家占用；同时在测试 helper 内处理放数据触发的真实 tuck-for-income 选牌提示。
- 真实 UI trace placement 现在额外断言 discovery slot reward 已结算：每次选择 discovery trace slot 后玩家 publicity 增加 1。
- 真实 UI reveal 后额外打出 Anomalies `ET.16`，断言 Anomalies hand cards 按 “打出 1 张、抽 3 张” 净增 2，覆盖 alien card 结算。
- 新增 8 个通过态截图附件：红 trace、黄 trace、电脑填满、蓝 trace、Board tab anomaly tokens、P1 Anomalies reveal、P2 Anomalies reveal、P1 Anomalies card settled。
- 验证通过：`./scripts/run-e2e-local.sh tests/alien-discovery-real-flow.spec.ts`、`pnpm --filter @seti/client typecheck`、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`./scripts/run-e2e-local.sh tests/main-action-play-card.spec.ts tests/main-action-research-tech.spec.ts tests/main-action-orbit-land.spec.ts tests/main-action-analyze-data.spec.ts tests/alien-discovery-real-flow.spec.ts`。

## 当前任务：Sector image mode 数据对齐复核

- [x] 检查 server/common 的 sector tile 定义与运行时 setup 回显
  - 验证: 4 个 sector tile 分别为 `procyon/vega`, `sirius-a/barnards-star`, `kepler-22/proxima-centauri`, `61-virginis/beta-pictoris`
- [x] 确认 text mode 按 server 回显的 sectorId/name 顺序渲染
  - 验证: 浏览器或组件测试中 8 个 sector 名称与 tile pairing 一致
- [x] 复现并定位 image mode 两个 sector 拼图内的数据槽/热点是否串位
  - 验证: 浏览器截图或失败单测能指出哪一个 tile/sector 的数据不一致
- [x] 未确认数据串位 bug，跳过业务代码修复
  - 验证: 不写猜测性失败测试/修复，保留现有最小影响面
- [x] 用相关单测和浏览器 image/text mode 复查
  - 验证: `SectorView`/相关 board 测试通过，浏览器可见结果与 server 回显一致

Review:
- Server/common canonical tile data matches the expected pairs: sector tile 1 `procyon/vega`, tile 2 `sirius-a/barnards-star`, tile 3 `kepler-22/proxima-centauri`, tile 4 `61-virginis/beta-pictoris`.
- `/debug/server` public state echoes `solarSystemSetup.tilePlacements` and `sectors` consistently; browser text mode matched the same server state names, colors, and data capacities.
- Browser image mode kept the paired tile images together and rendered per-half data counts matching server state, e.g. tile 2 rendered `6/5` data slots for `sirius-a/barnards-star`. No production bug was confirmed in this pass, so no business code was changed.
- Residual risk: image-mode data dots/hotspots still use shared local offsets per tile half rather than per-asset calibrated coordinates; this is a visual alignment risk, not a reproduced server/client data mismatch.

## 当前任务：Game UI 审查与修复

- [x] 复现并截图定位非 text mode 下 sector data 未落到对应 data slot 的问题
- [x] 定位并移除 sector 上非预期的 `11/11` 等调试/计数文字
- [x] 修复 mark signal 后 solar system 出现玩家颜色小点的问题
- [x] 审查同一屏可见的其他 board UI 异常，只修和本次问题同源或低风险的项
- [x] 补充或更新最小测试，先确认失败再实现修复
- [x] 用浏览器截图复查，并跑相关测试

Review:
- 截图确认 image mode 中 `9/9`、`11/11`、`5/5` 等生成计数已移除；mark signal 后 sector slot 保留空位但不再渲染玩家色 marker。
- 发现 debug toolbar 会覆盖输入区，属于 `/debug/game` 调试壳层问题，未纳入本次 board overlay 修复范围。

## 高优先级

- [x] 重构 alien board / Anomalies 的状态模型与 UI 协议
  - 文件：`packages/common/src/types/protocol/gameState.ts`, `packages/server/src/engine/alien/AlienBoard.ts`, `packages/server/src/engine/alien/AlienState.ts`, `packages/server/src/persistence/serializer/GameSerializer.ts`, `packages/client/src/features/board/AlienBoardView.tsx`
  - 当前仍用通用 `slots` 承载 discovery zone、overflow、alien 专属 board slot、anomaly column、anomaly token 等不同概念，容易出现 hidden board 泄漏、UI 错误渲染和规则语义混淆。需要拆分公共协议和服务端内部数据结构：未 discovery 时只公开 3 个 discovery zone + 不限数量 overflow，hidden board 不暴露任何内容；reveal 后按 alien 类型展示独立注册的 board 组件。
  - Anomalies 需要专门建模为 3 列 trace board（red/yellow/blue 各一列）、独立 anomaly token 区域、alien deck / discard / face-up card 区域，并补齐 alien card 分发结算的集成测试和 debug replay 截图验证。

- [x] 收紧 debug 接口与模块的访问边界
  - 文件：`packages/server/src/debug/debug.controller.ts`, `packages/server/src/app.module.ts`
  - 当前 `/debug/server/session`, `/debug/server/replay-session`, `/debug/server/snapshot-session` 等接口仍是 `@Public()`，且 `DebugModule` 默认加载；需要限制在 dev/test、加认证/内部 guard，或显式 feature flag，避免公开环境可创建和操作调试游戏。

- [x] 修复 `Game.processInput` 异常路径的 mission checkpoint 泄漏
  - 文件：`packages/server/src/engine/Game.ts`
  - `processInput` 在 `waitingFor.process()` / `runResolutionPipeline()` 抛错时不会调用 `missionTracker.endCheckpoint()`；需要对齐 `processMainAction` 的 try/catch 清理逻辑，并补异常路径单测。

## 中优先级

- [x] 补齐 debug snapshot replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-snapshot-replay.spec.ts`
  - 覆盖无效 `gameId` 错误提示、指定 `version` 加载、snapshot HUD 元数据、加载后的交互操作（end turn / main action）。

- [x] 补齐 debug replay E2E 覆盖
  - 文件：`packages/e2e/tests/debug-replay.spec.ts`
  - 覆盖切换 preset 后字段更新、`New Replay` 返回表单。

- [x] 增加 Oumuamua debug replay preset
  - 文件：`packages/server/src/debug/debugReplayPresets.ts`
  - 覆盖 tile signal、exofossil、trace columns 等 Oumuamua 专属调试场景。

- [x] 补齐 Oumuamua 剩余集成断言
  - 文件：`packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/BehaviorExecutor.test.ts`
  - 覆盖选择 `oumuamua-sector` 时走普通 sector signal 结算；覆盖 `desc.et-23` / ET.23 的 Oumuamua 专属 icon 集成路径。

- [x] 清理或实现剩余 alien card 注册 TODO
  - 文件：`packages/server/src/engine/cards/register/registerAlienCards.ts`, `packages/server/src/engine/cards/register/registerSpaceAgencyAliens.ts`
  - 复核 `UNHANDLED_EFFECT(...)` 注释是否仍代表未实现效果；已实现的删除注释，未实现的补齐行为和测试。

- [x] 补齐 Client 端资源兑换弹窗测试
  - 文件：`packages/client/src/pages/game/GameLayout.tsx`, `packages/client/__tests__/pages/game/GameLayout.test.tsx`
  - 覆盖信用/能量/卡牌资源不足时按钮禁用，以及点击可用选项时发送正确的 `EFreeAction.EXCHANGE_RESOURCES` payload。

## 低优先级

- [x] 校验 Client 端 snapshot version 输入
  - 文件：`packages/client/src/pages/game/DebugReplayPage.tsx`
  - 拦截负数、小数、0、`NaN` 等无效值，并给出友好的错误提示。

- [x] 统一 `/debug/alien` 和 `/debug/replay` 路由策略
  - 文件：`packages/client/src/routes.tsx`
  - 选择保留单一路由，或让 `/debug/alien` 带默认 preset 行为，避免 E2E 混用入口。

- [x] 扩展 `IDebugReplayFieldDefinition.kind`
  - 文件：`packages/common/src/types/protocol/debug.ts`
  - 从仅支持 `'select'` 扩展为 union type，便于后续支持 text/number/player/card 等字段类型。

- [x] 清理任务链相关测试脆弱点
  - 文件：`packages/server/__tests__/engine/missions/MissionTracker.test.ts`, `packages/server/__tests__/engine/actions/Scan.test.ts`, `packages/server/__tests__/engine/cards/base/ObservationQuickMissionCard.test.ts`
  - 避免从 option id 末尾切分 branch index；替换 monkey-patch `missionTracker.recordEvent` 的断言方式；让 Observation fallback 测试名称和实际断言一致，或恢复真实 card fallback 集成断言。

- [x] 重审全局 401 拦截策略
  - 文件：`packages/client/src/api/httpClient.ts`
  - 当前非登录/注册请求遇到任意 401 都会 logout 并跳转 `/auth`；需要区分 token 失效和业务级 unauthorized，避免非认证场景误踢用户。

## 当前修正：Anomalies trace 布局

- [x] 修正 Anomalies board 外层 red/yellow/blue trace 始终横向排列
- [x] 保持单条 trace 内部 reward slot 纵向排列
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：Anomalies trace 紧凑与 icon 可读性

- [x] 放大 Anomalies reward 内的 desc icon
- [x] 压缩单条 trace 的 padding 和 reward slot 宽度
- [x] 提前 alien board 双列布局断点，尽量在窄视口放下两个 board
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：未发现 alien board 占位

- [x] 将未发现 alien 的 board 区改为纯黑占位背景
- [x] 删除未发现 board 内的伪 red/yellow/blue trace 列
- [x] 保留 Discovery/Overflow 区
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

## 当前修正：hidden board 高度对齐

- [x] 将未发现 hidden board 的占位高度对齐已展示 board
- [x] 跑相关单测
- [x] 用 in-app browser 截图确认

Review:
- Hidden board 仍然是纯黑未知占位，不渲染伪 red/yellow/blue trace 列。
- 占位最小高度调整为 `360px`，浏览器截图确认右侧未知 board 和左侧 Anomalies board 底部对齐。

## 当前任务：E2E 实现结构与覆盖 review

假设与权衡：
- 本次只做 review，不修改 e2e 测试实现。
- 重点检查 `packages/e2e` 的测试结构、helper 分层、覆盖有效性和冗余度；必要时参考 Stage 9-4 E2E 任务标准与项目 lessons。
- Debug replay/snapshot 用例可以作为调试覆盖，但不能替代真实生产路径 E2E。

- [x] 盘点 e2e spec、helper、Playwright 配置和运行入口
  - 验证: 能归类真实 UI 流、API/WS/debug 辅助流、主动作/free action/房间/auth 覆盖
- [x] 识别结构混乱、重复 setup、职责边界不清的具体文件和行号
  - 验证: 每条问题能指向具体代码位置，并说明维护风险
- [x] 判断覆盖是否充分但不冗余
  - 验证: 明确哪些测试应保留为核心闭环，哪些应合并/降级/改名
- [x] 运行低成本验证
  - 验证: 至少执行 e2e TypeScript 编译或说明无法执行原因
- [x] 输出 review 报告
  - 验证: `docs/review/e2e-2026-05-07.md` 包含 severity 汇总、Top findings 和整改建议

Review:
- 已生成 `docs/review/e2e-2026-05-07.md`。结论：当前 E2E 对主动作、free action、多玩家回合和 Anomalies 真实发现闭环覆盖较强，但 suite 分层不清，多个 smoke/journey 用例重复覆盖 `register -> room -> game -> PASS`。
- 主要问题：`auth.spec.ts` API 测试共享 `uniqueEmail` 导致用例顺序依赖；Stage 9-4 的 responsive 和 reconnect 覆盖缺失；seed/scenario 房间创建 helper 在多个 spec 中通过 route body rewrite 重复实现。
- 低成本验证通过：`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`，`pnpm --filter @seti/e2e exec playwright test --list --project=chromium` 列出 54 tests / 31 files。

## 当前任务：优化 E2E review findings

假设与权衡：
- 本次只优化 review 中 4 个 finding，不扩大到业务规则或 UI 外观修复。
- `browser-smoke.spec.ts` 保留为 canonical smoke；主动作/free action/alien 真实闭环保留，重复的基础 journey 合并或删除。
- 新增 responsive/reconnect 覆盖必须走真实浏览器 UI 和真实 server/client，不使用 debug endpoint、localStorage 注入或 raw WS action 驱动玩法。
- seed 注入属于 deterministic UI setup，需要集中到 helper，测试标题和 helper 参数都显式表达；`scenarioPreset` 被 server 明确作为 public room payload 忽略，不能作为真实 UI E2E 前置条件。

- [x] 修复 auth API 用例顺序依赖
  - 验证: `auth.spec.ts` 中每个 API 测试自建前置用户，单独跑 login/duplicate/auth-me 不依赖前一个测试
- [x] 补 responsive 与 reconnect 覆盖
  - 验证: Playwright 能列出 desktop/tablet/mobile 或对应 spec，且 reconnect 测试通过真实页面恢复状态
- [x] 收敛 seed 房间创建 helper，删除无效 scenario-preset E2E
  - 验证: 重复 `createRoomByUiWithSeed` 删除，统一走 `createRoomByUiWithDetails`；依赖 public `scenarioPreset` 的 E2E 删除
- [x] 去重基础 smoke/journey
  - 验证: 删除或合并重复 `register -> room -> game -> PASS` spec，保留覆盖矩阵不倒退
- [x] 运行验证并更新报告
  - 验证: e2e typecheck、相关定向 Playwright spec 通过，review 文档记录最终调整

Review:
- `auth.spec.ts` 已改为每个 API 用例自建前置用户，不再依赖 describe 级共享邮箱和测试执行顺序。
- 新增 `responsive.spec.ts` 覆盖 desktop/tablet/mobile 三个 viewport 的真实 auth/lobby 渲染；新增 `reconnection.spec.ts` 覆盖真实游戏页 reload 后恢复同一 dashboard state。
- `createRoomByUi` / `createRoomByUiWithDetails` 现在集中支持 seed 注入并使用 `try/finally` 清理 route；原本复制的 seed helper 已移除。
- 删除重复基础 journey：`fixed-user-smoke.spec.ts`、`game-debug-session.spec.ts`、`game-flow-behavior.spec.ts`、`game-flow-user-path.spec.ts`。保留 `browser-smoke.spec.ts` 作为 canonical smoke。
- 原依赖 public `scenarioPreset` 的 `free-action-spend-signal-token.spec.ts`、`free-action-deliver-sample.spec.ts` 不再通过 lobby 注入；后续已迁移为 Debug Replay checkpoint setup + 真实 Game UI 点击。
- 验证通过：`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`（52 tests / 27 files）、`./scripts/run-e2e-local.sh tests/auth.spec.ts tests/responsive.spec.ts tests/reconnection.spec.ts`（14 passed）、`./scripts/run-e2e-local.sh tests/main-action-analyze-data.spec.ts`（1 passed）。

## 当前修正：SPEND_SIGNAL_TOKEN / DELIVER_SAMPLE E2E 闭环

假设与权衡：
- `SPEND_SIGNAL_TOKEN` 已经是规则层 free action：只在 scan action pool 中、有 signal token 且 card row 非空时出现；本次不改成 main action 或任务。
- `DELIVER_SAMPLE` 是 Mascamites sample mission 的完成分支，前置链路长；本次不把它误判为普通 move 覆盖，也不重开 public `scenarioPreset`。
- public lobby 继续忽略 `scenarioPreset`；长前置状态改由明确的 Debug Replay checkpoint 准备，E2E 进入 checkpoint 后只通过真实 Game UI 点击动作。

- [x] 复核 common/server/client 对两个 action 的真实实现
  - 验证: 指出 free action gating、server processor、client FreeActionBar/GameLayout 都已存在或补齐缺口
- [x] 为 Debug Replay 增加 free action checkpoint
  - 验证: server 单测先覆盖 `spend-signal-token` 与 `deliver-sample` checkpoint，再让测试通过
- [x] 恢复 UI E2E 闭环
  - 验证: E2E 不再依赖 public `scenarioPreset`，进入 debug replay 后通过真实 UI 点击并断言状态变化
- [x] 更新 review / e2e 文档与 lessons
  - 验证: 文档明确区分 production lobby E2E、debug replay coverage 和 server/client 实现状态
- [x] 跑 targeted 验证
  - 验证: server debug preset 单测、E2E typecheck、两个 free-action E2E 通过

Review:
- 复核结果：`SPEND_SIGNAL_TOKEN` 已在 common `getAvailableFreeActions`、server `SpendSignalTokenFreeAction` / `Game.assertActionAllowed`、client `FreeActionBar` / `GameLayout` 中作为条件 free action 实现；不是新的 main action，也不是缺失实现。
- 复核结果：`DELIVER_SAMPLE` 已在 common sample delivery gating、server `DeliverSampleFreeAction` / Mascamites plugin、client sample delivery option 中实现；它是 Mascamites sample mission 的交付分支，不应由普通 movement E2E 替代。
- 新增 `free-action-debug` Debug Replay preset，包含 `spend-signal-token` 与 `deliver-sample` 两个 checkpoint；public lobby 仍忽略 `scenarioPreset`。
- 恢复 `free-action-spend-signal-token.spec.ts` 与 `free-action-deliver-sample.spec.ts`，入口改为 Debug Replay，进入 checkpoint 后只通过真实 UI 点击 action 并断言状态变化。
- `run-e2e-local.sh` 本地 E2E 启动时显式设置 `SETI_ENABLE_DEBUG_API=true` 和 `VITE_ENABLE_DEBUG_ROUTES=true`，以支持已有 debug replay/snapshot specs；production 默认不变。
- 验证通过：`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/server test -- debugReplayPresets.test.ts`（18 passed）、`pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`（54 tests / 29 files）、`./scripts/run-e2e-local.sh tests/free-action-spend-signal-token.spec.ts tests/free-action-deliver-sample.spec.ts`（2 passed）。

## 当前任务：实现 E2E review 剩余结构优化

假设与权衡：
- `docs/review/e2e-2026-05-07.md` 中 W-01 到 W-04 已在当前工作区实现并记录；本轮不重复修改这些已完成项。
- 本轮聚焦剩余结构项：helper 分层、debug/API shortcut 边界、suite taxonomy、统一 started-game helper、DB prepare 职责、CI headless 入口。
- 不移动大量 spec 目录，避免无意义 diff；suite taxonomy 优先用 Playwright tag 和文档说明实现。
- 不删除 `injectAuth` / debug API / `WsTestClient`，因为 debug/API 专用测试仍可能需要；只把它们移到明确 test-only/debug 命名边界，降低生产 UI spec 误用风险。

- [x] 拆分 `real-flow.ts` 的职责边界
  - 验证: 新增 auth/room/prompt/game/assertion/session helper 后，`real-flow.ts` 只作为兼容 re-export 或轻量入口；E2E typecheck 通过
- [x] 增加统一 `createStartedGameByUi` helper，并迁移重复 setup
  - 验证: 至少迁移 `game-actions.spec.ts`、`main-action-research-tech.spec.ts`、`main-action-orbit-land.spec.ts`、`free-action-complete-mission.spec.ts` 中重复的两人开局流程
- [x] 隔离 debug/API shortcut helper
  - 验证: debug endpoint helper、localStorage auth 注入、raw websocket client 文件名显式带 debug/test-only/shortcut；`rg` 确认生产 UI specs 不 import 这些 shortcut
- [x] 定义 E2E suite taxonomy
  - 验证: 关键 spec 标题或 describe 包含 `@smoke` / `@real-ui` / `@actions` / `@debug` / `@api` / `@slow`，并在 `docs/tests/e2e.md` 说明如何筛选
- [x] 统一 DB prepare 职责
  - 验证: wrapper 路径只由 `init-e2e-local.sh` 准备 DB，并向 Playwright 传 `SKIP_E2E_DB_PREPARE=1`；直接 Playwright 路径仍由 global setup 准备 DB
- [x] 补 CI headless E2E workflow
  - 验证: workflow 使用 PostgreSQL service、安装依赖/浏览器、运行 E2E typecheck 和 headless Playwright；本地至少通过 YAML/脚本静态检查与 E2E test list
- [x] 更新 review 报告和运行验证
  - 验证: `pnpm --filter @seti/e2e exec tsc -p tsconfig.json --noEmit`、`pnpm --filter @seti/e2e exec playwright test --list --project=chromium`、代表性定向 E2E 通过或明确记录阻塞原因

Review:
- `real-flow.ts` 已拆为 `auth-flow.ts`、`room-flow.ts`、`prompt-resolvers.ts`、`game-actions-flow.ts`、`session-flow.ts`，原入口保留 re-export 兼容现有 spec。
- 新增 `createStartedGameByUi`，并迁移 `game-actions.spec.ts`、`main-action-research-tech.spec.ts`、`main-action-orbit-land.spec.ts`、`free-action-complete-mission.spec.ts` 的重复两人开局流程。
- Shortcut helper 边界已显式命名：`debug-api.ts`、`test-only-auth.ts`、`ws-shortcuts.ts`；生产 UI specs 未 import 这些 shortcut。
- E2E suite 已通过 Playwright title tags 标注，并在 `docs/tests/e2e.md` 记录 `--grep` 筛选方式。
- DB prepare 职责已收敛：wrapper 路径由 `init-e2e-local.sh` 准备 DB 并跳过 Playwright global setup；直接 Playwright 路径仍由 `global-setup.ts` 准备 DB。
- 新增 `.github/workflows/e2e.yml`，包含 PostgreSQL service、依赖安装、Playwright Chromium 安装、E2E typecheck 和 headless E2E 运行。
- 验证通过：E2E typecheck、完整 Playwright test list（54 tests / 29 files）、`@smoke` test list（2 tests）、`@api` test list（8 tests）、workflow YAML 解析、`./scripts/run-e2e-local.sh tests/auth.spec.ts tests/game-actions.spec.ts`（12 passed）、兼容 Node runtime 下直接 Playwright API auth（7 passed）。

## 当前任务：Oumuamua 真实冒烟 E2E 覆盖与修复

假设与权衡：
- 本轮以真实 UI 冒烟闭环为主：注册、建房、开局、可见按钮/输入完成 gameplay；不使用 localStorage 注入、debug endpoint 或 raw websocket 驱动生产路径行为。
- Oumuamua 完整发现前置很长；如果 scan/orbit/land/card 需要稳定地进入 Oumuamua 状态，优先用可复现 seed 和真实房间设置，不重新引入 public `scenarioPreset`。
- 覆盖目标不是穷举规则单测，而是证明 Oumuamua 的 tile scan、planet orbit、planet land、alien card 在真实浏览器里能操作并产生可观察状态。
- 若现有 UI 无法通过真实路径稳定到达某个目标，先暴露失败点并定位根因，再决定是修产品还是调整测试路径。

- [x] 复核 Oumuamua 实现入口和 UI locator
  - 验证: 明确 scan/orbit/land/card 各自对应的 server/client/common 文件、test id、输入 option id
- [x] 跑现有相邻 E2E 基线
  - 验证: `alien-pool-config`、`main-action-orbit-land`、`alien-discovery-real-flow` 或定向 Oumuamua spec 的当前结果被记录
- [x] 增加 Oumuamua 真实 UI 冒烟覆盖
  - 验证: 新增/更新 spec 覆盖 Oumuamua tile scan、Oumuamua orbit、Oumuamua land、Oumuamua card 结算
- [x] 修复发现的问题
  - 验证: 如涉及 common/server/client，保持两端动作和渲染一致；无关代码不改
- [x] Subagent 复核覆盖与 shortcut 风险
  - 验证: 复核结论记录到本段 Review，确认没有用 debug/localStorage/raw WS 替代真实 UI
- [x] 运行 targeted 验证并记录结果
  - 验证: E2E typecheck 与 Oumuamua/相邻 Playwright spec 通过，失败则记录具体阻塞原因

Review:
- 新增 `packages/e2e/tests/oumuamua-real-flow.spec.ts`，通过真实注册、建房、开局、主行动、自由行动和输入面板覆盖 Oumuamua tile scan、orbit、land、alien card 路径；没有使用 localStorage 注入、debug endpoint 或 raw websocket 驱动生产行为。
- 修复真实路径暴露的问题：Oumuamua 是动态太阳系行星，不在常规 Planets tab 中选择；因此 Aliens tab 的 Oumuamua landing area 需要在 orbit/land 选择模式下暴露真实 planet target，并复用 common 的 `canOrbitPlanet` / `canLandOnPlanet` 判定。
- 修复主行动可用性问题：common `getAvailableMainActions` 之前只枚举 `planetaryBoard.planets`，导致探测器到达 Oumuamua 后 ORBIT/LAND 仍 disabled；现在当 solar system 已出现 Oumuamua 时纳入动态空行星状态，服务端执行仍走原有真实 action 校验与结算。
- Subagent 复核结论：Oumuamua 不应从常规 Planets view 选取，orbit/land 目标应在 Aliens board 上通过 `planet-target-oumuamua` 暴露；新增 spec 保持真实 UI/后端路径。
- 验证通过：`tsc -p packages/e2e/tsconfig.json --noEmit`；`pnpm --filter @seti/client typecheck`；`./scripts/run-e2e-local.sh tests/oumuamua-real-flow.spec.ts`（3 passed）；`./scripts/run-e2e-local.sh tests/main-action-orbit-land.spec.ts tests/oumuamua-real-flow.spec.ts`（5 passed）；`./scripts/run-e2e-local.sh tests/alien-pool-config.spec.ts tests/alien-discovery-real-flow.spec.ts`（4 passed）。
