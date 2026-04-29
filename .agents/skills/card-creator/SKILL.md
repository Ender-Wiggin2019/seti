---
name: card-creator
description: Implement SETI card logic in this monorepo. Use when adding or migrating card behavior, resolving unhandled custom/DESC tokens, implementing cards from progress reports, creating one class and one unit test per custom card, updating card registries, or auditing card runtime coverage.
---

# Card Creator

## Core Rule

For every card with gameplay-specific custom logic, create one dedicated card class file and one dedicated unit test file. Do not add new gameplay logic to the global DESC handler registry except as a short-lived migration bridge.

## Source Priority

Use sources in this order:

1. Card data in `packages/common/src/data/*Cards.ts`
2. English locale text in `packages/common/locales/en/seti.json`
3. Chinese locale text in `packages/common/locales/zh-CN/seti.json` as a cross-check
4. Rules in `docs/arch/rule-simple.md`
5. FAQ clarifications in `docs/arch/rule-faq.md`
6. Detailed rules in `docs/arch/rule-raw.md` when simple rules and FAQ are insufficient
7. Existing server card/effect patterns

Do not derive rules from card images or OCR. Images may only be used for visual sanity checks after locale/rule sources are exhausted.

## Workflow

### 1. Scope The Work

Start with `git status --short` and identify pre-existing user changes. Do not revert or rewrite unrelated dirty files.

Locate the affected package before editing:

- Shared card definitions, enums, or reusable structures: `packages/common`
- Runtime card behavior and tests: `packages/server`
- Rendering or client protocol changes: `packages/client`

If a change affects both client and server behavior, update both sides in the same task.

### 2. Load Required Context

Read only the relevant slices:

- Rules: `docs/arch/rule-simple.md`, `docs/arch/rule-faq.md`; use `rule-raw.md` only for unclear cases.
- Card data: the card's entry in `baseCards.ts`, `spaceAgencyCards.ts`, `alienCards.ts`, or `spaceAgencyAliens.ts`.
- Locale text: matching `desc.*`, `sa.desc.*`, or alien keys in `packages/common/locales/en/seti.json`.
- Existing server patterns near the target card family.

Use `rg` first for file and text discovery.

### 3. Classify Each Card

Use the card data and locale text to decide the implementation path:

- Pure standard effects only: keep or register as generic.
- Gameplay custom text/DESC effect: create a dedicated card class and test.
- Mission/end-game custom condition: implement in the card class or mission condition helper, with a card-specific test.
- Purely informational rendering text: remove the runtime custom warning only if the class fully preserves the intended gameplay behavior.
- Missing state or unresolved rules: stop that card, record a blocker, and ask the user if no conservative implementation is defensible.

Common blocker examples:

- "until end of turn" effects without an engine turn-effect hook
- future visit/movement triggers when the engine only stores current state
- alien species resources without a runtime state model
- card data that lacks per-card printed effect or scoring condition

### 4. Follow File Conventions

Create one class file per card:

- Base cards: `packages/server/src/engine/cards/base/<PascalName>Card.ts`
- Alien cards: `packages/server/src/engine/cards/alien/<PascalName>Card.ts`
- Space Agency cards: `packages/server/src/engine/cards/spaceAgency/<PascalName>Card.ts`

Create one test file per card:

- Base tests: `packages/server/__tests__/engine/cards/base/<PascalName>Card.test.ts`
- Alien tests: `packages/server/__tests__/engine/cards/alien/<PascalName>Card.test.ts`
- Space Agency tests: `packages/server/__tests__/engine/cards/spaceAgency/<PascalName>Card.test.ts`

Small shared helpers are allowed only when several card files genuinely need the same mechanic. Keep helpers in the same card-family directory.

### 5. Implement Card Behavior

Prefer existing engine effects, actions, inputs, and player/game APIs over ad hoc state changes.

Default class shape:

