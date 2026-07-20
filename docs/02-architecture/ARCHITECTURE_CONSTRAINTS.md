# ARCHITECTURE_CONSTRAINTS.md

> **This document's responsibility:** Enumerate the *non-negotiable* technical and operational constraints that every future design decision (ADRs included) must satisfy. It is the hard boundary layer; *why*-shaped guidance lives separately in [`../00-bootstrap/PROJECT_PRINCIPLES.md`](../00-bootstrap/PROJECT_PRINCIPLES.md), and the specific technology choices that meet these constraints are deferred to ADRs (`ADR-0003`–`ADR-0006` and beyond).
> If a proposed technology cannot satisfy a constraint below, the proposal is rejected regardless of popularity.

---

## Hard constraints

| # | Constraint | Implication |
| --- | --- | --- |
| C1 | **Single VPS (~4 GB RAM)** | The entire system (app + DB + object storage) must run on one small server. No heavy runtimes, no multi-node assumptions. |
| C2 | **Multi-tenant** | One deployment serves multiple centers, isolated by `tenant_id`. Data isolation is enforced at more than one layer. |
| C3 | **Self-hosted** | Deployable on infrastructure we control. No proprietary backend-as-a-service as the primary store. |
| C4 | **Production-first** | Built for real use from day one; dev convenience must not compromise production behavior. |
| C5 | **Security-first** | Safe defaults (deny-by-default authz, parameterized queries, secrets in env). Student PII is protected. |
| C6 | **Low operational complexity** | Minimal moving parts; one person can operate, back up, and upgrade it. Avoid premature distribution. |
| C7 | **API contract** | *All externally consumed APIs must expose a stable, versioned, machine-readable contract.* The concrete contract technology (e.g. OpenAPI) is **deferred to a later ADR** and is not fixed here. |
| C8 | **One code artifact, different configuration** | One build artifact serves all deployment targets (dedicated VPS, SaaS, licensed, managed). Do **not** fork application code per customer. Customer identity, branding, domain, feature flags, and deployment target are runtime configuration, not build-time branches or customer-specific artifacts. |

## Service-level objectives (SLOs)

These are the measurable bar the system must meet; they are product-independent technical targets.

| SLO | Target |
| --- | --- |
| Availability | ≥ 99.5% uptime |
| API latency | p95 < 500 ms |
| Tenant onboarding | A new center usable in < 1 day |

## Supporting constraints (pointer)

The following are tracked in [`../03-development/TECH_STACK.md`](../03-development/TECH_STACK.md) and apply as binding context:

- No GPU dependency (AI features out of scope for v1).
- Persian + RTL first-class.
- No proprietary BaaS as primary store.
- License-compatible: no GPL dependencies in core.

> The *principles* that shape how we meet these constraints (e.g. "requirements drive technology") are in `PROJECT_PRINCIPLES.md` — do not confuse principles with these hard constraints.
