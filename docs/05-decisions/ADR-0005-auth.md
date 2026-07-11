# ADR-0005: Auth — Auth.js (NextAuth) Credentials provider + bcrypt + server-side sessions in Postgres

- **Status:** Accepted
- **Date:** 2026-07-11
- **Deciders:** founder (Mavis orchestrator, founder authorization in chat 2026-07-11)

---

## Context

v1 needs authentication that:

- Supports **email + password** sign-in for students, teachers, center admins, and super admins (`MVP_SCOPE.md`, `BOUNDED_CONTEXTS.md → Identity & Access`).
- Stores sessions **in our own database** (no third-party auth service) per `ARCHITECTURE_CONSTRAINTS.md` C3 (self-hosted, no proprietary BaaS) and C5 (security-first, PII protected).
- Plays well with the chosen web framework (Next.js 15, ADR-0003) and the chosen database (Postgres 16, ADR-0004).
- Provides a **stable authorization contract** that the plugin system (ADR-0006) can call into without owning credentials or session logic itself (principle #5 — plugins never touch the DB directly; here extended: plugins never own auth state).
- Resists the most common attacks out of the box: parameter binding, session fixation, CSRF, password storage.
- Is simple enough for a single founder to operate and audit (principle #6, C6).

SMS / OTP and social providers are explicitly **out of scope for v1** per `MVP_SCOPE.md` and are not blocked by this decision — adding them later is a small additive change to the same provider configuration.

## Decision

We adopt **Auth.js (NextAuth) v5** with the **Credentials provider**, **bcrypt** for password hashing, and **server-side session storage in our own Postgres database** via the `@auth/drizzle-adapter`.

Specifically:

- Library: **`next-auth@5` (Auth.js v5)** with the App Router entry point.
- Provider: **Credentials provider only** in v1. No OAuth providers in v1.
- Password hashing: **bcrypt** (cost factor 12). Argon2id is an acceptable drop-in replacement if a future ADR changes this — there is exactly one module boundary for it.
- Sessions: **database sessions** (the Auth.js Drizzle adapter stores sessions in our Postgres). We do **not** use JWT sessions in v1; this is a deliberate choice for revocability and audit.
- Cookies: **`httpOnly`, `secure`, `sameSite=lax`** session cookies. No client-side JS access to the session token.
- CSRF: Auth.js's built-in CSRF token flow for any state-changing endpoint.
- RBAC: a `role` column on the `user` table and a `permissions` table seeded by core; **plugins cannot redefine roles**, but may define new *permissions* on the existing roles (added in a later ADR if needed).
- Tenant resolution: the session token carries the user's `tenant_id`; the per-request Drizzle client (ADR-0004) sets the connection's `app.tenant_id` from the session. No request can touch a row from another tenant.

## Rationale

- **Auth.js** is the de-facto auth library for Next.js, OSS, self-hostable, and well-maintained. The Drizzle adapter is official and works with the database we already chose.
- **Credentials provider** is the right fit for `email + password` (v1 scope). OAuth providers are easy to add later as additional providers in the same `auth.config.ts`.
- **Server-side sessions in our own DB** satisfy C3 and C5, and let us revoke a session instantly (important for the deactivation flows in `BOUNDED_CONTEXTS.md → Identity & Access`).
- **bcrypt at cost 12** is the standard, well-understood, and well-audited choice. argon2id would also be acceptable; we pick bcrypt to keep the dependency surface narrow.
- **Cookies: httpOnly + secure + sameSite=lax** is the modern safe default; Auth.js ships this out of the box with the right config.
- **No JWT** in v1 — we do not need stateless scale-out yet, and we want instant revocation.

### Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Lucia** | Rejected | More code to write and maintain; no first-class Next.js App Router integration story like Auth.js; we'd re-implement session adapters. |
| **Clerk / Auth0 / WorkOS** | Rejected | Proprietary SaaS as the primary auth provider violates `ARCHITECTURE_CONSTRAINTS.md` C3 and `PRODUCT_BIBLE.md §4` (Never: third-party SaaS as primary backend). |
| **Custom JWT auth** | Rejected | Reinvents session handling, CSRF, rotation, and revocation. Violates principle #6. |
| **Auth.js with OAuth-only** | Rejected for v1 | Out of scope per `MVP_SCOPE.md`; we keep OAuth as a future additive. |
| **Auth.js with JWT sessions** | Rejected for v1 | Loses instant revocation and central audit; the Drizzle adapter is already on the table, so the cost of server sessions is near zero. |
| **Argon2id instead of bcrypt** | Deferred | Acceptable alternative; we will switch only if a measured need appears. Single module boundary, low switching cost. |

## Consequences

### Positive

- Sessions are owned by us — full audit, instant revoke, no third-party auth service to pay or trust.
- Plugin authors get a stable, well-typed `auth()` API and never need to read the `user` table directly.
- The Drizzle adapter reuses the database and tooling we already have (ADR-0004).
- Adding SMS/OTP or OAuth providers in v1.1 is additive, not a rewrite.

### Negative

- Password handling means we own a high-stakes code path. We mitigate by using the well-trodden Auth.js + bcrypt path and by treating any change to it as an ADR.
- Credentials provider is more attack surface than an OAuth-only setup; we accept this because email+password is the explicit v1 requirement.
- Server-side sessions add one DB roundtrip per request; negligible on a 4 GB VPS for our SLO (`p95 < 500ms` per `ARCHITECTURE_CONSTRAINTS.md`).

### Neutral

- We do not commit to a specific password policy in this ADR (length, lockout, rate limit). That is a `requirements`-level decision and goes in a follow-up ADR or in `docs/01-product/REQUIREMENTS.md` as a non-binding policy.

## When to revisit

- When SMS/OTP or social login enters v1.1 — a small additive change, not a replacement.
- When a measured attack on the credentials flow forces argon2id or a different KDF.
- When the per-request DB roundtrip becomes a measured bottleneck.
- When a third-party identity provider becomes a product requirement (e.g. SSO for a specific center).

A new ADR is required to overturn this one.

## References

- `docs/01-product/MVP_SCOPE.md` — auth scope (email + password in v1; SMS deferred).
- `docs/02-architecture/BOUNDED_CONTEXTS.md → Identity & Access` — events, RBAC.
- `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` — C3, C5, C6, supporting constraints.
- `docs/00-bootstrap/PROJECT_PRINCIPLES.md` — principles #1, #2, #5, #6.
- ADR-0003 — Next.js 15 (Auth.js v5 is the matching library).
- ADR-0004 — Postgres + Drizzle (the Drizzle adapter is the session store).
- ADR-0006 — plugins will call `auth()`, not the `user` table.
- Auth.js docs: https://authjs.dev/
