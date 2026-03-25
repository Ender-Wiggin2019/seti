# Task 0-1: Common 协议类型扩展

## Title
扩展 `@ender-seti/common` — 添加 Client-Server 运行时协议类型

## 描述
在现有 `@ender-seti/common` 包的 `src/types/` 下新建 `protocol/` 子目录，定义 Client 与 Server 共享的通信协议类型。这些类型是后续所有 Server 引擎逻辑和 Client UI 渲染的共同基础。

## 功能说明

### 需要定义的类型

**游戏状态投影 (Server → Client)：**
- `IPublicGameState` — 每个玩家视角的完整游戏状态
- `IPublicPlayerState` — 玩家公开状态 (资源/分数/棋子/手牌数)
- `IPublicSolarSystem` — 太阳系视图模型
- `IPublicSector` — 扇区视图模型
- `IPublicPlanetaryBoard` — 行星面板视图模型
- `IPublicTechBoard` — 科技面板视图模型

**玩家输入模型 (Server → Client 决策提示)：**
- `IPlayerInputModel` — 输入基础接口 (type + options)
- 各具体输入类型的序列化模型

**请求/响应 (Client → Server)：**
- `IMainActionRequest` — 主行动请求
- `IFreeActionRequest` — 自由行动请求
- `IInputResponse` — 决策响应

**WebSocket 事件类型：**
- `TGameEvent` — 游戏事件联合类型
- WebSocket 事件名到 payload 的类型映射

**基础枚举补充：**
- `EPhase` — 游戏阶段枚举
- `EPlanet` — 行星枚举
- `ETech` — 科技类型枚举
- `ETrace` — 生命痕迹枚举
- `EAlienType` — 外星种族枚举
- `EMainAction` / `EFreeAction` — 行动类型枚举
- `EErrorCode` — 错误码枚举

### 目录结构
```
packages/common/src/types/protocol/
├── index.ts
├── gameState.ts        # IPublicGameState 及子模型
├── playerInput.ts      # IPlayerInputModel 及各输入类型
├── actions.ts          # 请求/响应类型
├── events.ts           # TGameEvent
├── enums.ts            # EPhase, EPlanet, ETech 等
└── errors.ts           # EErrorCode
```

## 技术实现方案

1. 在 `packages/common/src/types/protocol/` 下逐一创建类型文件
2. 所有 Interface 以 `I` 开头，Type 以 `T` 开头，Enum 以 `E` 开头
3. 在 `packages/common/src/types/protocol/index.ts` 汇总导出
4. 更新 `packages/common/package.json` 的 subpath exports 添加 `types/protocol`
5. 确保 `tsup` 构建配置包含新目录

## 测试要求
- 类型文件无运行时逻辑，通过 TypeScript 编译器检查（`tsc --noEmit`）
- 编写类型测试文件 (`protocol.typetest.ts`) 验证类型兼容性
- 确保 Server 和 Client 都能成功 import 并通过类型检查

## 完成标准
- [ ] 所有协议类型定义完成
- [ ] `pnpm run typecheck` 全部通过
- [ ] `pnpm run build --filter @ender-seti/common` 成功
- [ ] 类型测试文件验证通过
