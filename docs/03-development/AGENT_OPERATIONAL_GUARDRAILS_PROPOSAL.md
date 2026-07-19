# Agent Operational Guardrails — Proposal

> **Status:** Proposal (internal decision document, not yet an ADR).
> If accepted and later judged to affect project-level architecture or governance precedence,
> it can be promoted to a formal ADR (see §"Promotion path") in `docs/05-decisions/`.
>
> **Date:** 2026-07-17
> **Author:** Founder session
> **Related docs:** `ENGINEERING_PROTOCOL.md` (§47, §58, §59), `GOVERNANCE_CHECKLIST.md`, `RISK_CLASSIFICATION.md`

---

## 1. Purpose and scope

This is a **policy design** document, not an immediate fix. It proposes a set of operational
guardrails for AI-assisted engineering work in this repository. It does **not** change product
architecture, plugin boundaries, or technology choices.

The scope is specifically **agent tooling constraints** — how the agent interacts with tools
(Write, Edit, Bash) during a session — not the application being built.

The document is written so that it can later serve as the basis for an ADR, but it is
intentionally kept separate from the ADR stream until a decision is made.

---

## 2. Problem statement

### 2.1 Observed (fact)

During this session, attempts to create a large Markdown documentation file via a single
inline `Write` tool call failed repeatedly with a tool-call parsing failure
("malformed tool call, could not be parsed").

The failing call involved:

- a large inline content payload
- documentation text mixing multiple writing systems (Persian RTL and Latin)
- Markdown structural elements (tables, pipes, quotes, code blocks)
- file paths and special characters

### 2.2 Possible causes (hypotheses — none confirmed)

The root cause is **not yet determined**. Candidate factors, not yet separated or validated:

- inline payload size
- Markdown structural complexity (tables, fenced blocks)
- bidirectional / RTL text mixing
- tool-call serialization
- provider wrapper / API gateway behavior
- parser behavior in the tool layer
- tool implementation specifics

This proposal deliberately does **not** attribute the failure to any single factor above.
A separate diagnostic effort may confirm or rule out candidates; that work is distinct from
this proposal (see §"Relationship to diagnosis").

### 2.3 Why this matters regardless of root cause

Even if the underlying cause is later fixed (by the model, provider, or tool layer), the class
of failure — agent-initiated large inline tool calls failing mid-session — remains a
**general agentic-workflow risk**. The guardrails proposed here are designed to keep the project
reliable even when the underlying layer has limitations.

> Diagnosis answers: "why did it fail this time?"
> Guardrails answer: "how do we keep working safely even if it fails again?"

Both are needed. This document covers the second.

---

## 3. Decision boundaries — what this proposal is NOT

To prevent overlap with existing binding documents, this proposal explicitly does **not** define:

- **Application architecture rules** — those live in `docs/02-architecture/` and ADRs.
- **Product requirements** — those live in `docs/01-product/`.
- **Coding standards / quality gates** — those live in `ENGINEERING_PROTOCOL.md` and `QUALITY_GATES.md`.
- **Model selection policy** — choosing or evaluating models is out of scope.
- **Contributor behavior rules** — covered by §58 (contributor constraints) and §59 (governance before generation) in `ENGINEERING_PROTOCOL.md`.

This proposal defines **only** operational safeguards for AI-assisted development workflows —
specifically, how the agent interacts with tools (Write, Edit, Bash) during a session. It is a
**complement** to §58/§59, not a replacement or restatement of them.

---

## 4. Proposed controls

Controls are grouped into three layers: **Prevent**, **Detect/Gracefully degrade**, **Recover**.
This follows the same model the other AI proposed: do not optimize only for failure — optimize
for graceful degradation, so the workflow bends before it breaks.

### 4.1 Prevention — Large Write protection

**Risk indicators** (candidate factors, *not* confirmed causes):

- large inline payload size
- complex Markdown structure (tables, fenced code blocks, dense formatting)
- mixed writing systems / encodings in a single payload
- high count of special characters (quotes, pipes, backticks)
- tool argument complexity (many deeply-nested fields)

None of the above are asserted as the proven cause; they are the factors we treat as elevated
risk and reduce proactively.

**Mitigation:**

