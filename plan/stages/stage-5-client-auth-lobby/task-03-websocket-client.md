# Task 5-3: WebSocket Client 集成

## Title
实现 WebSocket 客户端 (wsClient, useSocket, GameContextProvider)

## 描述
实现客户端的 WebSocket 层：Socket.IO 客户端单例、连接生命周期 hook、游戏状态 Context Provider、以及所有与游戏交互的 hooks。

## 功能说明

### WsClient (api/wsClient.ts)
- Socket.IO 客户端单例
- `connect(token)` — 建立连接，JWT 鉴权
- `joinGame(gameId)` — room:join
- `leaveGame(gameId)` — room:leave
- `sendAction(gameId, action)` — game:action
- `sendFreeAction(gameId, action)` — game:freeAction
- `sendInput(gameId, inputResponse)` — game:input
- `onState(cb)` / `onWaiting(cb)` / `onEvent(cb)` / `onError(cb)` — 监听
- `disconnect()` — 断开

### useSocket hook
- 管理 Socket.IO 连接生命周期
- 组件 mount 时连接，unmount 时断开
- 暴露 socket 实例和连接状态

### GameContextProvider
- 管理游戏级别的状态和通信
- 维护 `IGameContext`:
  - gameState: IPublicGameState | null
  - pendingInput: IPlayerInputModel | null
  - isConnected, isReconnecting
  - myPlayerId, isMyTurn, isSpectator
  - sendAction, sendFreeAction, sendInput, requestUndo

### useGameState hook
- 订阅 game:state 事件
- 返回最新 IPublicGameState
- 使用 useDeferredValue 防止大状态更新引起的 jank

### usePlayerInput hook
- 订阅 game:waiting 事件
- 维护当前 pending input
- 提供 respond(response) helper

### useGameActions hook
- 封装 wsClient 的 action 发送方法
- 提供 type-safe 的 action builder

### useGameEvents hook
- 订阅 game:event 事件
- 维护最近事件列表

### useGameError hook
- 订阅 game:error 事件
- 触发 toast 通知

### useReconnection hook
- 监听 disconnect/reconnect 事件
- 自动 rejoin game room
- 显示 reconnecting overlay

### 涉及文件
```
packages/client/src/
├── api/
│   └── wsClient.ts
├── hooks/
│   ├── useSocket.ts
│   ├── useGameState.ts
│   ├── useGameActions.ts
│   ├── usePlayerInput.ts
│   ├── useGameEvents.ts
│   ├── useGameError.ts
│   └── useReconnection.ts
├── pages/
│   └── game/
│       └── GamePage.tsx (GameContextProvider 集成)
└── test/
    └── mocks/
        ├── socket.ts
        └── gameState.ts
```

## 技术实现方案

1. 实现 WsClient 类 (Socket.IO client wrapper)
2. 实现 useSocket hook (连接管理)
3. 实现 GameContextProvider:
   - 内部使用 useRef 存储最新状态
   - game:state → 更新 context
   - game:waiting → 更新 pendingInput
   - game:error → 触发 toast
4. 实现各 hook 从 GameContext 中选择性读取
5. Mock 工具:
   - `MockSocketServer` — 模拟 Socket.IO 服务端
   - `createMockGameState()` — mock 状态工厂

## 测试要求

### 单元测试
- `wsClient.test.ts`:
  - connect 时发送 auth token
  - joinGame/leaveGame 发送正确事件
  - sendAction/sendFreeAction/sendInput 发送正确 payload
  - onState/onWaiting 回调正确触发
- `useSocket.test.ts`:
  - mount 时连接, unmount 时断开
  - 连接状态正确反映
- `useGameState.test.ts`:
  - game:state 事件更新状态
  - 初始为 null
- `usePlayerInput.test.ts`:
  - game:waiting 更新 pending input
  - respond 调用 wsClient.sendInput
- `useReconnection.test.ts`:
  - disconnect → reconnect → rejoin

### Mock 设施
- `test/mocks/socket.ts`: Mock Socket.IO client
- `test/mocks/gameState.ts`: createMockGameState factory

## 完成标准
- [ ] WsClient 所有方法工作
- [ ] GameContextProvider 正确管理状态
- [ ] 所有 hook 功能正确
- [ ] 断线重连流程完整
- [ ] Mock 设施可用于后续 Stage 的测试
- [ ] 所有单测通过
