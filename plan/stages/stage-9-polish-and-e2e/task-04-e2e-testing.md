# Task 9-4: E2E 测试 (Playwright)

## Title
实现 Playwright E2E 测试 — 覆盖多玩家完整游戏流程

## 描述
使用 Playwright 编写端到端测试，覆盖从注册/登录到创建房间、开始游戏、执行回合、直到游戏结束的完整多玩家流程。同时覆盖关键 UI 交互路径。

## 功能说明

### E2E 测试场景

**Auth 流程:**
- 注册新用户 → 登录 → 跳转 lobby
- 无效登录 → 错误提示
- 未认证访问 → 重定向 /auth

**Lobby 流程:**
- 创建房间 → 房间出现在列表
- 加入房间 → 看到自己在玩家列表
- 开始游戏 → 跳转 game page

**游戏核心流程 (多 tab/多 browser context):**
- 2 个浏览器 context 模拟 2 个玩家
- Player A 执行 main action → Player B 看到状态更新
- PlayerInput 交互: Scan → 选扇区 → 选弃牌
- Free action: 移动探针
- Pass: 弃牌 + 选回合末卡
- 回合结束 → 收入 → 下一轮
- 5 轮后 → 游戏结束 → 计分弹窗

**响应式测试:**
- Desktop viewport (1280px)
- Tablet viewport (768px)
- Mobile viewport (375px)

**断线重连:**
- 模拟 WebSocket 断线 → 重连 → 状态恢复

### 测试基础设施
- Playwright config
- 测试 fixtures (创建用户、房间、游戏的 helper)
- 预编排行动序列 (deterministic seed)
- API helper (直接调 REST API 跳过 UI 步骤)

### 涉及文件
```
packages/client/e2e/
├── playwright.config.ts
├── fixtures/
│   ├── auth.fixture.ts
│   ├── lobby.fixture.ts
│   └── game.fixture.ts
├── auth.spec.ts
├── lobby.spec.ts
├── game-flow.spec.ts
├── game-interaction.spec.ts
├── responsive.spec.ts
└── reconnection.spec.ts
```

## 技术实现方案

1. 配置 Playwright (chromium, 可选 firefox)
2. 实现 test fixtures:
   - `createUser()` — 通过 API 创建用户
   - `login(email, password)` — UI 登录或 API 获取 token
   - `createAndJoinRoom()` — 创建房间并加入
3. 多玩家测试: 使用 `browser.newContext()` 创建多个独立浏览器
4. 游戏流程: 预编排 deterministic seed + 固定行动序列
5. CI: Playwright 在 headless 模式运行

## 测试要求
- Auth: 注册/登录/守卫 至少各 1 case
- Lobby: 创建/加入/开始 至少各 1 case
- Game: 完整 2 人 2 轮小游戏 (不需要 5 轮，验证流程即可)
- 交互: 至少覆盖 3 种 PlayerInput 类型
- 响应式: 3 个断点各 1 case
- 重连: 1 case

## 完成标准
- [ ] Playwright 配置完成
- [ ] Auth E2E 通过
- [ ] Lobby E2E 通过
- [ ] 多玩家游戏流程 E2E 通过
- [ ] CI 中 E2E headless 运行
- [ ] 响应式测试通过
