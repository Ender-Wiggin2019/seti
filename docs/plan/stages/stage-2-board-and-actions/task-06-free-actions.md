# Task 2-6: 6 个 Free Actions 实现

## Title
实现全部 6 个自由行动 (Movement, PlaceData, CompleteMission, FreeActionCorner, BuyCard, ExchangeResources)

## 描述
实现游戏的 6 个自由行动。自由行动不占用主行动次数，在活跃玩家的回合内可多次执行。部分自由行动可能触发 PlayerInput。

## 功能说明

### 各自由行动规格 (参见 PRD §8)

**Movement (移动):**
- 花 1 移动点移动 1 步（邻接非对角线）
- 离开小行星额外 +1 移动
- 经过宣传图标获得宣传
- 太阳不可穿越
- 额外移动来源: 1 能量 = 1 移动, 弃牌移动图标

**PlaceData (放置数据):**
- 仅在自己回合
- 从 dataPool 移到电脑空间
- 上排从左到右填充
- 下排需对应上排已填
- 覆盖空间即时奖励 (宣传/收入/VP)

**CompleteMission (完成任务):**
- 条件型任务: 条件为真时可完成
- 完成后翻面（不再检查条件）
- 获得任务完成奖励

**FreeActionCorner (卡牌自由行动角):**
- 弃一张手牌
- 执行该卡左上角的自由行动效果

**BuyCard (购买卡牌):**
- 花 3 宣传
- 从卡牌行或牌顶取 1 张
- 从行取后立即补充
- 牌堆空时弃牌堆洗入

**ExchangeResources (资源交换):**
- 2 张卡/2 信用/2 能量 → 1 张卡/1 信用/1 能量
- 任意两种相同资源换任意一种资源

### 涉及文件
```
packages/server/src/engine/freeActions/
├── Movement.ts          + Movement.test.ts
├── PlaceData.ts         + PlaceData.test.ts
├── CompleteMission.ts   + CompleteMission.test.ts
├── FreeActionCorner.ts  + FreeActionCorner.test.ts
├── BuyCard.ts           + BuyCard.test.ts
└── ExchangeResources.ts + ExchangeResources.test.ts
```

## 技术实现方案

1. 每个 Free Action 实现 `canExecute(player, game)` 和 `execute(player, game)`
2. Free Actions 不经过 DeferredAction 队列，直接执行
3. Movement 需要 SolarSystem 的邻接图
4. PlaceData 需要 Computer 子系统
5. BuyCard 需要 MainDeck + CardRow
6. ExchangeResources 产生 PlayerInput (选择交换类型)

## 测试要求

每个 Free Action 需要测试：
- `Movement.test.ts`:
  - 基本移动 + 邻接验证
  - 小行星额外消耗
  - 宣传图标触发
  - 太阳不可通过
  - 能量换移动
- `PlaceData.test.ts`:
  - 上排顺序放置
  - 下排规则 (需上排对应位已填)
  - 覆盖空间奖励触发
  - data pool 为空时不可执行
- `CompleteMission.test.ts`:
  - 条件满足时可完成
  - 条件不满足时不可执行
  - 完成后状态变更
- `FreeActionCorner.test.ts`:
  - 弃牌 + 效果执行
  - 无可用卡时不可执行
- `BuyCard.test.ts`:
  - 宣传不足时不可执行
  - 从行取 + 自动补充
  - 牌堆空时弃牌洗入
- `ExchangeResources.test.ts`:
  - 各种合法交换组合
  - 资源不足时拒绝

## 完成标准
- [ ] 6 个 free actions 全部实现
- [ ] 每个 action 合法性检查正确
- [ ] 与子系统 (SolarSystem, Computer, Deck 等) 集成正确
- [ ] 所有单测通过
