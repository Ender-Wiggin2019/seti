# Current Diff Code Review - Moon Identity

Date: 2026-05-13

Scope:
- Current working tree moon landing changes across common config/rules, server board/action/effect/persistence paths, and client planet-board selection.

Findings:
- Fixed: `moonIndex` was being used as protocol and persisted identity for moon occupants. That made a moon's identity depend on array order and let invalid/legacy action payloads silently resolve to the next open moon.
- Fixed: Card-driven land selection exposed only one `land-{planet}-moon` option per planet, so Jupiter/Saturn moon rewards could not be chosen precisely from card effects.
- Fixed: Legacy snapshot compatibility needed to move to the deserializer boundary after runtime/public state stopped using index identity.

Fix Summary:
- Added stable `moonIds` to shared planetary-board config and alignment coverage for ids/names/rewards/slots.
- Changed runtime/public moon occupants to `{ playerId, moonId }`.
- Changed main LAND payload propagation to use `moonId`; `moonIndex` action payloads now throw a validation error.
- Updated main-action UI, text-mode moon blocks, image-mode hotspots, card-contained land selection, Mascamites land-then-pickup, and Sample Return moon option ids to use stable ids.
- Kept legacy `moonOccupant` and `moonOccupants[].moonIndex` readable only in `GameDeserializer`.

Verified:
- `pnpm --filter @ender-seti/common exec vitest run __tests__/constant/planetBoardRewards.test.ts __tests__/rules/planet.test.ts`
- `pnpm --filter @seti/server exec vitest run __tests__/engine/board/PlanetaryBoard.test.ts __tests__/engine/actions/Land.test.ts __tests__/engine/effects/probe/BuildLandPlanetSelection.test.ts __tests__/engine/cards/base/EuropaClipperCard.test.ts __tests__/engine/cards/BehaviorExecutor.test.ts __tests__/persistence/serializer/GameDeserializer.test.ts`
- `pnpm --filter @seti/server exec vitest run __tests__/engine/cards/alien/MascamitesCards.test.ts __tests__/engine/alien/plugins/MascamitesAlienPlugin.test.ts`
- `pnpm --filter @seti/client exec vitest run __tests__/features/board/PlanetaryBoardView.test.tsx`
- `pnpm --filter @ender-seti/common run typecheck`
- `pnpm --filter @seti/server run typecheck`
- `pnpm --filter @seti/client run typecheck`
- `pnpm exec biome check --diagnostic-level=error ...` on 29 touched TS/TSX files
- `git diff --check`

Remaining:
- No known in-scope blocker. Broader existing working-tree changes outside moon identity were not refactored.