- Estimate content size and complexity *before* a `Write` call (the agent cannot measure bytes
  precisely; it estimates from visible length, line count, and structural density).
- For content above a pragmatic threshold (see §"Thresholds"), do **not** issue one large inline
  `Write`. Instead:
  1. Create the file with a small initial chunk (header + first section).
  2. Append remaining sections via successive `Edit` operations.
  3. For large static documentation, prefer a shell heredoc as a fallback when structured
     `Edit` is impractical.

> Accepted framing, stated explicitly so it is not later distorted:
> The above are risk-reduction measures. They are **not** evidence that any single indicator
> (e.g. mixed RTL text) is the root cause. The root cause of the observed failures remains
> unconfirmed (§2.2).

### 4.2 Detection + graceful degradation

The goal is not to wait until a call fails. Before a large tool call, the agent should evaluate
risk and, if high, **switch execution strategy automatically** rather than attempting the risky
call.

```
Large Write requested
        │
        ▼
Risk check: size, special chars, tables, mixed scripts, code blocks
        │
        ├── risk low  → proceed
        │
        └── risk high → automatically switch:
                          Option A: chunked Edit
                          Option B: shell heredoc
                          Option C: ask the user
```

The key idea: an **automatic switch before failure**, not a retry after failure.

**Context-pressure detection** (when applicable): the agent generally does not see an exact
context-usage percentage. It relies on **observable signals** instead:

- number of files loaded this session
- cumulative size of pasted/inline content
- session length (turn count)

On high context pressure: summarize current state, avoid loading unnecessary files, and avoid
large write operations. Recommend checkpoint/compaction when available.

### 4.3 Recovery — tool failure rule

This is the single most important rule and is listed separately for emphasis:

> **Never retry the same malformed payload.** Retrying an identical payload typically reproduces
> the same failure and wastes a turn.

On a tool-call parsing/malformed failure:

1. Do **not** retry the identical payload.
2. Reduce payload size (split into smaller chunks).
3. Switch execution strategy (chunked `Edit`, or shell-based creation as fallback).
4. Record the failure reason in the session record so a future diagnostic effort can use it.

This rule is cheap, model-independent in spirit, and the highest-value control in this document.

---

## 5. Enforcement options

These differ in *enforcement strength*. They are stacked, not alternatives:

```
CLAUDE.md / DEVELOPMENT_GUIDE.md
        │  (policy / intention — behavioral, rely on the model)
        ▼
AGENT_OPERATIONAL_GUARDRAILS.md   (if accepted)
        │  (detailed rules — the document this proposal would become)
        ▼
PreToolUse hook
        │  (hard enforcement — independent of model intelligence)
        ▼
Tool execution
```

| Layer | Strength | Depends on model compliance? | Cost |
| --- | --- | --- | --- |
| **CLAUDE.md / router rules** | Behavioral guidance | Yes | Low |
| **AGENT_OPERATIONAL_GUARDRAILS.md** | Detailed rules, referenced from router | Yes (but explicit) | Low |
| **PreToolUse hook** | Hard enforcement (programmatic) | No | Higher (implementation + maintenance) |

Important details:

- In Claude Code, a `PreToolUse` hook runs before a tool executes and can read the tool's input
  parameters (e.g. file path + content for `Write`) and decide allow / deny / ask / defer.
  So detecting "large Write" via a hook is **practically feasible**, not just theoretical.
- `CLAUDE.md` / router files are behavioral: they are read at session start and must be **kept
  small**, because they enter the context of every session (consistent with ADR-0002, which
  rejects oversized router files). Therefore detailed rules should live in a separate document
  and only be referenced from the router.
- Hook enforcement is the only layer truly independent of model intelligence — but it costs more
  to build and maintain, so it is **Phase 3**, not Phase 1.

### Note on CLAUDE.md in this repo

This repository currently has **no root `CLAUDE.md`**; the contributor entry point is
`DEVELOPMENT_GUIDE.md` (under 100 lines, per ADR-0002). Any reference to guardrails would
therefore go into `DEVELOPMENT_GUIDE.md` (thin pointer) → `AGENT_OPERATIONAL_GUARDRAILS.md`
(details), not into a new CLAUDE.md. **Creating a CLAUDE.md is out of scope for this proposal**
and would itself warrant a separate decision.

