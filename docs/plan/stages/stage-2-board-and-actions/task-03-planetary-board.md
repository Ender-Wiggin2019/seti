# Task 2-3: PlanetaryBoard 行星系统

## Title
实现行星面板、轨道/着陆系统、月球机制

## 描述
实现行星面板逻辑，管理各行星的轨道占位、着陆占位、首次到达奖励、月球解锁与着陆。

## 功能说明

### PlanetaryBoard 类
- `planets: Map<EPlanet, PlanetState>` — 每个行星的状态

### PlanetState
- `orbitSlots: { playerId }[]` — 轨道占位列表（无上限）
- `landingSlots: { playerId }[]` — 着陆占位列表（无上限）
- `firstOrbitClaimed: boolean` — 首次轨道奖励是否已领取
- `firstLandDataBonusTaken: boolean[]` — 首次着陆数据奖励（火星有 2 个）
- `moonOccupant: { playerId } | null` — 月球占位（单一）
- `moonUnlocked: boolean` — 月球是否解锁

### 核心方法
- `orbit(planet, playerId)`:
  - 放置轨道者
  - 首次轨道 +3 VP
  - 返回 orbit bonus
- `land(planet, playerId, isMoon?)`:
  - 放置着陆者
  - 行星中心奖励 (含生命痕迹 + VP)
  - 首次着陆数据奖励
  - 月球规则：需解锁 + 单一占位
  - 返回 landing rewards
- `canOrbit(planet, playerId)` — 检查是否有探针在该行星空间
- `canLand(planet, playerId)` — 检查资格 + 能量要求
- `getLandingCost(planet, playerId)` — 3 能量（有轨道者时 2 能量）
- `unlockMoon(planet)` — 通过科技/效果解锁月球

### 涉及文件
```
packages/server/src/engine/board/
├── PlanetaryBoard.ts
└── PlanetaryBoard.test.ts
```

## 技术实现方案

1. 定义 `EPlanet` 枚举 (Mercury, Venus, Mars, Jupiter, Saturn 等)
2. 每个行星初始化各自的 slot 容量和奖励数据
3. orbit/land 方法执行占位 + 奖励计算
4. 月球解锁状态由 Game 层在科技获取时调用 `unlockMoon`
5. 着陆费用根据是否有轨道者动态计算

## 测试要求
- `PlanetaryBoard.test.ts`:
  - orbit: 正常占位 + 首次 +3 VP + 后续无额外
  - land: 正常占位 + 中心奖励 + 首次数据奖励
  - land: 有轨道者时着陆费用降低 (3→2)
  - land: 火星双首次数据奖励
  - moon: 未解锁时 canLand 返回 false
  - moon: 解锁后可着陆 + 单一占位限制
  - 多玩家交叉轨道/着陆

## 完成标准
- [ ] PlanetaryBoard 完整实现
- [ ] 着陆费用计算正确
- [ ] 首次奖励机制正确
- [ ] 月球解锁/占位逻辑正确
- [ ] 所有单测通过
