# PROJECT_ARCHITECTURE_CONTEXT.md

> **This document's responsibility:** Bind the generic guidance in [`ARCHITECTURE_PRINCIPLES.md`](ARCHITECTURE_PRINCIPLES.md) to **this** codebase — by pointing at the governance that already exists here, not by inventing new rules.
>
> **This document is subordinate to, and does not override:**
> 1. Security requirements
> 2. Product vision
> 3. Accepted ADRs (decision records)
> 4. Engineering protocols and guardrails
>
> This document provides **project-specific context only**. It is not a second source of rules and does not duplicate or compete with the governance surfaces below. When in doubt, the canonical governance wins and this file is amended.
>
> This document's scope is deliberately narrow: point at existing structures, state existing assumptions, and stop. It does not re-derive decisions that ADRs already record.

---

## 1. How to read this document

This file exists because `ARCHITECTURE_PRINCIPLES.md` is generic and transferable — it cannot name the ADRs or the precedence rules of *this* repo. That binding lives here. If you are applying the architecture principles to *this* project, read this file first; if you are applying them to *another* project, ignore this file and write an equivalent one for that project.

If anything below appears to contradict an accepted ADR, the Engineering Protocol, or the Development Guide, that is drift — **the existing governance wins**. Report the conflict (per the precedence rules), preserve history, update references only after approval, and never auto-revert.

---

## 2. Canonical governance surfaces (highest authority first)

Precedence is fully specified in `ENGINEERING_PROTOCOL.md` §47. Summarized, in order:

1. Security (actual security constraints only — not a general override)
2. Product Vision (`PRODUCT_BIBLE.md`)
3. Accepted ADRs (`docs/05-decisions/`)
4. Guardrails
5. Architecture Docs (this folder, including this file and `ARCHITECTURE_PRINCIPLES.md`)
6. Development Guide (`DEVELOPMENT_GUIDE.md`)
7. Sprint Docs
8. Historical Docs (context only — never auto-revert from them)

> Human approval is a **gate**, not a precedence level (§41 note). It does not sit at a rank in the list above; it is a separate control that high-risk operations must pass.

This document sits at rank **5 (Architecture Docs)**, explicitly beneath ADRs and the Engineering Protocol.

---

## 3. Decision-record location and rules

- **ADRs live in:** `docs/05-decisions/`
- **Numbering:** `ADR-0001` onward (zero-padded, four digits — e.g. `ADR-0001`, `ADR-0014`)
- **Index file:** [`../05-decisions/DECISIONS.md`](../05-decisions/DECISIONS.md)
- **History is append-only.** Accepted ADRs are not edited to reverse a decision; a new ADR supersedes and the old one keeps its status pointer.
- **Replacing a decision requires:** evidence the prior decision is now incorrect, a migration plan, and an impact analysis — recorded in the new ADR. Never revert to older assumptions without explicit approval.

When `ARCHITECTURE_PRINCIPLES.md` principle 10 says "detect existing decision-record systems and reuse them," for this project that means the structure above. Do **not** create `docs/adr/`, do **not** use `ADR-001-product…` numbering, and do **not** start a parallel decision log.

---

## 4. Existing architectural assumptions (pointers, not restatements)

These are *where to find* the project's actual architectural decisions. They are listed here so a contributor does not have to discover them; they are not re-argued here.

| Assumption | Location | Note |
| --- | --- | --- |
| Web framework | `ADR-0003` | |
| Database choice | `ADR-0004` | |
| Authentication approach | `ADR-0005` | Identity-lifecycle detail (MFA, token rotation, revocation) is expanded where the ADR has gaps — via new ADRs, not by amending this file into a spec. |
| Plugin architecture | `ADR-0006` | Compile-time internal modularity only in v1. |
| Reusable-platform vision | `ADR-0014` | First customer is *a first customer*, not the *only customer*. |
| Architectural style / modular monolith / multi-tenant | [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) | |
| Non-negotiable constraints | [`ARCHITECTURE_CONSTRAINTS.md`](ARCHITECTURE_CONSTRAINTS.md) | |
| Permission model | [`PERMISSION_MATRIX.md`](PERMISSION_MATRIX.md) | Authorization architecture (Principles §3) must extend this, not duplicate it. |
| Bounded contexts | [`BOUNDED_CONTEXTS.md`](BOUNDED_CONTEXTS.md) | |
| Data model | [`DATA_MODEL.md`](DATA_MODEL.md) | Data architecture (Principles §5) extends where retention/RPO/RTO gaps exist — via ADRs. |
| Engineering protocol (DoR, risk classes, approval gates, rule priority §47) | `ENGINEERING_PROTOCOL.md` (incl. §39–§60, ADR-0013) | |
| Product principles (API-first, self-host, modular monolith, etc.) | [`../00-bootstrap/PROJECT_PRINCIPLES.md`](../00-bootstrap/PROJECT_PRINCIPLES.md) | These are *product* principles — distinct from the *architecture-decision* principles in `ARCHITECTURE_PRINCIPLES.md`. |

---

## 5. Where the generic principles map onto this project

This section exists only to prevent re-litigating work that is already done. It is a pointer table, not a substitute for reading the linked documents.

| `ARCHITECTURE_PRINCIPLES.md` section | Status in this project | Pointer |
| --- | --- | --- |
| §1 Requirement Discovery | Product vision & scope defined | `PRODUCT_BIBLE.md` §3–§4 |
| §2 Threat Modeling | **Gap — to be produced** as an ADR or架构 doc when prioritized | — |
| §3 Authorization | Exists; extend, do not duplicate | `PERMISSION_MATRIX.md` |
| §4 Identity Lifecycle | Partial (ADR-0005); MFA / token lifecycle may need an ADR | `ADR-0005` |
| §5 Data Architecture + Recovery | DATA_MODEL exists; backup / retention / RPO-RTO is a gap | `DATA_MODEL.md` → new ADR |
| §6 Observability | Defined where present; verify "never log secrets" coverage | — |
| §7 Tech selection criteria | Each major choice has an ADR | `ADR-0003`–`ADR-0006` |
| §8 Requirements drive technology | A binding product principle | `PROJECT_PRINCIPLES.md` #8 |
| §9 Avoid Security Theater | Hardening done in sprint M4.2/M4.3 as defense-in-depth | commit `f056462`, `2ac7461` |
| §10 Respect existing governance | **This entire file is the project binding for that principle** | here |
| §11 Avoid unnecessary complexity | A binding product principle | `PROJECT_PRINCIPLES.md` #6 |
| §12 Final verification | Unified completion gate (§60) governs "production-ready" | `ENGINEERING_PROTOCOL.md` |

---

## 6. What this document must never become

- **Not** a second Engineering Protocol. Process and gates live there; this file only references them.
- **Not** a second ADR log. Decisions live in `docs/05-decisions/`; this file only points at them.
- **Not** a restatement of the product vision. That lives in `PRODUCT_BIBLE.md`.
- **Not** binding rules. It is context. If a future reader mistakes it for authority, the subordinate block at the top is the correction.

When the project's reality changes (an ADR is added, a precedence rank shifts, a new governance surface is created via its own ADR), update the pointers in §3–§5. Do **not** record the architectural decision itself here — record it as an ADR and link to it.