---

## 6. Relationship to diagnosis

This proposal is **orthogonal** to root-cause diagnosis.

- Diagnosis determines **why** the failures happen (which candidate in §2.2 is the real cause).
- This proposal determines **how to keep working safely** regardless of that answer.

A diagnostic effort — reproducing the failure under controlled conditions, isolating one
candidate factor at a time (e.g. English-only large Write vs. mixed-script large Write, with
size held constant) — may run in parallel. Its results will refine the risk indicators in §4.1
but are not required to adopt the guardrails. The guardrails are justified by the *observed*
failure class alone.

---

## 7. Promotion path

This document is a **Proposal**, not an ADR. Promotion requires:

1. Founder acceptance of the controls in §4.
2. Decision on the enforcement layer(s) from §5 (rules-only, or rules + hook).
3. Creation of `docs/05-decisions/ADR-NNNN-agent-operational-guardrails.md` using
   `templates/ADR_TEMPLATE.md`, with a row added to `DECISIONS.md` (Active) and a
   `CHANGELOG.md` entry — per ADR-0002 and the validator in `scripts/governance/validate.mjs`.

Promotion is optional. The proposal may also remain a non-binding operational reference without
ever becoming an ADR, if the founder decides the risk class does not rise to a binding
architecture/governance decision.

---

## 8. Trade-offs and implementation order

### 8.1 Trade-offs

| Aspect | Gain | Cost |
| --- | --- | --- |
| Chunked writes | Robust against large-payload failures | More tool calls per document |
| English-only for large docs | Reduces one payload-complexity factor; easier diagnostics | Loses native-language nuance (mitigated: runtime UI stays Persian-first per product) |
| PreToolUse hook | Model-independent hard enforcement | Implementation + maintenance burden |
| Separate guardrails doc | Keeps router small (ADR-0002) | One more document to maintain |

### 8.2 Implementation order

- **Phase 1 (rules only):** `AGENT_OPERATIONAL_GUARDRAILS.md` (this proposal, if accepted,
  converted to a concise rules document) + thin pointer from `DEVELOPMENT_GUIDE.md`. No config,
  no hooks. Lowest cost, immediate behavioral effect.
- **Phase 2 (optional promotion):** If judged binding, promote to a formal ADR (§7).
- **Phase 3 (hook):** Add a `PreToolUse` hook for large-Write detection only if Phase 1 proves
  insufficient in practice.

### 8.3 Thresholds (to be confirmed, not asserted)

The pragmatic thresholds below are starting points for review, not fixed values:

- Large Write heuristic: inline content estimated above ~5 KB, **or** high structural density
  (many table rows, fenced blocks, mixed scripts) regardless of byte size.
- The agent estimates; exact measurement is not available pre-call.

These thresholds are deliberately conservative and should be tuned against real session evidence
over time.

---

## 9. When to revisit

- Diagnostic effort (§6) confirms or rules out a candidate cause → update §4.1 risk indicators.
- Phase 1 rules prove insufficient → move to Phase 3 hook.
- Team grows / tooling changes (e.g. new model provider, different CLI) → re-evaluate the
  failure class.
- A root-cause fix lands upstream → guardrails remain as defense-in-depth; they are not removed.

---

## 10. References

- [`ENGINEERING_PROTOCOL.md`](./ENGINEERING_PROTOCOL.md) — §47 (rule priority), §58 (contributor
  constraints), §59 (governance before generation)
- [`GOVERNANCE_CHECKLIST.md`](./GOVERNANCE_CHECKLIST.md) — per-session behavioral checklist
- [`RISK_CLASSIFICATION.md`](./RISK_CLASSIFICATION.md) — risk matrix referenced by §42
- [`ADR-0002-operating-manual.md`](../05-decisions/ADR-0002-operating-manual.md) — portable docs,
  router size limit (why rules live in a separate doc)
- [`ADR-0012-engineering-protocol.md`](../05-decisions/ADR-0012-engineering-protocol.md)
- [`ADR-0013-engineering-protocol-v2.md`](../05-decisions/ADR-0013-engineering-protocol-v2.md) —
  §47 priority chain referenced above
- [`templates/ADR_TEMPLATE.md`](../../templates/ADR_TEMPLATE.md) — promotion target
