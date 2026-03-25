# Task 7-4: EventLog + OpponentSummary + GameOverDialog

## Title
实现事件日志、对手概览和游戏结束弹窗

## 描述
实现右侧栏和游戏结束相关组件：事件日志（滚动历史）、对手概览（其他玩家公开状态）、游戏结束对话框（最终计分明细）。

## 功能说明

### EventLog
- 可滚动事件历史列表
- 每条事件: 图标 + 描述文本 + 时间
- 事件类型: ACTION / RESOURCE_CHANGE / SCORE_CHANGE / SECTOR_COMPLETED / ALIEN_DISCOVERED / ROTATION / ROUND_END / GAME_END
- 新事件自动滚动到底部
- useDeferredValue 优化 (非关键 UI)

### EventEntry (单条事件)
- 图标: 按事件类型选择
- 描述: 可读文本 (i18n)
- 玩家颜色标识

### OpponentSummary
- 紧凑视图显示其他玩家:
  - 名字 + 颜色
  - 手牌数量 (不显示内容)
  - 资源 / 宣传 / 分数
  - 科技数量
  - 任务数量
- 可展开看更多详情

### GameOverDialog
- 游戏结束时弹出
- 显示最终计分明细表:
  - 各计分源 (基础分/卡牌/科技/里程碑/金色板块/外星)
  - 每个玩家的分项和总分
  - 胜者高亮
- ScoreBreakdown 表格组件

### MilestoneTrack
- 金色 + 中立里程碑在分数轨道上的位置
- 已触发的里程碑标记

### GoldTileSelector
- 里程碑触发时的金色板块选择 UI
- 显示可选板块 + 剩余位置

### 涉及文件
```
packages/client/src/features/log/
├── EventLog.tsx        + test
└── EventEntry.tsx      + test

packages/client/src/features/player/
└── OpponentSummary.tsx + test

packages/client/src/features/scoring/
├── MilestoneTrack.tsx    + test
├── GoldTileSelector.tsx  + test
└── ScoreBreakdown.tsx    + test

packages/client/src/pages/game/
└── GameOverDialog.tsx    + test
```

## 技术实现方案

1. EventLog: shadcn ScrollArea + EventEntry 列表
2. EventEntry: cn 动态图标 + i18n 文本
3. OpponentSummary: Accordion 可展开
4. GameOverDialog: shadcn Dialog + ScoreBreakdown table
5. MilestoneTrack: 水平进度条 + 标记点
6. GoldTileSelector: 4 块板块 Grid + 可选位

## 测试要求
- `EventLog.test.tsx`: 渲染事件列表, 新事件自动滚动
- `EventEntry.test.tsx`: 各事件类型正确渲染
- `OpponentSummary.test.tsx`: 各玩家信息正确显示, 手牌只显示数量
- `GameOverDialog.test.tsx`: 计分明细表正确, 胜者高亮
- `ScoreBreakdown.test.tsx`: 各分项汇总正确

## 完成标准
- [ ] 事件日志完整可滚动
- [ ] 对手概览信息正确
- [ ] 游戏结束弹窗计分明细完整
- [ ] 所有单测通过
