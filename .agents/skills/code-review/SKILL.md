---
name: code-review
description: Systematic review-and-fix workflow for the SETI board game project. Use when the user asks to "review code", "check implementation", "review task X-Y", "code review", or wants feedback/fixes for code quality, logic correctness, task completion, or architecture compliance. Reviews findings, applies required fixes, and verifies the result unless the user explicitly requests read-only review.
---

# Code Review

**Key rule**: Do not stop at diagnosis. For every strategy and fix, ask: "Are you 100% confident in this strategy?" If not, find the loopholes, choose proper fixes, implement them, and rerun review plus verification until the confidence is evidence-backed. If factual 100% confidence is impossible because of an external blocker, state the blocker and the exact residual risk.

Systematic review of SETI project code from a game-architecture perspective. Produce working code changes, not just style nits or review documents. A report in `docs/review/` is supporting evidence; it is never the only deliverable unless the user explicitly asks for a read-only review.

## Workflow

### Step 0 — Determine execution mode and success criteria

Default mode is **review-and-fix**:

- Review the requested scope.
- Fix critical and warning findings that are in scope.
- Add or update focused tests when the finding is behavioral, rule-related, or regression-prone.
- Verify with targeted tests/typecheck/lint appropriate to the touched packages.
- Re-review the diff and repeat until no known loopholes remain.

Use **read-only review** only when the user explicitly says not to edit code. In read-only mode, produce findings and concrete fix directions, but do not modify files.

Success criteria for review-and-fix:

- All in-scope critical findings are fixed or blocked by a concrete external dependency.
- Warning findings are fixed unless they are clearly out of scope or would require a separate design decision.
- Tests or checks prove the user-visible behavior, game rule, or architecture contract that was reviewed.
- Any remaining risk is named explicitly; do not imply full confidence without evidence.

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
| Simple game rules | `docs/arch/rule-simple.md` | Always for logic reviews |
| Raw game rules | `docs/arch/rule-raw.md` | When `rule-simple.md` is unclear or conflicts with implementation |
| FAQ/rulings | `docs/arch/rule-faq.md` | When resolving ambiguous rule edge cases |
| Tech rules | `docs/arch/rule-tech.md` | When reviewing tech/scan/probe effects |
| Server architecture | `docs/arch/arch-server.md` | Server code reviews |
| Client architecture | `docs/arch/arch-client.md` | Client code reviews |
| Task plan | `docs/plan/summary.md` | Task completion checks |
| Task detail | `docs/plan/stages/stage-{N}-*/task-{NN}-*.md` | Task-scoped reviews |
| Board game patterns | `.agents/skills/board-game-architecture/SKILL.md` | Architecture compliance |

Only load what's relevant — avoid unnecessary context consumption.

### Step 3 — Execute review

Run the five review dimensions. See [references/checklist.md](references/checklist.md) for detailed checks per dimension. Keep working notes while reviewing; do not write a final report before deciding whether fixes are needed.

**Dimension 1: Logic Correctness**
- Cross-reference implementation against game rules (`rule-simple.md`, then `rule-raw.md`/FAQ if needed)
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

### Step 4 — Fix findings

For review-and-fix mode:

- Fix critical findings first, then warnings. Suggestions are fixed only when low-risk and directly tied to the requested scope.
- Prefer tests first for bugs and rule behavior: create a failing reproduction, implement the fix, then make it pass.
- Keep the patch minimal. Do not refactor adjacent code or add flexibility unrelated to the finding.
- Preserve package boundaries: shared pure rules/types go in `common`, engine behavior in `server`, UI behavior in `client`.
- If a change touches both client and server behavior, update both sides in the same pass.
- When UI renders rules, rewards, or desc icons, use existing `DescRender` / `EffectFactory` instead of hand-written placeholders.
- Delete only imports, variables, helpers, or tests made unused by your own changes.

### Step 5 — Confidence loop and verification

After each fix pass, run the loop:

1. Re-read the changed diff and ask what loopholes remain: rule edge cases, continuation loss, client/server mismatch, serialization gaps, stale tests, or false-positive tests.
2. Add or adjust tests for any loophole that can regress.
3. Run the smallest meaningful checks first, then broader checks when the blast radius warrants it.
4. If checks fail, fix root causes and repeat.
5. If checks cannot run, record the command attempted, the failure reason, and what confidence is still missing.

Do not claim the strategy is complete until the reviewed behavior is backed by passing checks or a clearly documented blocker.

### Step 6 — Write review report when useful

Write a report only if the user asked for one, the review is non-trivial, or a persistent audit trail is useful. Follow [references/review-template.md](references/review-template.md), but include fix status:

- **Fixed**: issue was corrected in code.
- **Verified**: checks that passed.
- **Remaining**: accepted blocker, out-of-scope issue, or explicit follow-up.

Save to: `docs/review/{scope}-{date}.md`

Naming convention:
- Task review: `task-2-5-2026-03-27.md`
- File review: `player-subsystem-2026-03-27.md`
- Diff review: `diff-2026-03-27.md`
- Full review: `full-review-2026-03-27.md`

### Step 7 — Summarize to user

Present a concise summary:
1. What was reviewed and fixed
2. Files changed
3. Checks run and their result
4. Remaining risks or blockers, if any
5. Link to the report file, if one was created
