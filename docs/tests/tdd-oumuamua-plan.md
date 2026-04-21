# OUMUAMUA TDD 子计划

> 目标：实现 Oumuamua 特殊 tile 与 exofossil 经济，并验证“扇区信号 vs tile 信号”的双路选择与可重复完成循环。

---

## 规则基线

- 规则来源（优先级）：`docs/arch/rule-faq.md` > Alien PDF > 现有代码。
- 关键语义：
  - setup：在指定 disc-3 空间放 Oumuamua tile；若已有 probe 在该位，玩家立即 +1 publicity。
  - Oumuamua tile data slot 初始放 3 data；同时准备 exofossil token 供应。
  - exofossil 是独立货币：不可用常规兑换动作交易；残局剩余 exofossil 计 0 分。
  - 标记 Oumuamua 扇区信号时可二选一：标普通 sector 或标 Oumuamua tile。
  - Oumuamua tile 的第 1 / 第 3 次标记给对应奖励。
  - 当取走 tile 最后一个 data 时视为完成：每个标记者得 1 exofossil；无赢家判定；随后 data 补满并清空标记，可再次循环。
  - Oumuamua 视为 planet：可被 planet 相关效果引用，访问得声望，可 orbit/land。

---

## 现状审计

- 代码现状：暂无 `OumuamuaAlienPlugin`。
- 测试现状：暂无 Oumuamua 专项测试。
- 风险点：
  - Oumuamua 完成流程与普通 sector 完成流程不同，容易误用 `ResolveSectorCompletion`。
  - exofossil 作为新货币的消费来源与禁止兑换约束易遗漏。

---

## 测试计划（RED -> GREEN）

### Phase A: setup 与 tile 初始化

**文件:** `packages/server/__tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts`（新建）

```text
RED tests:
├── OUM-A1 onDiscover 在指定 disc-3 空间生成 Oumuamua tile
├── OUM-A2 若该格已有 probe，占位玩家立即 +1 publicity
├── OUM-A3 tile data slot 初始 data=3
└── OUM-A4 exofossil 供应池初始化并可追踪消耗/剩余
```

### Phase B: 信号双路选择与 tile 标记奖励

**文件:**
- `packages/server/__tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts`
- `packages/server/__tests__/engine/actions/Scan.test.ts`（扩展）

```text
RED tests:
├── OUM-B1 标记 Oumuamua 扇区时弹出“sector / tile”二选一输入
├── OUM-B2 选择 sector 路径时，走普通 sector 标记与结算
├── OUM-B3 选择 tile 路径时，tile data 减 1，玩家标记写入 tile
├── OUM-B4 tile 第 1 次标记奖励正确
├── OUM-B5 tile 第 3 次标记奖励正确
└── OUM-B6 icon 指定可标 Oumuamua 时也复用同一二选一流程
```

### Phase C: tile 完成循环（非 sector 胜负）

**文件:** `packages/server/__tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts`

```text
RED tests:
├── OUM-C1 取走 tile 最后 data 时触发 Oumuamua completion
├── OUM-C2 completion 时每个 marker owner +1 exofossil
├── OUM-C3 completion 不产生 winner/second-place，也不写 sectorWinners
├── OUM-C4 completion 后 tile data 重置为满、markers 清空
└── OUM-C5 tile 可在同局再次被完成并重复结算
```

### Phase D: exofossil 经济与 planet 语义

**文件:**
- `packages/server/__tests__/engine/alien/plugins/OumuamuaAlienPlugin.test.ts`
- `packages/server/__tests__/engine/freeActions/ExchangeResources.test.ts`（扩展）
- `packages/server/__tests__/engine/scoring/FinalScoring.test.ts`（扩展）

```text
RED tests:
├── OUM-D1 需要 exofossil 的位仅能用 exofossil 支付，不可用其他资源替代
├── OUM-D2 exofossil 不能通过 ExchangeResources 进行兑换
├── OUM-D3 exofossil 不足时对应标记动作非法
├── OUM-D4 game end 时 leftover exofossil 贡献 0 分
├── OUM-D5 Oumuamua 被 planet 相关效果识别（visit/orbit/land）
└── OUM-D6 访问 Oumuamua 获得 publicity
```

---

## 实现注意点（配合 TDD）

- Oumuamua tile 建议独立于 `Sector` 结构，避免误入扇区多数结算。
- exofossil 字段与协议枚举应放 `common`，确保 client/server 序列化一致。
- 双路输入建议复用现有 `SelectOption` 管线，保持 Scan 行为一致性。

---

## 完成标准

- OUM-A/B/C/D 全绿。
- `pnpm --filter @seti/server test -- OumuamuaAlienPlugin.test.ts` 通过。
- 与 `Scan.test.ts`、`ResolveSectorCompletion.test.ts`、`FinalScoring.test.ts` 无冲突。
