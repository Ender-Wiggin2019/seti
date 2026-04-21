# TODO

## 前端待办事项

### 卡牌效果错误提示 Toast（优先级：P2）

**背景：** 后端在遇到无效 behavior type（如未注册的 custom effect ID）时，采用容错策略：记录 `CARD_CUSTOM_EFFECT_UNHANDLED` 事件到 event log，但不阻塞游戏流程。

**需求：** 前端需监听该事件并展示 toast 提示用户，让玩家知道某个卡牌效果未生效。

**实现建议：**
```typescript
// 在 GameContext 或 event handler 中监听
game.eventLog.on('CARD_CUSTOM_EFFECT_UNHANDLED', (event) => {
  toast.warning(
    `卡牌效果 "${event.data.customId}" 暂未实现（卡牌ID: ${event.data.cardId}）`
  );
});
```

**相关文档：**
- 后端实现：`packages/server/src/engine/cards/BehaviorExecutor.ts` 第 407-416 行
- 决策记录：`docs/tests/tdd-plan.md` Phase 2.9.6

---

## E2E

- [x] Fix stale game-state sync after `LAUNCH_PROBE` in `packages/e2e/tests/smoke-probe-scan.spec.ts`.
  Resolved on 2026-04-17:
  The client websocket layer now retains `game:state` / `game:waiting` /
  `game:event` / `game:error` subscriptions independently from the current
  socket instance and automatically rebinds them when the socket connects late
  or gets replaced.
  Regression coverage:
  `packages/client/__tests__/api/wsClient.test.ts`
  Verification:
  `pnpm --filter @seti/client exec vitest run __tests__/api/wsClient.test.ts`
  `pnpm typecheck` in `packages/client`
  `pnpm exec biome check src/api/wsClient.ts __tests__/api/wsClient.test.ts`
  `pnpm exec playwright test tests/smoke-probe-scan.spec.ts --project=chromium`