```ts
export class ExampleCard extends ImmediateCard {
  public constructor() {
    super(loadCardData('ID'), {
      behavior: {
        // standard effects that should still be executed
      },
    });
  }

  protected override bespokePlay(context: ICardRuntimeContext): IPlayerInput | undefined {
    context.game.deferredActions.push(
      new SimpleDeferredAction(
        context.player,
        (game) => {
          // custom effect
          return undefined;
        },
        EPriority.CORE_EFFECT,
      ),
    );
    return undefined;
  }
}
```

Use these rules:

- Preserve standard printed effects by keeping them in `behavior` or by reimplementing the whole effect deliberately.
- Remove handled custom tokens from runtime `behavior.custom`; tests must prove they do not emit unhandled custom events.
- Use `SimpleDeferredAction` when an effect happens as part of card resolution.
- Return `IPlayerInput` from a deferred action when the player must choose.
- Use existing inputs like `SelectOption` and `SelectCard` for choices.
- Use existing effects like `MarkSectorSignalEffect`, `LaunchProbeEffect`, `OrbitProbeEffect`, `ResearchTechEffect`, and `TuckCardForIncomeEffect`.
- Keep card classes narrowly scoped; do not hide unrelated engine refactors inside card migration.

### 6. Write Tests First

For each card, write the dedicated test before production code and confirm it fails for the expected reason.

Each card test should usually cover:

- Card id and type metadata when useful
- The custom gameplay behavior from locale/rules
- The standard effects that are easy to regress
- `behavior.custom` no longer containing handled custom tokens
- Edge cases from FAQ/rules, such as empty hand, no valid target, no data, or no matching tech

Prefer real game flow (`Game.create`, `processMainAction`, real deferred queue) when the behavior depends on turn order, mission state, card row, board sectors, or probes. Use small stubs only for narrow card-local logic.

### 7. Register And Migrate

After tests for the class pass, update the appropriate registry:

- Base: `packages/server/src/engine/cards/register/registerBaseCards.ts`
- Alien: `packages/server/src/engine/cards/register/registerAlienCards.ts`
- Space Agency: `packages/server/src/engine/cards/register/registerSpaceAgencyCards.ts`
- Space Agency alien: `packages/server/src/engine/cards/register/registerSpaceAgencyAliens.ts`

If a card was previously handled in `registerDescHandlers.ts`, migrate the handler into the card class and remove the legacy registration and test expectation.

Do not let a migrated card stay registered as generic if it still has gameplay custom logic.

### 8. Use Subagents For Large Batches

When the user explicitly asks for subagents or the batch is large, split workers by disjoint write scopes:

- Assign card families or card id ranges.
- Tell workers to create class/test files only.
- Tell workers not to edit registries or global DESC handlers.
- Parent agent integrates registries, removes legacy handlers, resolves style issues, and runs final checks.

### 9. Verify

Run checks in increasing scope:

```bash
pnpm --filter @seti/server test -- <new-card-test-files>
pnpm --filter @seti/server test -- __tests__/engine/cards/register __tests__/engine/cards/CardRegistry.test.ts
pnpm --filter @seti/server typecheck
pnpm --filter @seti/server lint
```

For broad card migrations, also run:

```bash
cd packages/server
PATH=/opt/homebrew/bin:/usr/local/bin:$PATH ./node_modules/.bin/vitest run __tests__/engine/cards __tests__/engine/missions __tests__/engine/actions/PlayCard.test.ts __tests__/engine/freeActions/FreeActionCorner.test.ts __tests__/engine/freeActions/BuyCard.test.ts __tests__/engine/effects/cardRow __tests__/engine/scoring
```

If a check fails because of unrelated dirty work, report the exact blocker and still run focused checks for the files changed by this task.

## Output

When finishing, summarize:

- Cards implemented and their custom logic
- Files added or changed
- Tests and checks run, with pass/fail status
- Remaining blockers or rule questions, with concrete card ids
