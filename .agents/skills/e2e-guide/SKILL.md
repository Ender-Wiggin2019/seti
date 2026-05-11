---
name: e2e-guide
description: Build and refactor Playwright end-to-end tests for SETI using only real user flows and real backend behavior. Use when creating or fixing E2E cases for auth, lobby, room, and game interaction, especially when replacing shortcut tests (token injection, debug endpoints, direct WS driving) with production-like browser paths.
---

# E2E Guide (No Mock, No Bypass)

Implement E2E as a real user journey. Do not simulate server behavior, do not inject auth state, and do not use debug-only control surfaces.

## Hard Rules

1. Never mock network or websocket behavior.
2. Never inject auth state into localStorage/sessionStorage.
3. Never call debug endpoints (`/debug/*`) from E2E specs.
4. Never drive gameplay by sending raw websocket actions from tests when a real UI action exists.
5. If a step fails, keep the failure visible. Do not replace the step with a shortcut.

## Coverage Discipline

1. Passing related unit tests or broad E2E smoke tests is not proof that a reported behavior is covered.
2. For every bug fix or regression report, first write or identify an assertion that fails on the old behavior and passes after the fix.
3. Do not count login/lobby/start-game/panel-visible smoke tests as coverage for specific card semantics, rendering modes, or conditional UI sections.
4. For UI mode regressions, enumerate the relevant matrix before asserting:
   - viewer/actor perspective, such as human player vs synthetic rival
   - rendering mode, such as text mode vs image mode
   - action/card kind, such as scan, probe, tech, or mission
   - expected visible outcome
5. When server/common data drives card, objective, reward, rule, or action rendering, verify both text mode and image mode unless the feature is explicitly single-mode.
6. In text mode, assert that visible labels/effects are derived from the same server/common ID and definition being displayed. In image mode, assert that the rendered asset path, alt text, or test id is derived from that same server-projected ID.
7. If a smoke test cannot pin a specific ID without becoming brittle, assert consistency between the visible ID and the rendered text/image output. Put deterministic ID assertions in a focused deterministic spec.
8. For conditional UI hiding, assert both sides of the condition in the same test or suite: the section that should remain visible and the section that should be hidden.
9. For rule rewards, assert user-observable semantics, not only that the engine step completed. Example: an any-card reward should expose the allowed sources and the selected result should be visible in hand or the relevant row.
10. Before marking verification complete, ask: would this test fail if the reported bug still existed? If the answer is no, add a more specific assertion.

## Allowed Setup

1. Use Playwright `webServer` to start real client/server.
2. Use unique test users and room names per test run.
3. Use helper functions for repeated UI actions (register/login/create/join/start), but helpers must still perform real UI interactions.
4. Use API-only tests in dedicated API spec blocks when the test target is explicitly API behavior.

## Required Test Structure

1. Readiness:
   - Wait for server readiness endpoint before workflow tests.
2. Auth:
   - Register by UI (`/auth` -> Register tab -> submit).
   - Login by UI (`/auth` -> login form -> submit).
3. Lobby/Room:
   - Create room from lobby UI dialog.
   - Join room using a second browser context via room UI.
   - Start game from room UI as host.
4. Game:
   - Enter game via room UI or redirect after start.
   - Interact through visible UI controls (`action-menu-*`, tabs, inputs).
   - Verify on another browser context that state changed.

## Assertion Guidance

1. Prefer observable user outcomes:
   - URL changes (`/auth`, `/lobby`, `/room/:id`, `/game/:id`)
   - Visible UI sections (`bottom-dashboard`, `bottom-actions`, `event-log`)
   - Action availability/disabled states.
2. Avoid asserting engine internals in smoke tests:
   - No hardcoded card IDs, probe coordinates, or deterministic internals.
3. For deterministic behavior tests:
   - Keep them separate from smoke tests and still avoid debug endpoints unless explicitly running a debug suite.

## Anti-Flake Guidance

1. Prefer event-driven waits:
   - `waitForResponse`, `waitForURL`, `expect(locator).toBeVisible()`.
2. Avoid fixed sleeps:
   - Do not use `waitForTimeout` unless there is no reliable observable signal.
3. Keep one test focused on one journey or behavior boundary.

## Refactor Checklist (Shortcut -> Real Flow)

1. Remove imports/usages of:
   - `injectAuth`
   - `createDebugSession`, `debugGetState`, `debugMainAction`, `debugFreeAction`, `debugInput`, `debugGetPendingInput`
   - direct `WsTestClient` action-driving for UI-covered behavior
2. Replace with:
   - UI register/login helpers
   - Multi-context host/guest room/game interactions
3. Keep failure explicit:
   - If UI cannot complete a step, assert and fail at that exact step.
