# Review Checklist

Detailed checks for each review dimension. Use as a systematic walkthrough — not every check applies to every review.

## Dimension 1: Logic Correctness

### Game Rule Compliance
- [ ] Resource costs match `prd-rule.md` (Scan: 1 credit + 2 energy, Launch: 2 credits, etc.)
- [ ] Action preconditions enforced (e.g. must have probe at planet to orbit/land)
- [ ] Scoring awards match rules (orbit VP, landing VP, sector completion VP)
- [ ] Solar system rotation triggers correctly (first pass of each round)
- [ ] Tech effects apply in correct order and with correct modifiers
- [ ] Card row refill happens at correct timing (after scan, not during)

### Edge Cases
- [ ] Empty hand: actions requiring hand cards return false/skip gracefully
- [ ] Zero resources: `canExecute` returns false, `execute` throws `GameError`
- [ ] Boundary sectors: wrap-around indexing works (sector 0 ↔ sector N-1)
- [ ] Null boards: `game.solarSystem === null` / `game.planetaryBoard === null` handled
- [ ] Probe limits: `probesInSpace` never exceeds `probeSpaceLimit`
- [ ] Publicity cap: never exceeds 10

### Continuation Flow
- [ ] Interactive effects return `PlayerInput`, non-interactive return `undefined`
- [ ] `onComplete` callbacks chain correctly (no lost continuations)
- [ ] `DeferredAction` priority ordering: COST → DEFAULT → ROTATION
- [ ] `SelectOption` / `SelectCard` inputs validate selection before executing

## Dimension 2: Task Completion

### Plan Alignment
- [ ] All files listed in task plan exist
- [ ] All exports listed in task plan are present
- [ ] All acceptance criteria from task file are satisfied
- [ ] Any "out of scope" items are indeed not implemented (no scope creep)

### Test Coverage
- [ ] Unit test file exists for each implementation file
- [ ] Happy-path test for main functionality
- [ ] Error-case test (invalid inputs, insufficient resources)
- [ ] Edge-case tests (empty collections, boundary values)
- [ ] Tests use proper test doubles (mock IGame, mock IPlayer) not real instances where isolation matters

### Remaining Work
- [ ] No blocking `TODO`/`FIXME` in implementation files
- [ ] `summary.md` status matches actual completion (✅ vs ⬜ vs 🔨)

## Dimension 3: Code Maintainability

### Duplication & Reuse
- [ ] No copy-paste blocks >5 lines across files — extract to shared utility
- [ ] Common player operations are methods on `IPlayer`/`Player` (not inline in effects)
- [ ] Common game operations use `IGame` methods (not reaching into internals)
- [ ] Card behavior patterns use `BehaviorExecutor` (not reimplementing in `bespokePlay`)

### Monorepo Layering
- [ ] Pure types/enums/constants in `@seti/common`
- [ ] Game engine logic in `packages/server/src/engine/`
- [ ] UI components in `packages/client/src/features/`
- [ ] No server imports in client, no client imports in server
- [ ] Shared validation/rule functions that both need → `common/rules/`

### Architecture Patterns
- [ ] Dependencies use `IGame`/`IPlayer` interfaces, not `Game`/`Player` classes
- [ ] New effects follow static-class pattern: `canExecute()` + `execute()`
- [ ] New cards extend `Card`/`ImmediateCard`/`MissionCard`/`EndGameScoringCard`
- [ ] New PlayerInputs extend base input types (`SelectCard`, `SelectOption`, etc.)
- [ ] DeferredActions use `SimpleDeferredAction` with correct `EPriority`

### Naming Conventions
- [ ] Interfaces: `IPlayer`, `IGame`, `ICard` (I prefix)
- [ ] Types: `TPartialResourceBundle`, `TResearchTechFilter` (T prefix)
- [ ] Enums: `EResource`, `EPlanet`, `EErrorCode` (E prefix)
- [ ] Constants: `SCAN_CREDIT_COST`, `PUBLICITY_MAX` (CONSTANT_CASE)
- [ ] Classes/Components: `UpperCaseCamel`
- [ ] Variables/functions/methods: `lowerCaseCamel`

## Dimension 4: Configurability (No Hardcoded Values)

### Magic Numbers
- [ ] No numeric costs hardcoded in action/effect files (e.g. `const SCAN_CREDIT_COST = 1` inline in `Scan.ts`)
- [ ] No numeric limits hardcoded in logic (e.g. `targetSize = 3` for card row, `PUBLICITY_MAX = 10`)
- [ ] No numeric rewards hardcoded in effects (e.g. VP amounts, data gains)

### Config Architecture
- [ ] All initial game constants declared in a dedicated config file (`common/constant/` or `server/engine/config/`)
- [ ] Config grouped by domain: action costs, resource limits, board sizes, scoring values
- [ ] Config types have proper TypeScript interfaces (e.g. `IActionCostConfig`, `IPlayerConfig`)

### Injection Pattern
- [ ] Player-scoped values (action costs, hand limit, probe limit, publicity cap) injected into `Player` via constructor/init
- [ ] Game-scoped values (card row size, round count, board dimensions) injected into `Game` via constructor/options
- [ ] Actions/effects read costs from the owning class instance, not from file-level constants
- [ ] Example: `player.actionCosts.scan.credits` instead of `const SCAN_CREDIT_COST = 1`

### Runtime Mutability
- [ ] Values that can change at runtime (via cards/techs/aliens) stored as mutable properties on the class
- [ ] Tech modifiers operate on the class property (base value), not re-hardcoded numbers
- [ ] Card effects that modify costs/limits update the class property, not a separate variable
- [ ] Default values come from config; runtime overrides come from game effects

### Common Antipatterns to Flag
- [ ] `const FOO_COST = N` at file top in action/effect files → should come from config
- [ ] `player.resources.has({ credits: 2 })` with literal numbers → should reference config
- [ ] `Math.min(PUBLICITY_MAX, ...)` with inline constant → should be `player.publicityMax`
- [ ] `targetSize = 3` as function default → should be `game.config.cardRowSize`

## Dimension 5: Code Quality

### Type Safety
- [ ] No `any` usage — use specific types
- [ ] `unknown` only with proper type guards/narrowing before access
- [ ] Generic constraints where applicable (`T extends ICard`)
- [ ] Discriminated unions over type assertions

### Error Handling
- [ ] All thrown errors are `GameError` with proper `EErrorCode`
- [ ] Error context includes relevant state (playerId, cardId, resourceState)
- [ ] No swallowed errors (empty catch blocks)
- [ ] Validation at public API boundaries (action entry points)

### Lint & Typecheck
- [ ] `pnpm --filter @seti/server run typecheck` passes
- [ ] `pnpm --filter @seti/client run typecheck` passes
- [ ] `pnpm run lint` passes (or only pre-existing warnings)
- [ ] No unused imports or variables

### Test Quality
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Assertions are specific (not just `toBeDefined()` — check actual values)
- [ ] Test descriptions follow "should [verb] when [condition]" pattern
- [ ] No flaky tests (no timers, random, or network in unit tests)
