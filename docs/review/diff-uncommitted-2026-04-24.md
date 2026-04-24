# Code Review: Uncommitted Staged Diff

**Date:** 2026-04-24
**Scope:** Current staged diff across client/common/server, focused on debug snapshot replay and alien reward changes.
**Reviewer:** AI Code Review Skill

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| Warning | 1 |
| Suggestion | 0 |

**Overall assessment:** The server-side replay fixes and Anomalies reward implementation are mostly coherent, with protocol/state changes placed in `common` and targeted tests passing. The staged diff is not ready to commit because the public reward union change breaks the client build.

## Critical Issues

### C-01: Client build breaks after expanding public alien reward types

**File:** `packages/client/src/features/board/AlienBoardView.tsx`
**Line(s):** 184-190
**Dimension:** Logic / Quality

`TPublicSlotReward` now includes `CREDIT`, `ENERGY`, `DATA`, and `CARD` in `packages/common/src/types/protocol/gameState.ts:198-205`, but the client renderer still only handles `VP` and `PUBLICITY`. Every other reward falls through to `r.effectId`, which exists only on `CUSTOM`.

Current code:

```tsx
function formatRewards(rewards: TPublicSlotReward[]): string {
  if (rewards.length === 0) return '';
  return rewards
    .map((r) => {
      if (r.type === 'VP') return `${r.amount}VP`;
      if (r.type === 'PUBLICITY') return `${r.amount}PR`;
      return r.effectId;
    })
    .join(', ');
}
```

Verification:

```text
pnpm --filter @seti/client run typecheck
src/features/board/AlienBoardView.tsx(190,16): error TS2339:
Property 'effectId' does not exist on type ... '{ type: "CREDIT"; amount: number; } | ...'
```

Expected behavior: client/common/server must stay in sync when shared protocol unions change. Handle all simple reward variants (`CREDIT`, `ENERGY`, `DATA`, `CARD`) before the `CUSTOM` fallback, preferably with an exhaustive switch so future reward types fail locally at compile time.

## Warnings

### W-01: Repository-local Codex config disables shared tooling hooks

**File:** `.codex/config.toml`
**Line(s):** 1-11
**Dimension:** Maintainability / Quality

The staged diff adds a repo-local `.codex/config.toml` that disables Skynet MCP servers and `codex_hooks`. If committed, this becomes project configuration for every checkout rather than a local machine override. That can silently disable measurement, automation, or review hooks for collaborators.

Suggested fix: keep this file unstaged/local unless the project intentionally wants these disabled globally, and document that decision in the commit or repo docs if it is intentional.

## Verification

| Check | Result |
|-------|--------|
| `pnpm --filter @seti/server run typecheck` | Passed |
| `pnpm --filter @ender-seti/common run typecheck` | Passed |
| `pnpm --filter @seti/client run typecheck` | Failed, see C-01 |
| `pnpm --filter @seti/server test -- __tests__/debug/debug.service.test.ts __tests__/debug/debugReplayPresets.test.ts __tests__/engine/alien/plugins/AnomaliesAlienPlugin.test.ts __tests__/engine/cards/alien/AnomaliesCards.test.ts __tests__/engine/cards/register/registerAlienCards.test.ts __tests__/engine/missions/MissionCondition.test.ts` | Passed: 50 tests |
| `pnpm --filter @seti/server run lint` | Passed |
| `pnpm --filter @seti/client run lint` | Passed |
| `pnpm --filter @ender-seti/common run lint` | Passed |
| `git diff --cached --check` | Passed |

## Checklist Summary

| Dimension | Pass | Fail | N/A |
|-----------|------|------|-----|
| Logic Correctness | 5 | 1 | 2 |
| Task Completion | 3 | 1 | 2 |
| Maintainability | 4 | 1 | 1 |
| Configurability | 2 | 0 | 4 |
| Code Quality | 5 | 1 | 0 |
