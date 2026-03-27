# Code Review: Client Package

**Date:** 2026-03-27
**Scope:** Full review of `packages/client` (`src/`, tests, and key configs)
**Reviewer:** OpenCode (GPT-5.3 Codex)

## Summary

| Severity | Count |
|----------|-------|
| High     | 2     |
| Medium   | 4     |
| Low      | 2     |

**Overall assessment:** The UI architecture is generally clear and test coverage breadth is good, but there are two high-impact correctness issues: (1) free action dispatch in game layout is incomplete, and (2) auth persistence is not resilient to non-standard storage environments and is already causing test failures. There are also socket lifecycle risks and input-state reset edge cases that can cause inconsistent runtime behavior.

---

## High

### H-01: Free action bar buttons are visible but mostly non-functional in `GameLayout`

**File:** `packages/client/src/pages/game/GameLayout.tsx`  
**Lines:** 299, 388

`FreeActionBar` exposes actions such as `MOVEMENT` and `COMPLETE_MISSION`, but `handleFreeActionClick` only handles `EFreeAction.BUY_CARD`. For other enabled buttons, no request is emitted.

**Risk:** Users can click enabled free actions and nothing happens (silent action drop).

**Repro:** Enter a playable turn state with available free actions, click `Move Probe` or `Complete Mission` in the free action bar; no `sendFreeAction` call is sent.

---

### H-02: Auth store persistence crashes when storage implementation is unavailable/incompatible

**File:** `packages/client/src/stores/authStore.ts`  
**Line:** 24

`persist(...)` assumes a fully compatible storage implementation. In current environment/tests this results in runtime error `storage.setItem is not a function` when auth state mutates.

**Risk:** Login/logout paths can crash in certain runtime contexts; currently breaks tests.

**Observed failure:** `__tests__/stores/authStore.test.ts` and `__tests__/components/ProtectedRoute.test.tsx` fail with `storage.setItem is not a function`.

---

## Medium

### M-01: WebSocket listener cleanup removes all listeners, not just subscriber-local handlers

**Files:**
- `packages/client/src/api/wsClient.ts` (registration wrappers at lines 61, 73)
- `packages/client/src/hooks/useGameState.ts` (line 17)
- `packages/client/src/hooks/useGameEvents.ts` (line 20)
- `packages/client/src/hooks/useGameError.ts` (line 18)
- `packages/client/src/hooks/usePlayerInput.ts` (line 25)

Hooks call `offX()` without passing the concrete callback, while `onX()` often wraps callbacks before registering. This can remove all listeners for the event and break sibling subscribers.

**Risk:** One component unmount can accidentally stop updates for other mounted consumers.

---

### M-02: Socket singleton is disconnected unconditionally from `useSocket` cleanup

**File:** `packages/client/src/hooks/useSocket.ts`  
**Line:** 33

`wsClient.disconnect()` is always called on hook cleanup, even though the client is singleton-scoped.

**Risk:** If multiple consumers are introduced, unmounting one consumer tears down connection for all.

---

### M-03: Input components keep stale local state when server pushes a new input model

**Files:**
- `packages/client/src/features/input/SelectCardInput.tsx` (line 16)
- `packages/client/src/features/input/SelectGoldTileInput.tsx` (line 19)
- `packages/client/src/features/input/AndOptionsInput.tsx` (line 20)

Selection/step state is not reset on model identity changes (`inputId` or option set changes).

**Risk:** Old selections may leak into new prompts and produce invalid or unintended submissions.

---

### M-04: Global 401 interceptor forces logout/redirect for all 401 responses

**File:** `packages/client/src/api/httpClient.ts`  
**Lines:** 22-25

Any 401 triggers global logout and hard redirect to `/auth`, including endpoints where local handling is expected (for example failed login flows).

**Risk:** Unexpected navigation side effects and reduced ability for page-level UX to handle auth errors gracefully.

---

## Low

### L-01: Profile update invalidates query but does not synchronize auth store user snapshot

**Files:**
- `packages/client/src/hooks/useAuth.ts` (line 57)
- `packages/client/src/components/layout/AppShell.tsx` (line 11)

Top nav reads `useAuthStore.user?.name`, but profile update only invalidates query data. Depending on timing and view path, displayed username may remain stale.

---

### L-02: Token is persisted in localStorage-backed store

**File:** `packages/client/src/stores/authStore.ts` (persist config)

This is a standard approach but carries known XSS token-exfiltration risk.

**Risk:** Security posture depends heavily on strict XSS prevention.

---

## Test and Validation Notes

- Ran `npm test` in `packages/client`.
- Result: **38 test files total, 2 failed; 103 tests total, 3 failed**.
- Failed tests are consistent with H-02 (auth store persistence crash):
  - `__tests__/stores/authStore.test.ts`
  - `__tests__/components/ProtectedRoute.test.tsx`

---

## Suggested Missing Tests

1. `GameLayout` integration test that verifies free-action bar clicks dispatch correct `sendFreeAction` payloads for non-`BUY_CARD` actions.
2. Multi-subscriber socket tests ensuring unmount of one hook consumer does not remove listeners for others.
3. Input model reset tests for `SelectCardInput`, `SelectGoldTileInput`, and `AndOptionsInput` when `model.inputId` changes.
4. Auth store resilience tests with unavailable/throwing storage implementation.
