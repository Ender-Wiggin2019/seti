# Task 3-2: 基础卡牌实现 (~10 张代表卡)

## Title
实现约 10 张代表性基础卡牌，验证卡牌流水线端到端工作

## 描述
从基础卡牌集中选取约 10 张具有代表性的卡牌实现，覆盖所有卡牌类型和常见效果组合，确保 Card → Behavior → BehaviorExecutor → DeferredAction 的完整流水线正确工作。

## 功能说明

### 选取标准 (覆盖各类效果)
需覆盖以下效果类型至少各一张：
- 纯资源获取/消耗
- 抽卡效果
- 发射探针/入轨/着陆的附带效果
- 扫描增强效果
- 科技研究效果
- 生命痕迹标记
- 条件型任务 (IMissionCard)
- 触发型任务 (IMissionCard with triggers)
- 终局计分卡 (IEndGameScoringCard)
- 含自由行动角的卡

### 实现方式
- 每张卡一个文件 `CardXxx.ts` + `CardXxx.test.ts`
- 简单卡使用 Behavior DSL 声明
- 复杂卡覆写 `bespokePlay()` 返回 PlayerInput

### 涉及文件
```
packages/server/src/engine/cards/base/
├── CardXxx.ts        # × ~10
└── CardXxx.test.ts   # × ~10
```

## 技术实现方案

1. 从 `@ender-seti/common/data/baseCards` 中选取 ~10 张卡牌数据
2. 为每张卡创建服务端运行时 Card 实现
3. 简单效果用 `behavior` 字段声明
4. 复杂效果 (需要选择的) 覆写 `bespokePlay`
5. 注册到 CardRegistry
6. 集成测试: 创建游戏 → 打出卡 → 验证状态变更

## 测试要求

每张卡至少覆盖：
- `canPlay`: 条件满足 / 不满足
- `play`: 效果正确执行 (资源变化、状态变化)
- 任务卡: 条件检查 / 触发机制
- 终局卡: VP 计算正确
- 集成测试: 完整打出流程 (从手牌 → 执行 → 去向)

## 完成标准
- [ ] ~10 张卡牌实现完成
- [ ] 覆盖所有主要效果类型
- [ ] 卡牌流水线端到端验证通过
- [ ] 所有单测通过
