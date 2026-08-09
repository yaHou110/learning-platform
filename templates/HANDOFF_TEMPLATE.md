# HANDOFF_TEMPLATE.md

> **Template for a handoff entry.** Copy this into `docs/00-bootstrap/PROJECT_HANDOVER.md` at the end of every non-trivial session.

---

```markdown
## Session NNN — YYYY-MM-DD — <contributor>

**Goal:**
<one line, e.g. "Lock the technology stack (ADR-0003..0006).">

**Done:**
- [path/to/file.md] — <one-line description>
- [path/to/another.md] — <one-line description>
- (commit: `<short-sha>`)

**Decisions made:**
- ADR-NNNN: <title> (link)
- (or "none")

**Decisions still open:**
- <list, or "none">

**New ADRs created:**
- ADR-NNNN: <title> (link)

**Features affected:**
- F-XXX-NN: <id> → <status change> (or "none")

**Open questions raised this session:**
- <list, or "none">

**Next session:**
<one line pointing to PROJECT_BACKLOG.md, or "see PROJECT_BACKLOG.md session NNN+1">

**Notes for the next session:**
<any gotchas, links, things-to-remember — keep short>
```

---

## Examples of good vs. bad handoffs

### ❌ Bad

```markdown
## Session 5 — 2026-07-10
Did some stuff. Updated docs. Next: more stuff.
```

(Not specific. No file paths. No decisions recorded. Useless to the next session.)

### ✅ Good

```markdown
## Session 005 — 2026-07-10 — contributor

**Goal:** Lock the technology stack (ADR-0003..0006).

**Done:**
- docs/05-decisions/ADR-0003-web-framework.md → chose Next.js
- docs/05-decisions/ADR-0004-database.md → chose Postgres + Drizzle
- docs/05-decisions/ADR-0005-auth.md → chose Auth.js
- docs/05-decisions/ADR-0006-plugin-architecture.md → chose monorepo + manifest
- docs/03-development/TECH_STACK.md → filled
- docs/00-bootstrap/PROJECT_STATE.md → closed questions 1-4
- (commit: `a1b2c3d`)

**Decisions made:**
- ADR-0003..0006 (see above).

**Decisions still open:**
- Hosting (question 5 in PROJECT_STATE.md) — to be picked in M7.

**Next session:** Bootstrap the monorepo (`pnpm create`) + initial CI. See PROJECT_BACKLOG.md session 006.
```

---

## When to write a handoff

- ✅ End of a working session that changed docs or code.
- ✅ End of a session that produced a binding decision.
- ✅ End of a session that closed (or opened) a question.
- ❌ Not for "I just read the docs" sessions.
- ❌ Not for chat-only conversations that produced no artifact.
