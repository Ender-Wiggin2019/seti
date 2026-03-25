# Task 8-2: 首个 Alien 实现 (Centaurians) + 验证

## Title
实现 Centaurians 种族模块，验证整个 alien plugin 系统

## 描述
实现第一个完整的外星种族 (Centaurians) 作为插件系统的验证。包含种族特定的 onDiscover / onTraceMark / onGameEndScoring 实现，以及种族特有卡牌。

## 功能说明

### Centaurians Module
- `onDiscover`: 揭示面板, 初始化种族特定状态, 发现者奖励
- `onTraceMark`: 种族特定的痕迹奖励
- `onGameEndScoring`: 种族特定的终局计分公式
- `getAlienCards()`: 返回 Centaurians 特有卡牌
- `getAlienBoardState()`: 种族面板数据

### 种族特有卡牌
- 从 `@ender-seti/common/data/alienCards` 获取数据
- 服务端 Card 子类实现

### 集成验证
- 完整流程: 游戏 → 放置痕迹 → 发现 → 加载模块 → 种族效果 → 终局计分
- 验证 plugin 系统的扩展性

### 涉及文件
```
packages/server/src/engine/alien/
├── Centaurians.ts
└── Centaurians.test.ts

packages/server/src/engine/cards/alien/
├── centaurian/
│   ├── CentaurianCardXxx.ts
│   └── CentaurianCardXxx.test.ts
```

## 技术实现方案

1. 实现 Centaurians class implements IAlienModule
2. 实现种族特有卡牌 (继承 Card + AlienCard)
3. 注册到 AlienRegistry 和 CardRegistry
4. 编写集成测试: 完整发现流程

## 测试要求
- `Centaurians.test.ts`:
  - onDiscover 初始化正确
  - onTraceMark 奖励正确
  - onGameEndScoring 计分公式正确
  - 种族卡牌注册和创建
- **集成测试**: 完整 alien 生命周期
  - 创建游戏 (选中 Centaurians)
  - 放置 3 个痕迹 → 触发发现
  - 验证发现后状态变更
  - 继续游戏 → 种族效果生效
  - 终局 → 种族计分

## 完成标准
- [ ] Centaurians module 实现完整
- [ ] 种族卡牌实现
- [ ] 集成测试验证完整生命周期
- [ ] Plugin 系统扩展性得到验证
- [ ] 所有单测通过
