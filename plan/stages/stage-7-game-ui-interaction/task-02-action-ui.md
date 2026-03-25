# Task 7-2: ActionMenu + FreeActionBar

## Title
实现主行动菜单和自由行动工具栏

## 描述
实现 ActionMenu（8 个主行动按钮，仅当前玩家回合显示）和 FreeActionBar（6 个自由行动按钮，根据游戏状态动态启用/禁用）。

## 功能说明

### ActionMenu
- 仅在 `currentPlayerId === myPlayerId` 且 phase === AWAIT_MAIN_ACTION 时显示
- 8 个按钮: Launch Probe / Orbit / Land / Scan / Analyze Data / Play Card / Research Tech / Pass
- 每个按钮的 enabled 状态从 server 推送的 OrOptions input 中读取
- 点击 → `sendAction(type)` 或触发 InputRenderer (如 Scan 需要后续选择)
- 非自己回合时显示 "Waiting for [Player Name]..."

### FreeActionBar
- 持久显示在底部 (仅自己回合)
- 6 个按钮:
  | 按钮 | 启用条件 |
  |------|----------|
  | Move Probe | 有探针 + 移动点 > 0 |
  | Place Data | 有 data pool + 电脑有空位 |
  | Complete Mission | 有可完成的任务 |
  | Use Card | 手中有自由行动角卡 |
  | Buy Card (3🎯) | 宣传 ≥ 3 |
  | Exchange | 任何资源 ≥ 2 |
- 点击触发对应自由行动流程

### ActionConfirm
- 消耗型行动确认对话框
- 显示消耗内容 + 确认/取消

### UndoButton
- 显示在 ActionMenu 旁
- 仅在允许 undo 时 enabled
- 点击 → requestUndo

### 涉及文件
```
packages/client/src/features/actions/
├── ActionMenu.tsx
├── ActionMenu.test.tsx
├── FreeActionBar.tsx
├── FreeActionBar.test.tsx
├── ActionConfirm.tsx
├── ActionConfirm.test.tsx
└── UndoButton.tsx
   └── UndoButton.test.tsx
```

## 技术实现方案

1. ActionMenu: 从 pendingInput (type === 'or') 读取可用选项
2. FreeActionBar: 从 gameState 计算各按钮 enabled
3. ActionConfirm: shadcn AlertDialog
4. UndoButton: 从 gameState.canUndo 判断

## 测试要求
- `ActionMenu.test.tsx`:
  - 自己回合显示 8 按钮
  - 非自己回合显示等待提示
  - 不可用行动 disabled 样式
  - 点击触发 sendAction
- `FreeActionBar.test.tsx`:
  - 各按钮 enabled/disabled 状态正确
  - 点击触发对应 sendFreeAction
- `ActionConfirm.test.tsx`:
  - 显示消耗内容
  - 确认/取消

## 完成标准
- [ ] 主行动菜单 8 按钮工作
- [ ] 自由行动栏 6 按钮工作
- [ ] enabled/disabled 状态正确
- [ ] 确认对话框工作
- [ ] 所有单测通过
