# Review Report Template

Use this template when generating review reports. Replace `{placeholders}` with actual values.

---

```markdown
# Code Review: {scope}

**Date:** {YYYY-MM-DD}
**Scope:** {description of what was reviewed}
**Reviewer:** AI Code Review Skill

## Summary

| Severity | Count |
|----------|-------|
| Critical | {n} |
| Warning  | {n} |
| Suggestion | {n} |

**Overall assessment:** {1-2 sentence verdict}

## Critical Issues

> Issues that break correctness, lose data, or violate game rules. Must fix.

### C-{nn}: {title}

**File:** `{path}`
**Line(s):** {start}-{end}
**Dimension:** Logic / Completion / Maintainability / Quality

{Description of the issue, why it matters, and the expected behavior.}

**Current:**
(code block showing the problematic code)

**Suggested fix:**
(code block or description of the fix)

---

## Warnings

> Issues that may cause bugs, hurt maintainability, or deviate from architecture. Should fix.

### W-{nn}: {title}

**File:** `{path}`
**Dimension:** Logic / Completion / Maintainability / Quality

{Description and suggested improvement.}

---

## Suggestions

> Non-blocking improvements for readability, consistency, or future-proofing.

### S-{nn}: {title}

**File:** `{path}`
**Dimension:** Maintainability / Quality

{Description and rationale.}

---

## Task Completion Status

> Only include this section for task-scoped reviews.

| Criterion | Status | Notes |
|-----------|--------|-------|
| {criterion from task plan} | ✅ / ❌ / ⚠️ | {notes} |

## Checklist Summary

| Dimension | Pass | Fail | N/A |
|-----------|------|------|-----|
| Logic Correctness | {n} | {n} | {n} |
| Task Completion | {n} | {n} | {n} |
| Maintainability | {n} | {n} | {n} |
| Configurability | {n} | {n} | {n} |
| Code Quality | {n} | {n} | {n} |
```

## Severity Guidelines

- **Critical**: Game rule violation, data corruption, crash, security issue, broken continuation chain
- **Warning**: Duplicated logic (>10 lines), missing test coverage for important path, `any` type usage, architectural pattern violation, missing error handling, hardcoded numeric values that should be configurable
- **Suggestion**: Naming inconsistency, could extract utility, minor readability improvement, test description wording, config injection opportunity

## Writing Style

- Be specific: cite file paths, line numbers, variable names
- Be actionable: every issue includes a fix direction
- Be fair: note what's done well, not just problems
- Be concise: no filler, no re-explaining what the code does
