---
name: task-runner
description: Execute a SETI project implementation task by reading its plan, architecture, and rules, then implementing the code. Use when the user asks to "run task X-Y", "implement task", "do task", "execute task", or references a task number like "0-1", "1-3", "2-5", etc.
---

# Task Runner

## Workflow

When given a task identifier (e.g. `0-1`, `2-3`, `task 1-5`), follow these steps **in order**.

### Step 1 — Resolve task file

Map the task ID `{stage}-{seq}` to its plan file:

```
docs/plan/stages/stage-{stage}-*/task-{seq:02d}-*.md
```

Use Glob to find the exact path (e.g. `docs/plan/stages/stage-0-*/task-01-*.md` for task `0-1`).

Read the full task file — it contains title, description, implementation details, directory structure, and acceptance criteria.

### Step 2 — Read architecture docs

Determine the task's domain from its stage number and content:

| Stages | Domain | Architecture doc |
|--------|--------|------------------|
| 0 (common/mixed) | both | `docs/arch/arch-server.md` + `docs/arch/arch-client.md` |
| 1, 2, 3, 4 | server | `docs/arch/arch-server.md` |
| 5, 6, 7 | client | `docs/arch/arch-client.md` |
| 8 (alien) | both | `docs/arch/arch-server.md` + `docs/arch/arch-client.md` |
| 9 (polish/e2e) | client | `docs/arch/arch-client.md` |

Read the corresponding architecture document(s) to understand module structure, patterns, and conventions.

### Step 3 — Read rule spec

Read `docs/arch/prd-rule.md` for game rule details relevant to the task. Focus on sections that relate to the task's domain (e.g. solar system rules for task 2-1, scoring rules for task 3-3).

### Step 4 — Mark status as DOING

In `docs/plan/summary.md`, find the row matching the task ID and replace `⬜` with `🔨` in the status column.

Example: change `| 0-1 | ... | ⬜ |` → `| 0-1 | ... | 🔨 |`

### Step 5 — Implement

Execute the task according to:
- The task plan (Step 1)
- Architecture conventions (Step 2)
- Game rules (Step 3)
- Project naming conventions (Interfaces: `I` prefix, Types: `T` prefix, Enums: `E` prefix, constants: `CONSTANT_CASE`)

Also read and follow the relevant agent skills:
- For server tasks → read `.agents/skills/board-game-architecture/SKILL.md`
- For client tasks → read `.agents/skills/brand-guidelines/SKILL.md` and `.agents/skills/frontend-design/SKILL.md`

After implementation, run the acceptance checks listed in the task file (typecheck, build, tests, etc.).

### Step 6 — Mark status as DONE

After all acceptance criteria pass, update `docs/plan/summary.md`: replace `🔨` with `✅` for the task.

Example: change `| 0-1 | ... | 🔨 |` → `| 0-1 | ... | ✅ |`
