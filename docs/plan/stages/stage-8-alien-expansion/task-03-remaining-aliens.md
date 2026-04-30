# Task 8-3: 剩余 Alien 实现

## Title
实现剩余 4 个外星种族 (Anomalies, Exertians, Mascamites, Oumuamua)

## 描述
在 plugin 系统验证通过后，逐一实现剩余 4 个外星种族。每个种族作为独立模块，包含种族规则、特有卡牌和面板状态。各种族间无依赖，可并行开发。

## 功能说明

### 4 个种族 (各自独立)

**Anomalies:**
- 种族特定机制和奖励
- 特有卡牌集

**Exertians:**
- 种族特定机制和奖励
- 特有卡牌集

**Mascamites:**
- 种族特定机制和奖励
- 特有卡牌集

**Oumuamua:**
- 种族特定机制和奖励
- 特有卡牌集

### 涉及文件
```
packages/server/src/engine/alien/
├── Anomalies.ts     + test
├── Exertians.ts     + test
├── Mascamites.ts    + test
└── Oumuamua.ts      + test

packages/server/src/engine/cards/alien/
├── anomalies/       # 种族卡牌
├── exertians/
├── mascamites/
└── oumuamua/
```

## 技术实现方案

1. 每个种族复制 Centaurians 模式实现 IAlienModule
2. 根据种族规则表实现各 hook (onDiscover, onTraceMark, onRoundEnd, onGameEndScoring)
3. 实现种族特有卡牌
4. 注册到 AlienRegistry + CardRegistry
5. **可并行**: 4 个种族互不依赖，可分配给不同开发者

## 测试要求

每个种族需要:
- 单元测试: 各 hook 行为正确
- 种族卡牌测试: canPlay / play / VP 计算
- 集成测试: 完整发现 + 种族效果生命周期
- 混合测试: 2 个种族同时在场

## 完成标准
- [ ] 4 个种族全部实现
- [ ] 所有种族注册到 registry
- [ ] 混合测试 (2 种族共存) 通过
- [ ] 所有单测通过
