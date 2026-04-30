---
name: code-review
description: Systematic code review for the SETI board game project. Use when the user asks to "review code", "check implementation", "review task X-Y", "code review", or wants feedback on code quality, logic correctness, task completion, or architecture compliance. Produces structured review reports in docs/review/.
---

# Code Review

Systematic review of SETI project code from a game-architecture perspective. Produce actionable feedback — not just style nits.

## Workflow

### Step 1 — Determine review scope

Identify what to review based on user request:

- **Task-scoped**: User says "review task 2-5" → review files changed by that task
- **File-scoped**: User points to specific files → review those files
- **Diff-scoped**: User says "review recent changes" → use `git diff` / `git status` to find changed files
- **Full-scoped**: User says "review all" → review all server engine code systematically

### Step 2 — Load context

Read the following project references based on the review scope:

| Context | Path | When |
|---------|------|------|
| Game rules | `docs/arch/prd-rule.md` | Always for logic reviews |
| Tech rules | `docs/arch/rule-tech.md` | When reviewing tech/scan/probe effects |
| Server architecture | `docs/arch/arch-server.md` | Server code reviews |
| Client architecture | `docs/arch/arch-client.md` | Client code reviews |
| Task plan | `docs/plan/summary.md` | Task completion checks |
| Task detail | `docs/plan/stages/stage-{N}-*/task-{NN}-*.md` | Task-scoped reviews |
| Board game patterns | `.agents/skills/board-game-architecture/SKILL.md` | Architecture compliance |

Only load what's relevant — avoid unnecessary context consumption.

### Step 3 — Execute review

Run the five review dimensions. See [references/checklist.md](references/checklist.md) for detailed checks per dimension.

**Dimension 1: Logic Correctness**
- Cross-reference implementation against game rules (`prd-rule.md`)
- Verify edge cases: empty hands, zero resources, boundary sectors, null boards
- Check that effects compose correctly (e.g. scan → card row → signal → refill)
- Confirm continuation-based flow: `execute()` returns `PlayerInput | undefined` correctly

**Dimension 2: Task Completion**
- Compare implementation against task plan acceptance criteria
- Check all listed files exist and contain expected exports
- Verify tests exist and cover stated scenarios
- Flag any TODO/FIXME items that block acceptance

**Dimension 3: Code Maintainability**
- Identify duplicated logic that should be extracted (shared methods, utilities)
- Check monorepo layering: pure rules/types → `common`, engine logic → `server`, UI → `client`
- Verify interface-first design: `IGame`/`IPlayer` used in dependencies, not concrete classes
- Check naming conventions: `I` prefix interfaces, `E` prefix enums, `T` prefix types, `CONSTANT_CASE`
- Flag overly complex functions (>50 lines, >3 nesting levels)

**Dimension 4: Configurability (No Hardcoded Values)**
- Flag hardcoded numeric costs/limits/caps in action/effect files (e.g. `const SCAN_CREDIT_COST = 1` inline)
- All game constants should live in a dedicated config file in `common/constant/` or `server/engine/config/`
- Constants should be injected into the owning class: player-scoped costs → `Player` config, game-scoped → `Game` config
- Values that can change at runtime (via cards/techs) must be stored as mutable state on the class, initialized from config
- Check that tech modifiers operate on configurable base values, not re-hardcoded numbers

**Dimension 5: Code Quality**
- Flag `any` types — must use specific types or `unknown` with narrowing
- Flag `unknown` without type guards — acceptable only if narrowed before use
- Run `pnpm run typecheck` and `pnpm run lint` (or check ReadLints)
- Verify unit tests exist, check coverage of: happy path, error cases, edge cases
- Check for missing error handling (GameError with proper EErrorCode)

### Step 4 — Write review report

Generate the review report following [references/review-template.md](references/review-template.md).

Save to: `docs/review/{scope}-{date}.md`

Naming convention:
- Task review: `task-2-5-2026-03-27.md`
- File review: `player-subsystem-2026-03-27.md`
- Diff review: `diff-2026-03-27.md`
- Full review: `full-review-2026-03-27.md`

### Step 5 — Summarize to user

Present a concise summary:
1. Number of issues by severity (critical / warning / suggestion)
2. Top 3 most impactful findings
3. Link to the full report file
