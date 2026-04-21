# EXERTIANS TDD 子计划

> 目标：实现 Exertians 的“隐藏牌 + 危险值 + 末尾惩罚”系统，确保其独立于常规手牌/任务/终局卡计分体系。

---

## 规则基线

- 规则来源（优先级）：`docs/arch/rule-faq.md` > Alien PDF > 现有代码。
- 关键语义：
  - 发现时发牌：每人 3 张，且每个 discovery marker 额外 +1 张；余牌移出游戏。
  - 发现当下可按 discovery marker 数量立即打出等量 Exertian 牌（面朝下）。
  - Exertian 卡不计手牌上限，且任何方式都不能弃掉。
  - Exertian 里程碑：领先者分数 +20 与 +40 两个阈值，跨越后可额外打隐藏牌。
  - 第二个里程碑额外打牌需 1 credit，付不起则不能延后。
  - 终局揭示：结算 Exertian 卡得分后，再按 danger 总量处罚。
  - 最大 danger 玩家（并列全罚）各扣 `floor(totalPoints/10)`。
  - Exertian 卡不是 mission，也不是金卡“任务/终局牌计数”对象。

---

## 现状审计

- 代码现状：暂无 `ExertiansAlienPlugin`。
- 现有主计划里已标记 Exertian 关键项仍推迟（手牌上限例外、发现后卡牌流）。
- 高风险点：
  - 终局计分时序（先加分再惩罚）容易写反。
  - 隐藏信息在回放/重连中的表示。

---

## 测试计划（RED -> GREEN）

### Phase A: 发现发牌与立即隐藏打牌

**文件:** `packages/server/__tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts`（新建）

```text
RED tests:
├── EXE-A1 onDiscover 每位玩家先拿 3 张 Exertian 卡
├── EXE-A2 每个 discovery marker 额外 +1 张（玩家间可不同）
├── EXE-A3 余牌不再进入可抽牌区（deck 被封存）
├── EXE-A4 发现时可立即打出 <= marker 数量的隐藏牌
└── EXE-A5 立即隐藏打牌不会暴露具体 danger/目标给其他玩家
```

### Phase B: 手牌与弃牌约束

**文件:**
- `packages/server/__tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts`
- `packages/server/__tests__/engine/actions/Pass.test.ts`（扩展）
- `packages/server/__tests__/engine/freeActions/FreeActionCorner.test.ts`（扩展）

```text
RED tests:
├── EXE-B1 Exertian 卡不计入回合末 hand limit 弃牌
├── EXE-B2 任意弃牌入口都拒绝 Exertian 卡（角落弃牌、手牌上限弃牌等）
├── EXE-B3 Exertian 卡不能被用于“弃牌换信号”等效果
└── EXE-B4 非 Exertian 卡的弃牌行为不受影响
```

### Phase C: 里程碑额外打牌

**文件:**
- `packages/server/__tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts`
- `packages/server/__tests__/engine/scoring/Milestone.test.ts`（扩展）

```text
RED tests:
├── EXE-C1 领先者+20 阈值被跨越时，触发一次额外隐藏打牌机会
├── EXE-C2 领先者+40 阈值被跨越时，额外打牌需支付 1 credit
├── EXE-C3 +40 阈值付不起 1 credit -> 该机会直接失效，不可挂起
├── EXE-C4 同回合大幅加分跨越多个阈值，按顺序逐一触发
└── EXE-C5 里程碑触发只能发生一次，不能重复刷同阈值
```

### Phase D: 终局揭示、计分与惩罚

**文件:**
- `packages/server/__tests__/engine/scoring/FinalScoring.test.ts`（扩展）
- `packages/server/__tests__/engine/alien/plugins/ExertiansAlienPlugin.test.ts`

```text
RED tests:
├── EXE-D1 终局揭示所有隐藏 Exertian 卡并结算各自一次性得分
├── EXE-D2 单卡条件即使超额满足，也只记一次印刷分
├── EXE-D3 danger 总量=隐藏牌 danger + 物种板 danger 标记
├── EXE-D4 danger 最高者（并列全体）各扣 floor(totalPoints/10)
├── EXE-D5 惩罚时序在所有正向计分之后执行
└── EXE-D6 Exertian 卡不计入 gold tile 对 mission/endgame-card 的统计
```

---

## 实现注意点（配合 TDD）

- 隐藏牌实体建议包含“公开元信息 + 私有结算字段”，避免测试读取实现细节。
- Exertian 相关卡牌池与状态机字段若可复用，应放 `common`（枚举、事件类型、数据 schema）。
- 终局惩罚建议输出分项明细（`exertianCardScore`, `dangerPenalty`），便于前后端一致展示。

---

## 完成标准

- EXE-A/B/C/D 全绿。
- `pnpm --filter @seti/server test -- ExertiansAlienPlugin.test.ts` 与 `FinalScoring.test.ts` 通过。
- 不破坏既有 `GoldScoringTile.test.ts` 的计分定义。
