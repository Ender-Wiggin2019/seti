# CENTAURIANS TDD 子计划

> 目标：实现并验证“消息里程碑 + 延迟结算”的核心玩法，确保白色即时效果与绿色延迟效果在正确时机执行。

---

## 规则基线

- 规则来源（优先级）：`docs/arch/rule-faq.md` > Alien PDF > 现有代码。
- 关键语义：
  - 发现时，每位玩家放置个人 message milestone 到当前分数 +15。
  - Centaurian 卡用能量支付（不是信用）。
  - 打牌时：立刻结算白色效果；卡牌进入 pending 队列，达到 milestone 后结算绿色效果。
  - 多张 pending message 按发送顺序（FIFO）结算。
  - 触发 message milestone 时，可从物种板选一个可用奖励并覆盖（一次性市场）。
  - 特定位需要从 data pool 支付（不能用 computer data）。
  - 顶部可重复位每次都要支付 1 data。
  - Centaurian 卡不是 mission。

---

## 现状审计

- 代码现状：`packages/server/src/engine/alien/plugins/` 里暂无 `CentauriansAlienPlugin`。
- 测试现状：暂无 Centaurians 专项测试文件。
- 风险点：
  - 与全局里程碑窗口（BETWEEN_TURNS）时序冲突。
  - pending 队列的顺序、跨回合持久化、重入执行。

---

## 测试计划（RED -> GREEN）

### Phase A: 发现与初始注入

**文件:** `packages/server/__tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts`（新建）

```text
RED tests:
├── CEN-A1 onDiscover 为每位玩家创建 message milestone=当前分数+15
├── CEN-A2 onDiscover 后玩家间 milestone 独立，不共享位置
├── CEN-A3 发现标记者获得对应 discovery 奖励，不影响消息里程碑初始化
└── CEN-A4 未发现状态下不创建任何 message 结构
```

### Phase B: 打牌与延迟队列

**文件:**
- `packages/server/__tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts`
- `packages/server/__tests__/engine/actions/PlayCard.test.ts`（扩展）

```text
RED tests:
├── CEN-B1 打 Centaurian 卡扣能量，不扣信用
├── CEN-B2 打牌立刻执行白色效果，并注册 pending green 效果
├── CEN-B3 同回合连打两张，pending 队列按打出顺序 FIFO
├── CEN-B4 达到里程碑时只触发队首 green 效果，再进入下一个 pending
├── CEN-B5 分数跨越里程碑（一次加多分）仍只触发到达的那一批
└── CEN-B6 Centaurian 卡不会进入 mission 流程与 COMPLETE_MISSION 自由行动
```

### Phase C: 物种板奖励市场与 data 支付

**文件:** `packages/server/__tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts`

```text
RED tests:
├── CEN-C1 触发 message milestone 时，可选并覆盖 1 个可用奖励位
├── CEN-C2 已被覆盖的奖励位不可再次选择
├── CEN-C3 需 data 成本的位，只能消耗 data pool（computer data 不可用）
├── CEN-C4 data 不足时该位不可选，流程不崩溃
├── CEN-C5 顶部可重复位可多次选取，每次消耗 1 data
└── CEN-C6 选位奖励结算后写事件日志，便于回放
```

### Phase D: 时序与错误路径

**文件:**
- `packages/server/__tests__/engine/scoring/Milestone.test.ts`（扩展）
- `packages/server/__tests__/engine/alien/plugins/CentauriansAlienPlugin.test.ts`

```text
RED tests:
├── CEN-D1 message milestone 在 BETWEEN_TURNS 结算，不允许插入自由行动
├── CEN-D2 非当前玩家不能消费他人的 pending message
├── CEN-D3 pending 队列为空时到达 milestone 不产生额外效果
└── CEN-D4 game over 后不再触发新的 message 结算
```

---

## 实现注意点（配合 TDD）

- `message milestone`、pending 队列状态建议放 `server` 运行态；若有共享枚举/卡牌元数据，放 `common`。
- 建议新增专用事件：`CENTAURIAN_MESSAGE_QUEUED`、`CENTAURIAN_MESSAGE_RESOLVED`、`CENTAURIAN_REWARD_CLAIMED`。
- 保持与现有 milestone 队列统一入口，避免双轨时序。

---

## 完成标准

- CEN-A/B/C/D 全绿。
- `pnpm --filter @seti/server test -- CentauriansAlienPlugin.test.ts` 通过。
- 与 `Milestone.test.ts`、`PlayCard.test.ts` 回归一致。
