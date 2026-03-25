# Task 4-3: REST API (Auth + Lobby)

## Title
实现 NestJS REST API — Auth 认证模块 + Lobby 大厅模块

## 描述
实现服务端的 REST API 层，包括 JWT 认证（注册/登录/获取用户信息）和大厅管理（创建房间/加入/离开/列出/开始游戏）。

## 功能说明

### Auth 模块
| Endpoint | Method | 功能 |
|----------|--------|------|
| `POST /auth/register` | POST | 创建账户 (name, email, password) |
| `POST /auth/login` | POST | 登录获取 JWT |
| `GET /auth/me` | GET | 获取当前用户信息 |
| `PUT /auth/me` | PUT | 更新用户信息 |

- 密码使用 bcrypt 加密存储
- JWT 包含 userId, 有效期可配置
- 请求验证使用 class-validator

### Lobby 模块
| Endpoint | Method | 功能 |
|----------|--------|------|
| `GET /lobby/rooms` | GET | 列出房间 (可按状态筛选) |
| `POST /lobby/rooms` | POST | 创建房间 |
| `GET /lobby/rooms/:id` | GET | 房间详情 |
| `POST /lobby/rooms/:id/join` | POST | 加入房间 |
| `POST /lobby/rooms/:id/leave` | POST | 离开房间 |
| `POST /lobby/rooms/:id/start` | POST | 开始游戏 (仅房主) |

- 房间状态: waiting → playing → finished
- 开始游戏时创建 Game 实例 + 初始快照
- 所有接口需 JWT 认证 (除 register/login)

### Guards & Interceptors
- `JwtAuthGuard` — 验证 Bearer token
- `ThrottlerGuard` — 限流
- DTO 验证 — class-validator decorators

### 涉及文件
```
packages/server/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.controller.test.ts
├── auth.service.ts
├── auth.service.test.ts
├── jwt.strategy.ts
├── jwt-auth.guard.ts
└── dto/
    ├── RegisterDto.ts
    ├── LoginDto.ts
    └── UpdateProfileDto.ts

packages/server/src/lobby/
├── lobby.module.ts
├── lobby.controller.ts
├── lobby.controller.test.ts
├── lobby.service.ts
├── lobby.service.test.ts
└── dto/
    ├── CreateRoomDto.ts
    ├── RoomResponseDto.ts
    └── GameSettingsDto.ts
```

## 技术实现方案

1. 实现 Auth module: Controller → Service → UserRepository
2. JWT 策略: `@nestjs/jwt` + `@nestjs/passport`
3. 实现 Lobby module: Controller → Service → GameRepository
4. `start` 端点: Service 调用 `Game.create()` → `GameSerializer.serialize()` → `GameRepository.saveSnapshot()`
5. DTO 使用 class-validator 装饰器验证
6. 统一错误处理 ExceptionFilter

## 测试要求
- `auth.controller.test.ts`:
  - 注册成功 / 重复邮箱拒绝
  - 登录成功返回 JWT / 密码错误拒绝
  - me 端点返回正确用户信息
  - 未认证访问 me 返回 401
- `lobby.controller.test.ts`:
  - 创建房间成功
  - 加入 / 离开房间
  - 非房主开始游戏拒绝
  - 开始游戏创建 Game 实例
  - 列出房间按状态筛选
- 使用 `@nestjs/testing` 的 `Test.createTestingModule` + mock repositories

## 完成标准
- [ ] Auth 认证完整 (register, login, me, update)
- [ ] Lobby 大厅完整 (CRUD rooms, join, leave, start)
- [ ] JWT 鉴权工作
- [ ] DTO 验证工作
- [ ] 所有单测通过
