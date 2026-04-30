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

## 参考代码 & 静态资源

### 参考文件（重要）
- **`frontend-reference/.../seti/states.js`** — `"do action"` state 定义了 8 个主行动的按钮和点击处理：
  - `clickableAreas`: `startProbe`, `techPop`, `look`, `clearComputer` 等主行动区域
  - `buttons`: `pass`, `end turn` 等
  - `behavior.evalClick()`: 处理棋盘点击 → 播放卡牌、完成任务等
- **`frontend-reference/.../seti/globals.js`** — `doDefaultMainAction()` 定义了主行动名称到行为的映射
- **`frontend-reference/.../seti/components.js`** — 搜索 `clickableAreas` 在 `playerBoard` 上的定义，展示了 8 个主行动按钮的布局和位置
- **`frontend-reference/.../seti/highlight.js`** — 自由行动的启用条件判定

### 静态资源
- `icons/move.png` → Move Probe 按钮图标
- `icons/look.png` → Scan/Look 按钮图标
- `icons/launch.png` → Launch Probe 按钮图标
- `icons/tech.png` → Research Tech 按钮图标
- `icons/draw.png` → Draw/Play Card 图标
- `icons/data.png` → Place Data 图标
- `icons/clearComputer.png` → Clear Computer 图标
- `icons/income.png` → Income 图标
- `player-passed.png` → Pass 状态指示

### 8 个主行动名称参考
从 reference `components.js` playerBoard clickableAreas:
1. `startProbe` (Launch Probe)
2. `look` (Scan)
3. `techPop` (Research Tech)
4. `clearComputer` (Analyze Data)
5. Play Card (通过卡牌区域点击)
6. Orbit (通过行星区域点击)
7. Land (通过行星区域点击)
8. Pass

## Common Rules Layer 集成

> 详见 `arch-client.md` §4.3 和 `arch-server.md` §4.10。

ActionMenu 和 FreeActionBar 是 common 规则函数的核心消费者：

| 组件 | Common 函数 | UI 效果 |
|------|-------------|---------|
| ActionMenu | `getAvailableMainActions()` | 不可用主行动 disabled + 灰化 |
| ActionMenu | `canLaunchProbe()`, `canOrbit()` 等 | 单个按钮 tooltip 说明不可用原因 |
| FreeActionBar | `getAvailableFreeActions()` | 不可用自由行动 disabled |
| FreeActionBar | `canMoveProbe()`, `canPlaceData()` 等 | 单个按钮启用/禁用 |

```typescript
// ActionMenu.tsx
import { getAvailableMainActions } from '@ender-seti/common/rules';

function ActionMenu() {
  const { gameState, myPlayerId } = useGameContext();
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const available = getAvailableMainActions(myPlayer, gameState);

  return MAIN_ACTIONS.map(action => (
    <ActionButton
      key={action}
      disabled={!available.includes(action)}
      onClick={() => handleAction(action)}
    />
  ));
}
```

```typescript
// FreeActionBar.tsx
import { getAvailableFreeActions } from '@ender-seti/common/rules';

function FreeActionBar() {
  const { gameState, myPlayerId } = useGameContext();
  const myPlayer = gameState.players.find(p => p.id === myPlayerId);
  const available = getAvailableFreeActions(myPlayer, gameState);

  return FREE_ACTIONS.map(action => (
    <FreeActionButton
      key={action}
      disabled={!available.includes(action)}
      onClick={() => handleFreeAction(action)}
    />
  ));
}
```

**注意:** `getAvailableMainActions` 和 `getAvailableFreeActions` 分别由 Task 2-5 和 2-6 实现。如果尚未完成，可先从 Server 推送的 `pendingInput` 中读取可用行动（降级方案）。

## 完成标准
- [ ] 主行动菜单 8 按钮工作（使用对应图标静态资源）
- [ ] 自由行动栏 6 按钮工作
- [ ] enabled/disabled 状态使用 common 规则函数计算
- [ ] 确认对话框工作
- [ ] 所有单测通过
