# Task 4-2: Drizzle Schema + Repository + Undo

## Title
实现数据库 Schema、GameRepository 和快照式 Undo 系统

## 描述
使用 Drizzle ORM 定义 PostgreSQL 数据库表结构，实现 GameRepository 和 UserRepository 进行数据持久化，并基于快照实现 Undo 机制。

## 功能说明

### Schema 定义 (见 arch-server.md §3.2)
- `games` — 游戏会话表 (id, status, playerCount, currentRound, seed, options, timestamps)
- `game_snapshots` — 游戏快照表 (id, gameId, version, state JSONB, event JSONB, timestamp)
- `users` — 用户表 (id, name, email, passwordHash, timestamp)
- `game_players` — 游戏-玩家关联表 (gameId, userId, seatIndex, color)

### GameRepository
- `create(game)` — 创建游戏记录 + 初始快照
- `saveSnapshot(gameId, version, stateDto, event)` — 保存快照
- `loadLatestSnapshot(gameId)` — 加载最新快照
- `loadSnapshot(gameId, version)` — 加载指定版本快照
- `undo(gameId)` — 回退到上一版本
- `findByStatus(status)` — 按状态查询
- `updateStatus(gameId, status)` — 更新状态

### UserRepository
- `create(user)` — 创建用户
- `findByEmail(email)` — 按邮箱查找
- `findById(id)` — 按 ID 查找
- `update(id, data)` — 更新用户信息

### Undo 系统
- 每次主行动前保存快照
- Undo = 加载前一个快照 + 反序列化
- 规则: 只有最后行动的玩家可 undo，且下一个玩家未行动
- Undo 深度可配置 (默认 1)

### 涉及文件
```
packages/server/src/persistence/
├── schema/
│   ├── games.ts
│   ├── players.ts
│   ├── gameSnapshots.ts
│   └── users.ts
├── repository/
│   ├── GameRepository.ts
│   ├── GameRepository.test.ts
│   ├── UserRepository.ts
│   └── UserRepository.test.ts
├── drizzle.module.ts
└── drizzle.config.ts (root)
```

## 技术实现方案

1. 使用 Drizzle 定义 4 张表的 schema
2. 配置 drizzle-kit 迁移
3. 实现 GameRepository (注入 drizzle db instance)
4. 实现 UserRepository
5. Undo: loadSnapshot(version - 1) → deserialize → 替换内存 Game
6. 测试使用 testcontainers 或内存 PG

## 测试要求
- `GameRepository.test.ts`:
  - create → load round-trip
  - saveSnapshot → loadLatestSnapshot 正确
  - undo: 保存 v1 → 保存 v2 → undo → 加载 v1 状态
  - findByStatus 筛选正确
- `UserRepository.test.ts`:
  - create → findByEmail → findById
  - update 字段变更

## 完成标准
- [ ] Drizzle schema 定义完成
- [ ] 迁移脚本可运行
- [ ] GameRepository CRUD + snapshot + undo 工作
- [ ] UserRepository CRUD 工作
- [ ] 所有单测通过（使用 DB mock 或 testcontainers）
