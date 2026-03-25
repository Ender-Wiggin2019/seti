# Task 5-2: Lobby 页面

## Title
实现 Lobby 大厅页面 (房间列表 + 创建房间 + 房间详情)

## 描述
实现客户端的大厅功能：房间列表页（筛选、刷新）、创建房间对话框（游戏设置）、房间详情页（玩家列表、设置、开始游戏）。

## 功能说明

### lobbyApi
- `listRooms(filter?)` → GET /lobby/rooms
- `createRoom(settings)` → POST /lobby/rooms
- `getRoom(id)` → GET /lobby/rooms/:id
- `joinRoom(id)` → POST /lobby/rooms/:id/join
- `leaveRoom(id)` → POST /lobby/rooms/:id/leave
- `startGame(id)` → POST /lobby/rooms/:id/start

### LobbyPage (`/lobby`)
- 房间列表 (RoomCard 网格)
- 筛选按钮: waiting / playing / all
- 创建房间按钮 → CreateRoomDialog
- 自动刷新 (TanStack Query polling 5s 或 WebSocket 推送)

### CreateRoomDialog
- 游戏设置表单:
  - 人数 (2-4)
  - Alien 模块开关
  - Undo 允许
  - 回合计时器
  - 扩展包选择
- Zod 验证

### RoomCard
- 紧凑房间预览: 房主、人数、状态、创建时间
- 点击进入 RoomPage

### RoomPage (`/room/:roomId`)
- 玩家位置 (PlayerSlot × playerCount)
- 每个位置: 头像 + 名字 + 准备状态
- 游戏设置面板 (GameSettingsPanel, 仅房主可编辑)
- 加入/离开按钮
- 开始游戏按钮 (仅房主, 人满可点)
- 开始后自动跳转 /game/:gameId

### 涉及文件
```
packages/client/src/
├── api/
│   └── lobbyApi.ts
├── pages/
│   └── lobby/
│       ├── LobbyPage.tsx
│       ├── RoomPage.tsx
│       └── GameSettingsPanel.tsx
├── components/
│   ├── RoomCard.tsx
│   ├── PlayerSlot.tsx
│   └── CreateRoomDialog.tsx
```

## 技术实现方案

1. 实现 lobbyApi (6 个 REST 调用)
2. 实现 LobbyPage + RoomCard (TanStack Query + polling)
3. 实现 CreateRoomDialog (shadcn Dialog + Form)
4. 实现 RoomPage + PlayerSlot + GameSettingsPanel
5. 路由配置: /lobby, /room/$roomId
6. 开始游戏: POST start → 成功后 navigate to /game/:gameId

## 测试要求

### 组件测试 (RTL)
- `LobbyPage.test.tsx`:
  - 房间列表正确渲染 (mock data)
  - 筛选切换更新列表
  - 创建房间按钮打开对话框
- `RoomPage.test.tsx`:
  - 玩家位置正确显示
  - 非房主不可见开始按钮
  - 人数未满开始按钮 disabled
  - 加入/离开切换
- `CreateRoomDialog.test.tsx`:
  - 表单验证 (人数范围)
  - 提交成功后关闭对话框
- `GameSettingsPanel.test.tsx`:
  - 非房主只读模式
  - 各设置项变更

### E2E 可行性
- Lobby → 创建房间 → 进入房间 → 多人加入 → 开始游戏 → 跳转
- 适合完整 E2E 测试场景

## 完成标准
- [ ] Lobby 房间列表功能完整
- [ ] 创建房间 + 游戏设置工作
- [ ] 房间详情 + 加入/离开/开始工作
- [ ] 开始后正确跳转
- [ ] 所有单测通过
