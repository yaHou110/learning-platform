# ARCHITECTURE_PRINCIPLES.md

> This document provides architectural principles and decision-making guidance.
> It is subordinate to existing governance, guardrails, and accepted ADRs.
> It does not override architectural decisions.

> **This document's responsibility:** Express *how to decide* — the intent and criteria that guide architecture decisions in any web project — not the decisions themselves. It is generic and transferable across projects; the binding to a specific repo's governance lives in a sibling file (for this repo, [`PROJECT_ARCHITECTURE_CONTEXT.md`](PROJECT_ARCHITECTURE_CONTEXT.md)).
>
> **Status:** guidance only. Where these principles and an accepted ADR, guardrail, security requirement, or product vision disagree, the governing document wins and this file is amended. These principles are *architectural intent*, not *binding rules*, and never the highest architectural authority.

---

## 1. Requirement Discovery / Context Analysis before architecture

Begin by understanding the actual problem. The architecture of a small CMS, a global marketplace, and a banking system must not start identical.

Before architecture decisions:

Analyze:
- product type
- business model
- user roles
- critical workflows
- expected scale
- data sensitivity
- compliance requirements
- operational constraints
- team capability and size
- budget constraints

> Avoid designing unnecessary enterprise complexity for small products. Match the architecture to verified requirements, not to imagined future load.

---

## 2. Threat Modeling before implementation

Security is established at design time, not bolted on by headers and firewalls alone. Threat-model before implementation.

Identify:
- assets (what is worth attacking)
- attackers and their motivation
- trust boundaries
- data flows
- attack surfaces
- abuse cases
- security controls that mitigate them

Use:
- STRIDE methodology where appropriate
- OWASP ASVS as a security baseline
- OWASP Top 10 as a minimum checklist

> This produces security by design. It is not optional, and it precedes technology selection.

---

## 3. Authorization architecture, explicitly

Authorization is more often the breach path than authentication; define it on purpose, do not leave it implicit.

Define authorization architecture:
- RBAC or ABAC decision (stated, not assumed)
- permission model
- ownership rules
- tenant isolation (where multi-tenant)
- administrative boundaries and privilege boundaries
- internal-service permissions
- privilege-escalation prevention

---

## 4. Identity lifecycle

Authentication is more than "login endpoint." Define the full lifecycle.

Define identity lifecycle:
- registration
- login
- session management
- password policy and recovery
- MFA strategy
- token lifecycle (issuance, rotation, revocation)
- account deletion / data erasure
- identity verification when needed
- privilege-escalation prevention across the lifecycle

---

## 5. Data architecture + recovery, proportional to need

Define:
- data classification
- sensitive-data handling
- backup strategy
- retention policy
- recovery objectives — RPO/RTO when applicable

> Do not introduce enterprise DR complexity without business justification. State RPO/RTO targets that match the product's real tolerances, not aspirational ones.

---

## 6. Observability

Implement:
- structured logs
- audit logs where required
- monitoring
- metrics
- alerts

Never log:
- passwords
- tokens
- secrets
- sensitive personal data

> Logging is for operations; audit logs are for accountability; neither is a place for credentials.

---

## 7. Technology selection criteria

Choose technology to satisfy documented requirements — never adopt first and justify afterward.

Select based on:
- scale requirements
- business domain
- performance
- security
- maintainability
- developer productivity
- operational complexity
- operational cost

> Selection is justified through the project's decision-record process (§10), not by popularity.

---

## 8. Requirements drive technology, not the reverse

Technology is chosen to satisfy documented product requirements and architectural constraints. No framework, cloud provider, or database is chosen because it is fashionable; each choice traces back to a requirement. (This is a binding intent shared with the project's product principles.)

---

## 9. Avoid security theater

Do not confuse hiding information with security. Fingerprint reduction (hiding framework versions, headers, stack traces) is *defense in depth*, not a primary control.

Security decisions must prioritize:
- correct authorization
- secure architecture
- least privilege
- secure defaults

> Reducing a public fingerprint is worthwhile but never a substitute for the controls above. Never trade real security work for concealment.

---

## 10. Respect existing decision-record governance

Architecture decisions are cumulative. Before creating new architecture documentation:

1. Detect existing decision-record systems (ADR, decision log, etc.).
2. Reuse the existing structure and numbering — do not create a parallel one.
3. Never create duplicate or competing decision systems.
4. Never override previous decisions without evidence, a migration plan, and impact analysis.
5. Follow the project's precedence rules when they exist (governance-before-generation).

> If a project has documented decision processes: discover them first, preserve them, extend them. Never replace history silently. The project-specific binding for this repo is in `PROJECT_ARCHITECTURE_CONTEXT.md`.

---

## 11. Avoid unnecessary complexity and prefer maintainability

Choose the smaller, maintainable design over the more general one. Do not build generalization that is not yet needed; do not distribute a monolith prematurely; do not introduce services, queues, or caches before they are justified by evidence.

Architectural decisions should:
- make explicit trade-offs (state what is sacrificed, not only what is gained)
- scale based on evidence of need, not anticipated growth
- remain operable by the team that will run them

---

## 12. Final verification before "production-ready"

"Ready" is not declared by the implementer's judgment; it is the output of a defined gate. Before production:

Perform:
- architecture review
- security review
- dependency audit
- configuration review
- API exposure review
- penetration-test checklist
- performance validation proportional to need
- disaster-recovery validation (where RPO/RTO were defined)

> For projects with a unified completion gate (DoR/DoD), this verification is that gate — not a separate ritual.

---

## What these principles deliberately are *not*

- **Not** a technology list. They name no framework, database, cloud provider, or language. Those are decisions, recorded as ADRs.
- **Not** binding rules. They are architectural intent and decision-making guidance, subordinate to security requirements, product vision, accepted ADRs, and the project's engineering protocol/guardrails.
- **Not** a restatement of product principles. Product-level *why* lives in the project's product principles (e.g. API-first, self-host). This file is *how to decide architecture*.
- **Not** portable authority over a specific repo. The bridge to a concrete project's governance — its ADR location, precedence, existing assumptions — lives in that project's `PROJECT_ARCHITECTURE_CONTEXT.md` (or equivalent overlay file). This file says nothing about *which* ADRs exist.
