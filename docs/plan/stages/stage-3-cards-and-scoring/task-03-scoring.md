# Task 3-3: Milestone + GoldScoringTile + FinalScoring

## Title
实现里程碑系统、金色计分板块和终局计分

## 描述
实现完整的计分系统：金色里程碑 (25/50/70 VP)、中立里程碑 (20/30, 非 4 人局)、金色计分板块 (4 块随机面)、以及终局计分流程。

## 功能说明

### MilestoneState
- goldMilestones: 25/50/70 三档，每档可被多人触发
  - 首个触发者获得最高值槽位
  - 后续触发者获得递减值
  - 不可重复标记同一板块
- neutralMilestones: 20/30 (仅 2-3 人局)
  - 触发时移动中立标记到发现空间
  - 可能触发种族发现

### MilestoneState 方法
- `checkAndQueue(game, player)` — 每回合结束后检查
- 多人同窗口触发时按座位顺序（从当前玩家开始）
- 中立里程碑总是最后处理

### GoldScoringTile
- 4 块板块，每块有两面 (A/B)，初始化时随机选一面
- 每面有不同的计分公式
- 公式类型:
  - 科技集合 (min(各色数量) × 分值)
  - 科技对 (floor(总科技/2) × 分值)
  - 任务完成数
  - 收入卡类型
  - 生命痕迹集合
  - 扇区胜利 + 轨道者/着陆者配对
  - 等等

### FinalScoring
- 在第 5 轮所有人 pass 后执行
- 顺序：
  1. 计算终局计分卡 (金盒卡)
  2. 计算金色计分板块
  3. 执行种族特定计分 (如有)
  4. 汇总 → 最高 VP 胜，平局即平

### 涉及具体 DeferredAction
- `ResolveMilestone` — 里程碑检查和处理
- `ResolveDiscovery` — 种族发现 (此处实现框架，Stage 8 填充)

### 涉及文件
```
packages/server/src/engine/scoring/
├── Milestone.ts
├── Milestone.test.ts
├── GoldScoringTile.ts
├── GoldScoringTile.test.ts
├── FinalScoring.ts
└── FinalScoring.test.ts

packages/server/src/engine/deferred/
├── ResolveMilestone.ts
├── ResolveMilestone.test.ts
├── ResolveDiscovery.ts   # 框架
└── ResolveSectorCompletion.ts
   └── ResolveSectorCompletion.test.ts
```

## 技术实现方案

1. 实现 `MilestoneState` 类
   - 金色里程碑: 阈值检查 → 产生 PlayerInput (SelectGoldTile)
   - 中立里程碑: 自动放置标记到发现空间
2. 实现 `GoldScoringTile` 类
   - 每个公式为纯函数 `(player, game) => number`
   - 4 块板块 + AB 面 → 8 个公式
3. 实现 `FinalScoring`:
   - 遍历所有计分源
   - 汇总各玩家 VP
   - 确定胜者
4. 实现 `ResolveMilestone` DeferredAction
5. 实现 `ResolveSectorCompletion` DeferredAction

## 测试要求
- `Milestone.test.ts`:
  - 达到阈值时触发
  - 多人同窗口按座位顺序
  - 中立里程碑最后处理
  - 不可重复标记同一板块
  - 过 100 分不重复触发
- `GoldScoringTile.test.ts`:
  - 每个公式（A/B 面各一）计算结果正确
  - 输入 PRD §12.3 的各公式验证
- `FinalScoring.test.ts`:
  - 用固定状态验证最终分数
  - 平局处理正确
  - 所有计分源都被计算
- `ResolveMilestone.test.ts`:
  - 里程碑触发产生正确 PlayerInput
  - 多里程碑同时触发的顺序

## 完成标准
- [ ] 里程碑系统完整 (金色 + 中立)
- [ ] 金色计分板块 8 个公式全部实现
- [ ] 终局计分流程完整
- [ ] 完整游戏循环可以从 setup 到 final scoring
- [ ] 所有单测通过
