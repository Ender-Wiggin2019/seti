# Task 4-4: WebSocket Gateway

## Title
实现 NestJS WebSocket Gateway — 游戏内实时通信

## 描述
实现基于 Socket.IO 的 WebSocket Gateway，处理游戏内的所有实时通信：行动提交、状态推送、等待提示、事件通知、断线重连。

## 功能说明

### Client → Server 事件
| 事件 | Payload | 处理 |
|------|---------|------|
| `room:join` | `{ gameId }` | 加入 Socket.IO room, 推送当前状态 |
| `room:leave` | `{ gameId }` | 离开 room |
| `game:action` | `{ gameId, action }` | 验证 + 执行主行动 |
| `game:freeAction` | `{ gameId, action }` | 验证 + 执行自由行动 |
| `game:input` | `{ gameId, inputResponse }` | 处理玩家输入响应 |

### Server → Client 事件
| 事件 | Payload | 时机 |
|------|---------|------|
| `game:state` | `IPublicGameState` | 每次状态变更后 (per-player projected) |
| `game:waiting` | `{ playerId, input }` | 需要玩家做决策时 |
| `game:event` | `TGameEvent` | 每个游戏事件 (日志/动画用) |
| `game:error` | `{ code, message }` | 验证失败时 |
| `room:playerJoined` | `{ playerId, name }` | 有人加入 |
| `room:playerLeft` | `{ playerId }` | 有人离开 |

### 核心流程
1. Client 连接时通过 `auth.token` 鉴权
2. `room:join` → 加入 Socket.IO room → 推送 `game:state`
3. `game:action` → 加载 Game → 快照 → 执行 → 推送 state 给所有人
4. 如果执行产生 PlayerInput → 推送 `game:waiting` 给对应玩家
5. 断线重连 → 重新 join → 推送最新 state + pending input

### 内存 Game 管理
- `GameManager` service: 维护 gameId → Game 实例的内存缓存
- 加载: 从 DB 反序列化
- 卸载: 超时无活动后序列化存库并释放

### 涉及文件
```
packages/server/src/gateway/
├── game.gateway.ts
├── game.gateway.test.ts
├── game.gateway.module.ts
├── GameManager.ts
└── GameManager.test.ts
```

## 技术实现方案

1. 使用 `@nestjs/websockets` + `@nestjs/platform-socket.io` 实现 Gateway
2. `@WebSocketGateway()` 装饰器配置 CORS
3. `handleConnection` 时验证 JWT
4. 实现 `GameManager`:
   - `getGame(gameId)` — 内存缓存 → DB 加载
   - `processAction(gameId, playerId, action)` — 快照 + 执行 + 持久化
   - `processFreeAction(gameId, playerId, action)` — 同上
   - `processInput(gameId, playerId, response)` — 同上
5. 每次操作后:
   - `projectGameState` per player → `game:state`
   - 如有 pending input → `game:waiting`
   - 新事件 → `game:event`

## 测试要求
- `game.gateway.test.ts`:
  - 连接鉴权成功 / 无 token 拒绝
  - room:join 后收到 game:state
  - game:action → 正确执行 → state 推送给所有人
  - game:action 非法 → game:error
  - game:waiting 发送给正确玩家
  - 断线重连 → 自动推送最新状态
  - 多玩家并发操作不冲突
- `GameManager.test.ts`:
  - getGame: 缓存命中 / DB 加载
  - processAction: 快照 + 执行 + 持久化
  - 超时卸载

## 完成标准
- [ ] WebSocket Gateway 所有事件收发正确
- [ ] JWT 鉴权在 WebSocket 层工作
- [ ] per-player state projection 正确
- [ ] GameManager 缓存 + 持久化工作
- [ ] 断线重连流程正确
- [ ] 所有单测通过
