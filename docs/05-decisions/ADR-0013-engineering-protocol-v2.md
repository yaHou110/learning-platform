# ADR-0013: Engineering Protocol v2 (rules §39–§60)

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** Founder
- **Supersedes:** Nothing (extends ADR-0012)

---

## Context

ADR-0012 established a 38-rule Engineering Protocol with quality gates, definition of done, and contributor constraints. The protocol proved well-structured but lacked explicit coverage of:

- **Definition of Ready** before implementation starts
- **Spec-Driven Development** workflow (specification before code)
- **Human approval matrix** for high-risk operations
- **Risk classification** with tiered validation requirements
- **ADR enforcement** as a hard stop (not just documentation)
- **Rule priority** when constraints conflict
- **Governance before generation** for engineering workflows
- **Verification before completion** as a unified completion gate

The founder requested extension to 60 rules, reorganized into thematic chapters, without removing or replacing existing rules §1–§38.

---

## Decision

**We extend the Engineering Protocol to v2.0:**

1. **Rules §39–§60** added to `docs/03-development/ENGINEERING_PROTOCOL.md` — existing §1–§38 preserved verbatim in substance.
2. **Thematic chapters** — 13 chapters group rules by concern (Repository, Planning, Architecture, Quality, Security, Contributor Governance, etc.) for maintainability.
3. **Supporting documents:**
   - `docs/03-development/RISK_CLASSIFICATION.md` — risk matrix for §42
   - `templates/DEFINITION_OF_READY.md` — DoR checklist for §39
   - `templates/HUMAN_APPROVAL_CHECKLIST.md` — approval workflow for §41
4. **Updated templates:** `DEFINITION_OF_DONE.md` references §60 unified completion gate.
5. **protocol rule** updated with DoR, spec-first, governance-before-generation, and rule priority.
6. **Rule priority (§47):** Security > Human approval > ADRs > Protocol > Docs > Sprint scope > Preference.

ADR-0012 remains valid and is not edited (append-only history). This ADR extends it.

---

## Rationale

### 1. Spec-Driven Development alignment

Generating code directly from ad-hoc instructions fails without specification. §40 mandates a specification-first workflow; §59 requires governance checks before any code generation.

### 2. Enterprise-grade gates

DoR (§39) and unified verification (§60) bookend work: nothing starts unready, nothing finishes unverified. This matches enterprise engineering practice without adding heavyweight process for LOW-risk changes (see `RISK_CLASSIFICATION.md`).

### 3. Human-in-the-loop for high-risk ops

§41 explicitly lists actions requiring founder approval. Contributors must not assume consent for deletions, migrations, auth changes, or dependency changes.

### 4. Maintainability via chapters

Flat 60-rule lists become hard to navigate. Thematic chapters preserve stable rule numbers while improving readability and future extensibility.

### 5. Overlapping rules retained intentionally

Some new rules (§44, §49–§56, §58) reinforce existing rules (§23, §35–§38). Both numbers remain authoritative per founder directive — no silent removal.

---

## Consequences

### Positive

- ✅ Complete Engineering Protocol from planning through handover
- ✅ Explicit conflict resolution via §47
- ✅ Contributor governance strengthened (§59 governance before generation)
- ✅ Chapter structure supports future rules §61+

### Negative

- ❌ More checklist overhead for MEDIUM+ risk work
- ❌ Longer canonical document (~700 lines)

### Neutral

- 🔁 LOW-risk doc-only changes remain lightweight (optional DoR per risk matrix)
- 🔁 §37 retained as legacy alias for §57

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Replace §1–§38 with merged rules** | Rejected | Founder required no removal |
| **Separate protocol document** | Rejected | Splits source of truth; violates single canonical doc |
| **Extend in place + chapters (chosen)** | Accepted | Preserves numbers, improves navigation |
| **Wiki / external process doc** | Rejected | Not in-repo; violates ADR-0002 |

---

## When to revisit

- Team grows beyond single-founder (PR review workflow may need ADR)
- CI adds gates beyond `pnpm verify`
- Spec format standardizes (e.g. OpenAPI-first, executable specs)

A new ADR is required to overturn this one or ADR-0012.

---

## References

- [`ADR-0012`](./ADR-0012-engineering-protocol.md)
- [`docs/03-development/ENGINEERING_PROTOCOL.md`](../03-development/ENGINEERING_PROTOCOL.md)
- [`docs/03-development/RISK_CLASSIFICATION.md`](../03-development/RISK_CLASSIFICATION.md)
- [Spec-Driven Development — engineering practice](https://developer.microsoft.com/blog/spec-driven-development)
