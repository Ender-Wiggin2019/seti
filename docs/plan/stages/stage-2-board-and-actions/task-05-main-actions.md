# Task 2-5: 8 个 Main Actions 实现

## Title
实现全部 8 个主行动 (LaunchProbe, Orbit, Land, Scan, AnalyzeData, PlayCard, ResearchTech, Pass)

## 描述
实现游戏的 8 个主行动。每个行动包含合法性验证（canExecute）和执行逻辑（execute），通过 DeferredAction 入队并产生 PlayerInput（如需要玩家选择）。这是游戏核心玩法的完整实现。

## 功能说明

### 各行动规格 (参见 PRD §7)

**LaunchProbe:**
- 验证: ≥2 信用 + probesInSpace < limit
- 执行: 扣 2 信用, 放探针到地球空间, 增 probesInSpace

**Orbit:**
- 验证: ≥1 信用 + ≥1 能量 + 至少一个探针在非地球行星空间
- 执行: 扣资源, 选择探针 → 入轨道, 减 probesInSpace, 轨道奖励

**Land:**
- 验证: 至少一个探针在行星空间 + energy ≥ cost (3 或 2)
- 执行: 扣能量, 选择探针 → 着陆, 减 probesInSpace, 着陆奖励

**Scan:**
- 验证: ≥1 信用 + ≥2 能量
- 执行: 扣资源, 标记地球扇区信号, 弃卡行一张并标记对应扇区, 望远镜附加效果
- 需要 PlayerInput: SelectCard (选择弃哪张), 可能的望远镜选择

**AnalyzeData:**
- 验证: ≥1 能量 + 电脑上排全满
- 执行: 扣 1 能量, 清空电脑所有数据, 标记蓝色生命痕迹
- 需要 PlayerInput: SelectTrace (选择标记哪个种族)

**PlayCard:**
- 验证: 手中有选定卡 + 能支付费用
- 执行: 支付费用, 执行卡牌效果, 卡牌去向 (弃牌堆/留在面前)
- 需要 PlayerInput: SelectCard (选牌) + 卡牌特定输入

**ResearchTech:**
- 验证: 宣传 ≥6 (非卡牌效果时) + 有可用科技
- 执行: **始终旋转太阳系**, 扣 6 宣传, 取科技 tile, 首取 +2 VP, 即时奖励
- 需要 PlayerInput: SelectTech (选择科技类型)

**Pass:**
- 执行: 弃手牌到 4 张以下 → 首个 pass 旋转太阳系 → 选回合末卡牌 → 标记 passed
- 需要 PlayerInput: SelectCard (弃牌), SelectEndOfRoundCard (选回合末卡)

### 涉及文件
```
packages/server/src/engine/actions/
├── LaunchProbe.ts      + LaunchProbe.test.ts
├── Orbit.ts            + Orbit.test.ts
├── Land.ts             + Land.test.ts
├── Scan.ts             + Scan.test.ts
├── AnalyzeData.ts      + AnalyzeData.test.ts
├── PlayCard.ts         + PlayCard.test.ts
├── ResearchTech.ts     + ResearchTech.test.ts
└── Pass.ts             + Pass.test.ts

packages/server/src/engine/input/
├── SelectCard.ts       + SelectCard.test.ts
├── SelectSector.ts     + SelectSector.test.ts
├── SelectPlanet.ts     + SelectPlanet.test.ts
├── SelectTech.ts       + SelectTech.test.ts
├── SelectResource.ts   + SelectResource.test.ts
├── SelectTrace.ts      + SelectTrace.test.ts
└── SelectEndOfRoundCard.ts + SelectEndOfRoundCard.test.ts
```

## 技术实现方案

1. 每个 Action 实现为一个函数/类，包含 `canExecute(player, game)` 和 `execute(player, game)`
2. execute 内部通过 `game.deferredActions.push()` 入队效果
3. 需要选择时创建对应 PlayerInput 并返回
4. 同时实现剩余 PlayerInput 类型 (SelectCard, SelectSector 等)
5. 实现 `buildActionMenu(player)` 构建 OrOptions 主行动菜单

## 测试要求

每个 Action 需要测试：
- **合法边界**: 资源刚好足够 / 刚好不足
- **正常执行**: 资源扣除 + 效果生效 + 状态变更
- **特殊规则**:
  - Scan: 平局由最新标记打破
  - AnalyzeData: 仅上排满时可执行
  - ResearchTech: 始终旋转（含卡牌效果授予）
  - Pass: 首个 pass 旋转; 回合末卡牌选择
- **PlayerInput**: 生成正确的输入类型 + 选项
- **边界**: 资源为 0, 棋子用完, 牌堆为空等

## 完成标准
- [ ] 8 个 main actions 全部实现
- [ ] 剩余 PlayerInput 类型全部实现
- [ ] 主行动菜单 buildActionMenu 工作正确
- [ ] 每个 action 至少覆盖 合法/非法/边界 三类场景
- [ ] 所有单测通过
