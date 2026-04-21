# MASCAMITES TDD 子计划

> 目标：实现“样本 token -> capsule -> 交付 -> 蓝色扩展位”的完整闭环，并验证 capsule 与 probe 的相似/差异规则。

---

## 规则基线

- 规则来源（优先级）：`docs/arch/rule-faq.md` > Alien PDF > 现有代码。
- 关键语义：
  - setup：Jupiter 3 个样本、Saturn 3 个样本，剩余 1 个放到物种板公开位。
  - 仅当卡牌效果允许时才能取样；可查看该星球所有样本并选 1，其他放回。
  - 就算该星球样本已空，相关行动/卡牌本身仍可执行（只是拿不到样本）。
  - 玩家在样本上叠标记形成 capsule；有多 capsule 合法。
  - 任何“可移动 probe”的机会都可改为移动 capsule。
  - capsule 经过声望图标会得声望，离开小行星格有额外移动代价。
  - capsule 计作 probe 供部分卡/科技引用，但不能 orbit/land，且不计 probe limit。
  - 到达任务目的地后可自由行动交付：移除 capsule，翻开 token，拿奖励，卡牌作为已完成任务保留。
  - 被交付的样本 token 放到 Mascamites 板扩展蓝位，之后任何玩家可按普通蓝位标记并拿 token 奖励。

---

## 现状审计

- 代码现状：暂无 `MascamitesAlienPlugin`。
- 测试现状：暂无 Mascamites 专项测试。
- 风险点：
  - capsule 路径复用移动系统时，容易误计入 probe 上限/轨道着陆规则。
  - token 从“行星池 -> capsule -> 扩展蓝位”的生命周期容易重复发奖。

---

## 测试计划（RED -> GREEN）

### Phase A: setup 与样本池

**文件:** `packages/server/__tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`（新建）

```text
RED tests:
├── MAS-A1 onDiscover 初始化 Jupiter/Saturn 各 3 样本，物种板 1 公共样本
├── MAS-A2 样本 token 总量守恒（行星池+公共位+玩家持有+已交付）
├── MAS-A3 行星样本为空时，相关卡主效果仍能执行（仅取样步骤跳过）
└── MAS-A4 取样时是“可见集合中选 1”而非盲抽随机
```

### Phase B: capsule 生成与移动

**文件:**
- `packages/server/__tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`
- `packages/server/__tests__/engine/freeActions/Movement.test.ts`（扩展）

```text
RED tests:
├── MAS-B1 取样后生成 capsule，初始位置=样本来源星球
├── MAS-B2 MOVE 机会可选择移动 capsule 而非 probe
├── MAS-B3 capsule 经过声望图标立即 +publicity
├── MAS-B4 capsule 离开小行星格额外消耗 1 移动点
├── MAS-B5 同玩家可同时拥有多个 capsule，分别移动
└── MAS-B6 capsule 可被“引用 probe 的卡/科技效果”识别
```

### Phase C: capsule 与 probe 的边界差异

**文件:**
- `packages/server/__tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`
- `packages/server/__tests__/engine/actions/Orbit.test.ts`（扩展）
- `packages/server/__tests__/engine/actions/Land.test.ts`（扩展）

```text
RED tests:
├── MAS-C1 capsule 不能执行 ORBIT
├── MAS-C2 capsule 不能执行 LAND
├── MAS-C3 capsule 不计入 probesInSpace / probeLimit 上限
└── MAS-C4 capsule 与 probe 共存时，不互相覆盖状态
```

### Phase D: 交付与扩展蓝位

**文件:**
- `packages/server/__tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`
- `packages/server/__tests__/engine/freeActions/CompleteMission.test.ts`（必要时扩展）

```text
RED tests:
├── MAS-D1 capsule 到达目标后可触发 free action: DELIVER_SAMPLE
├── MAS-D2 交付结算：移除 capsule、翻 token、发放 token 奖励、任务记完成
├── MAS-D3 每个样本 token 仅发奖一次（防重入）
├── MAS-D4 已交付 token 进入物种板蓝位，任何玩家可标记
├── MAS-D5 标记扩展蓝位时获得该 token 奖励
└── MAS-D6 扩展蓝位占用后不可重复标记
```

---

## 实现注意点（配合 TDD）

- 样本 token/奖励定义应放 `common`，便于客户端渲染与服务端结算一致。
- capsule 可实现为独立实体（不要硬塞进 probe 列表），避免污染现有 orbit/land 逻辑。
- 交付 free action 需要与 mission tracker 协调，避免“同卡既主行动又交付”冲突。

---

## 完成标准

- MAS-A/B/C/D 全绿。
- `pnpm --filter @seti/server test -- MascamitesAlienPlugin.test.ts` 通过。
- 与 `Movement.test.ts` / `Orbit.test.ts` / `Land.test.ts` 的既有规则无回归。
