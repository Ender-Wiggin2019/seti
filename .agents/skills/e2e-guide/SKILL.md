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

