# SETI 规则实现核对（基于 `Game.ts`）

更新时间：2026-03-31  
核对范围：

- 规则来源：`docs/arch/prd-rule.md`
- 代码主入口：`packages/server/src/engine/Game.ts`
- 辅助核实：`GameSetup.ts`、`actions/*.ts`、`freeActions/processFreeAction.ts`、`deferred/Priority.ts`

> 说明：本文件重点评估"`Game.ts` 作为规则编排入口"的完成度，而不是逐行审计所有 effect/子模块内部实现。

---

## 总体结论

- 当前引擎骨架（回合阶段、延迟队列、里程碑/发现结算、轮末/终局）已经具备，属于 **可运行的规则框架**。
- ✅ 全部 8 个主行动已在 `Game.enqueueMainActionPipeline()` 中接入。
- ✅ 全部 8 个主行动已在 `Game.assertMainActionIsLegal()` 中校验。
- ✅ `PASS` 已从 simplified 模式迁移为标准 `PlayerInput` 交互流。
- ✅ 自动化集成测试已补齐（`GameIntegration.test.ts`，48 cases）。
- ✅ 子模块单测补齐：AlienState/AlienBoard（30 cases）、SectorFulfillmentEffect（11 cases）、processFreeAction 全 7 类派发（8 cases）。
- 从"对局规则完整性"看，当前版本的 **核心规则闭环已完成**，子模块测试已覆盖 alien/sector/freeAction 三大子系统。

---

## 完成度摘要（按规则域）

| 规则域 | 结论 | 估计完成度 | 备注 |
| --- | --- | ---: | --- |
| Setup（第 5 章） | 大体已实现 | 85% | 棋盘/牌库/外星人/计分砖/中立里程碑/初始资源均有落地 |
| Turn/Phase（第 6 章） | 已实现核心骨架 | 80% | 阶段迁移与轮转清晰，含轮末与终局入口 |
| Main Actions（第 7 章） | ✅ **已全部接入** | **100%（8/8 接入）** | 全部 8 个主行动均已在 Game.ts 中接入并校验 |
| Free Actions（第 8 章） | ✅ 入口齐全 + 全派发测试 | **90%** | `processFreeAction` 覆盖 7 类自由行动，全部 7 类派发已有单测 |
| Rotation（第 9 章） | ✅ 已完整接入 | 90% | 首次 Pass 旋转 + Research 旋转均已在主流程中生效 |
| Milestone/Discovery（第 10/11 章） | ✅ 已接入 + 单测覆盖 | **85%** | between-turn 顺序正确；AlienState 溢出/发现/中立标记已有 30 条单测 |
| Scoring（第 12 章） | ✅ 终局 + 扇区结算已覆盖 | **85%** | 轮末收入 + FinalScoring + SectorFulfillmentEffect 单测（11 cases） |
| Determinism/Event Queue（第 13/14 章） | 已具备 | 85% | seed + eventLog + priority 队列模型明确 |
| Validation Matrix（第 16 章） | ✅ **已全部校验** | 95% | 全部 8 个主行动均有 canExecute 校验 + 错误上下文 |

---

## 关键缺漏与风险（按严重度）

## P0（必须先补）—— ✅ 已全部解决

- ~~主行动接入缺失（4 个）~~ → ✅ 全部 8 个主行动已接入 `Game.enqueueMainActionPipeline()`。
- ~~主行动合法性校验覆盖不足~~ → ✅ 全部 8 个主行动已在 `assertMainActionIsLegal()` 中校验。

## P1（高优先）—— ✅ 已全部解决

- ~~`PASS` 当前为简化版本~~ → ✅ 已迁移为标准 `PlayerInput` 交互流（弃牌、首次旋转、轮末牌选择）。
- ~~研究行动触发旋转规则未在主流程体现~~ → ✅ `ResearchTechAction` 已被 `Game.ts` 调用，旋转在主流程中生效。

## P2（中优先）—— ✅ 已解决

- ~~规则完整度验证仍依赖子模块~~ → ✅ 已补齐自动化集成测试（`GameIntegration.test.ts`，48 cases），覆盖 8 主行动合法/非法边界、旋转、里程碑时序、终局计分与平局。

## P3（子模块单测）—— ✅ 已补齐

- ~~AlienBoard/AlienState 无独立单测~~ → ✅ `AlienState.test.ts`（30 cases）：溢出 VP、发现条件、中立标记、trace 计数、可用目标过滤。
- ~~SectorFulfillmentEffect 仅有最小覆盖~~ → ✅ `SectorFulfillmentEffect.test.ts`（11 cases）：多扇区同时结算、参与者 publicity、首次/重复胜利奖励、trace + VP 复合奖励、扇区重置。
- ~~processFreeAction 仅测试 2/7 类派发~~ → ✅ `processFreeActionDispatch.test.ts`（8 cases）：全 7 类自由行动派发 + 未知类型抛错。

---

## 已有实现亮点（`Game.ts` 角度）

- 阶段机清晰：`AWAIT_MAIN_ACTION -> IN_RESOLUTION -> BETWEEN_TURNS -> ...`
- Deferred pipeline 结构与 PRD 推荐队列高度一致（cost/core/immediate/deferred/handoff）。
- between-turn 顺序正确接入：milestone -> discovery -> handoff。
- round-end 生命周期完整：收入结算、起始位轮转、回合推进、round5 后终局计分。
- 具备可追溯能力：seeded RNG + event log。

---

## 建议补齐顺序（最小可用路径）

1. ✅ 在 `Game.enqueueMainActionPipeline()` 接入：
   - `LaunchProbeAction.execute`
   - `ScanAction.execute`
   - `AnalyzeDataAction.execute`
   - `ResearchTechAction.execute`
2. ✅ 在 `Game.assertMainActionIsLegal()` 补齐上述 4 个 action 的 `canExecute` 校验与错误上下文。
3. ✅ 将 `PASS` 从 simplified 参数模式迁移为标准 `PlayerInput` 交互流（弃牌、轮末牌选择）。
4. ✅ 按 `prd-rule.md` 第 18 章补自动化用例（`GameIntegration.test.ts`，48 cases）：
   - ✅ 8 主行动合法/非法边界（phase 守卫、turn 守卫、各 action 资源/前置条件校验）
   - ✅ research 与 first-pass 旋转（独立性、跨 round 重置）
   - ✅ 里程碑与发现时序（between-turn pipeline 顺序、gold/neutral milestone 触发）
   - ✅ 终局计分与平局（breakdown、player.score 更新、GAME_END 事件、共同胜利）

---

## 结论（是否"实现充分"）

基于本次核对，当前 `Game.ts` 对 PRD 的实现 **已充分**：  
全部 8 个主行动已接入引擎编排骨架，合法性校验覆盖完整，`PASS` 已迁移为标准交互流。  
自动化测试共计 **97 条**：集成测试 48 条 + AlienState 30 条 + SectorFulfillment 11 条 + FreeAction 派发 8 条。  
PRD §18 QA 清单全部条目已有对应测试覆盖。剩余工作为 Stage 8 Alien 扩展。
