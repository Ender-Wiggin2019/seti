# Alien Board Config & Client Return Review - 2026-05-29

## Scope

- Reviewed core alien board configuration, server behavior, public state, and client input routing.
- Excluded Space Agency-specific behavior per request.

## Fixed Findings

1. Mascamites initial public sample was visible in `publicSamples` but not represented as a blue trace slot, so it could not be marked as required by the rule sheet. Fixed by creating `alien-{index}-mascamites-public-sample-{n}` blue trace slots from `publicSamples` during discovery initialization. Covered by `MAS-A2 exposes the initial public sample as a one-use blue trace slot`.

2. Mascamites delivered sample rewards used the simple reward executor, so `CARD_ANY` drew from deck instead of returning the row-or-deck choice input. Fixed by routing delivery rewards through `AlienState.executeRewards` and completing the mission after any pending reward input resolves. Covered by `MAS-D2 resolves CARD_ANY sample delivery through a row-or-deck choice before completing the mission`.

3. Client alien-tab auto-focus missed server option ids that do not start with `alien-{index}-`. Fixed by recognizing `mascamites-fixed-*` and `exertians-danger-*` option ids in both routing helper copies. Covered by `GameLayoutRouting` alien-board trace slot picker cases.

## Reviewed Non-Issues

- Alien board click payload remains compatible: client sends `{ inputId, type: OPTION, optionId: slotId }`, server `SelectOption` matches `option.id`.
- Mascamites capsule public state intentionally does not expose `sampleTokenId`; revealing it to every client would leak the hidden sample before delivery.

## Verification

- `pnpm --filter @seti/server exec vitest run __tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`
- `pnpm --filter @seti/server exec vitest run __tests__/engine/alien/AlienState.test.ts`
- `pnpm --filter @seti/server typecheck`
- `pnpm --filter @seti/client exec vitest run __tests__/pages/game/GameLayoutRouting.test.tsx`
- `pnpm --filter @seti/client exec vitest run __tests__/features/board/AlienBoardView.test.tsx`
- `pnpm --filter @seti/client typecheck`
- `pnpm exec biome check packages/server/src/engine/alien/plugins/MascamitesAlienPlugin.ts packages/server/__tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts packages/client/src/features/layout/sectionInputs.ts packages/client/__tests__/pages/game/GameLayoutRouting.test.tsx`
- `pnpm exec biome check --formatter-enabled=false --assist-enabled=false packages/client/src/pages/game/GameLayout.tsx`

## Remaining Risk

- Full-repo Biome formatting for `packages/client/src/pages/game/GameLayout.tsx` still reports pre-existing format/import-order drift outside this change; lint-only for the touched file passes.
