# Regression Lessons

Use these checks when reviewing fixes around card inputs, alien discovery, and test failures.

## Card Input Projection

- `SelectCard` option ids may be UI ids such as `55@0`; never treat them as raw card ids without resolving the base card id.
- Object card items without registered card data can still be valid selector payloads when they carry runtime fields such as `sector`.
- Keep strict card-data validation for raw string card ids that enter real decks, hands, or discard piles.

## Alien Discovery Rewards

- `AlienState.resolveDiscoverySlots` is the default source of one alien-card draw per occupied discovery slot.
- Plugin `onDiscover` implementations should not draw extra cards for discoverers unless the alien explicitly replaces the default discovery-slot flow via `resolveDiscoverySlot`.
- When a test expects discovery rewards, count markers/slots, not only unique discoverers.

## Test Doubles Vs Core Interfaces

- If production code depends on a current core method such as `SolarSystem.getSectorIndexOfPlanet`, update test doubles to implement that method instead of adding production fallback for obsolete mock shapes.
- If production code calls current lifecycle hooks such as `alienState.onTechAcquired`, update stale test doubles to include the hook instead of weakening production calls with optional method compatibility.
- Fake deck/card-row ids are acceptable only in pure isolated tests that never project card metadata. Any path through `loadCardData`, `SelectCard.toModel`, card row refill, hand, or discard must use real card ids or object payloads with explicit runtime fields.

## UI Test Stability

- Do not set per-test timeouts below the package-wide timeout for integration-heavy UI layouts. Full-suite parallel load can make otherwise passing render tests exceed the lower local cap; prefer the shared timeout unless the test is intentionally proving fast failure.
