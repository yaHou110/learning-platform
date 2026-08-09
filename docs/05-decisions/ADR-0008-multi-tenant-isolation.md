# ADR-0008: Multi-tenant data isolation — confirm shared-schema + `tenant_id` + layered enforcement for v1; defer operational tenancy

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** founder

---

## Context

This ADR answers open question **Q6 — Multi-tenant: subdomain / tenant column / schema?** (`docs/00-bootstrap/PROJECT_STATE.md`), the question gating the schema freeze and consumed by SPRINT-001 milestone **M6**. It is also the isolation decision `ADR-0014` deliberately reserved: ADR-0014 §3 records the **capability-vs-operation split** — v1 stays architecturally multi-tenant-capable (`tenant_id`, no customer assumptions in shared code) without building the operational multi-tenancy layer (onboarding, org admin, self-service provisioning); ADR-0008 *owns* that deferred operational layer's scope and the isolation mechanism.

### What is already decided (this ADR confirms, does not re-decide)

Several isolation mechanics are already locked in binding docs and in the designed (not yet frozen) schema. This ADR's job is to ratify them as a single binding decision and scope the deferred operational layer — not to re-open mechanics that are settled:

- **`ARCHITECTURE_CONSTRAINTS.md` C2** — hard constraint: "Multi-tenant. One deployment serves multiple centers, isolated by `tenant_id`. Data isolation is enforced at more than one layer." This ADR does not weaken C2; it specifies *which* layers.
- **`SYSTEM_ARCHITECTURE.md` §3** — tenancy model: shared database, shared schema, `tenant_id` column on every tenant-scoped table. Tenant identification by **subdomain** in v1, custom domain in v2. Per-tenant config in `tenants.config` JSONB.
- **`DATA_MODEL.md`** — every tenant-scoped table has `tenant_id uuid NOT NULL` + composite index; `users.tenant_id` is NULL only for `super_admin`; `user_roles` is a membership table `PK (user_id, tenant_id, role)`; `audit_log` is tenant-scoped and append-only. Three-layer isolation enforcement is already specified: (1) application layer (query builder defaults `tenant_id`), (2) database layer **Postgres Row-Level Security** `USING (tenant_id = current_setting('app.tenant_id')::uuid)`, (3) test layer (integration tests proving cross-tenant invisibility).

### Forces at play

- **C2 (multi-tenant, more-than-one-layer isolation)** is a hard constraint. "More than one layer" must be honored by the decision, not weakened to a single layer.
- **C1 (single VPS ~4 GB)** and **C6 (low operational complexity)** — a schema-per-tenant or DB-per-tenant model multiplies operational cost (N migrations, N backup stories, fragmented observability) that one founder cannot absorb in v1, and a single 4 GB VPS cannot host cleanly.
- **ADR-0014 capability-vs-operation split** — the *capability* (data carries `tenant_id`, isolation boundaries exist) must be present in v1; the *operation* (self-service onboarding, org-admin surfaces, per-tenant DB provisioning) is deferred. This ADR scopes exactly that deferral.
- **YAGNI (§11 / Project Principle #6)** — do not build per-tenant isolation machinery for customers that do not exist. There is one confirmed customer. The isolation level chosen must be the minimal one that satisfies C2 and keeps *more isolation* reachable later.
- **Cloud SaaS isolation spectrum** — pool (shared schema, `tenant_id`), silo (schema or DB per tenant), and bridge (pool by default, silo per qualifying tenant) are a recognized trade-off space between isolation, cost, and operational complexity. v1 sits at the **pool** end; silo is a documented future *escalation trigger*, not a build-now feature.

### Key terms

- **Tenant** — a business/customer identity served by the platform (e.g. one seminary center). Distinct from **Deployment** (ADR-0007) and from **Customer** (the contract signer). The `tenants` table rows are tenants.
- **Isolation mechanism** — the technical means enforcing "tenant A cannot see tenant B's rows": the chosen v1 mechanism is shared schema + `tenant_id` + multi-layer enforcement; alternatives are schema-per-tenant and DB-per-tenant.
- **Operational tenancy** — the user-facing/admin layer around tenancy: onboarding new centers, organization-level administration, self-service provisioning. This is the layer deferred by ADR-0014 and scoped here.

### Deadline

Before the schema freeze and before M6 of SPRINT-001. Overdue relative to the original target; recording it now unblocks the schema and M6.

---

## Decision

**v1 isolates tenant data with a single shared database + shared schema + `tenant_id` column on every tenant-scoped table, enforced at three layers (application query-builder default, Postgres Row-Level Security, integration tests). The operational tenancy layer (onboarding, org-admin, self-service provisioning) is explicitly deferred. Per-tenant schema/DB isolation (silo) is a documented future escalation trigger, built only when a real customer's requirements force it.**

1. **Isolation mechanism for v1: shared schema + `tenant_id` (the "pool" model).** Confirms `SYSTEM_ARCHITECTURE.md` §3 and `DATA_MODEL.md` as binding. One database, one schema, every tenant-scoped table carries `tenant_id`. This satisfies C2 at minimum operational cost under C1/C6 and is correct for a small number of tenants on a single 4 GB VPS.

2. **Enforced at three layers — C2's "more than one layer" made concrete:**
   - **Application layer** — the query builder / data-access surface in `core` defaults `tenant_id` scoping on every tenant-scoped read and write; `core` is the only package that touches the DB (ADR-0006), so this default is enforced at one chokepoint. Defense in depth: this is layer one, not the only layer.
   - **Database layer — Postgres Row-Level Security** — RLS policies on every tenant-scoped table: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`, with the session setting bound per-request from the resolved tenant context. Even an application bug that omits the `WHERE tenant_id` clause cannot leak rows across tenants; RLS denies by default. This is the second layer.
   - **Test layer** — integration tests asserting tenant A cannot read or reach tenant B's rows; run in CI. This is the third layer and the verification that the first two hold.
   - If any one layer is bypassed, the other two must still prevent leakage. The three layers are intentionally redundant; "more than one layer" (C2) is satisfied with margin.

3. **Tenant identification: subdomain in v1, custom domain in v2.** Confirms `SYSTEM_ARCHITECTURE.md` §3. Tenant context is resolved from the request host (subdomain `tehran.lp.app`); a future custom-domain path extends rather than replaces this. The resolved `tenant_id` drives the per-request RLS session setting and the application-layer scope. (Detailed resolution mechanics — middleware order, fallback for apex/unknown hosts, super_admin cross-tenant mode — are implementation detail owned by the schema-freeze / M5 work, not by this ADR; this ADR commits to the *host-based, server-resolved* principle and the subdomain-first v1 form.)

4. **Membership, not single-ownership, for users.** Confirms `DATA_MODEL.md`: `users.tenant_id` (NULL only for `super_admin`) plus `user_roles PK (user_id, tenant_id, role)`. A user may be associated with more than one tenant via the membership table; identity is not forcibly single-tenant. This is already the designed shape; this ADR ratifies it so the schema freezes with the membership model rather than collapsing it to a `users.tenant_id`-only ownership later.

5. **Content is tenant-scoped by default; global/shared content is a future consideration, not v1.** In v1, `courses`, `lessons`, `media_assets`, `enrollments`, `certificates` all carry `tenant_id` (per `DATA_MODEL.md`); there is no `GLOBAL` content class. The space-sharing pattern (global reusable content + tenant-owned content + tenant-customized copies / inheritance) is a real LMS concern but is **deferred**: no v1 customer needs it yet, and adding a `GLOBAL | TENANT` ownership axis now is premature generalization (YAGNI / §11). It is recorded here as a future evaluation, scoped to fire when a concrete requirement appears (see When-to-revisit).

6. **Operational tenancy is deferred — explicit scope boundary.** The following are **not** v1 work, consistent with ADR-0014 §3: self-service tenant onboarding, an organization-administration surface above the single `center_admin` role, per-tenant DB/schema provisioning, an automated tenant-provisioning pipeline. v1 may ship with a founder/operator creating tenants and assigning `center_admin` via guarded admin paths; the absence of a self-service operational layer is by decision, not by oversight.

7. **Extension/branding stays configuration, not forks — honoring C8 (one code artifact, different configuration).** Customer-specific behavior (branding, theme, logo, domain, terminology, feature flags) lives in `tenants.config` (JSONB) and feature-flag configuration, not in customer-specific code branches. Custom workflows and integrations route through the plugin system (ADR-0006) and configuration, not through forking `core` or any plugin. This re-states ADR-0014 §1/§2 at the tenancy layer; this ADR makes it binding for the isolation decision's scope.

8. **No premature abstraction in the isolation layer.** Nothing here authorizes building a per-tenant schema switch, a tenant-to-isolation-level router, a control plane, or an onboarding UI before a real requirement exists. The future silo/bridge path is *reachable* from this decision (Rationale §3) without being *built* now; reaching for it now would violate §11.

One decision per ADR. The *deployment shape* (how the artifact is delivered and operated) is ADR-0007's decision; this ADR decides only the *data-isolation mechanism and the operational-tenancy scope*. A *content/global-vs-tenant* axis, a *control/data plane* separation, and a *tenant-to-deployment* mapping operational layer are each deferred and recorded as future considerations, not decisions.

---

## Rationale

### 1. Shared schema is the only isolation level that fits C1 + C2 + C6 for a small number of tenants

Per-tenant schema and per-tenant DB both multiply operational cost proportionally to tenant count: N schema migrations instead of one, N backup axes, N observability shards, per-tenant connection-pool pressure. Under a single 4 GB VPS operated by one founder, that cost is not supportable and adds nothing a small tenant set needs. `tenant_id` on every tenant-scoped table is the minimal mechanism that satisfies "one deployment serves multiple centers, isolated by `tenant_id`" (C2) at the lowest operational cost (C6) on the smallest box (C1).

### 2. Three-layer enforcement is how "more than one layer" (C2) is satisfied with margin

C2 does not ask for one isolation mechanism; it asks for isolation enforced "at more than one layer." A single-layer defense (application `WHERE tenant_id = ?`, or RLS alone) leaves a single-bug path to cross-tenant leakage. The application-default + RLS + integration-test triad from `DATA_MODEL.md` makes any single-layer bypass non-sufficient to leak: an app bug omitting the `WHERE` is still blocked by RLS; an RLS misconfiguration is still caught by the application default; both are verified by the test layer. RLS as the database layer is the load-bearing second defense, and is the reason a future schema change cannot silently regress cross-tenant isolation.

### 3. The future isolation levels are reachable without a rewrite

- **Silo (schema-per-tenant or DB-per-tenant) later** → reachable because every already-tenant-scoped table carries `tenant_id`; moving one tenant's data into its own schema or DB is an *extraction + routing* operation over data that is already partition-keyed by `tenant_id`, not a re-modeling. The RLS policy shape and the application-default scope do not depend on a single shared schema at the *interface* — only at the v1 *instance*.
- **Bridge (pool by default, silo per qualifying tenant) later** → reachable as the composition of the chosen pool decision with a future per-customer silo decision. The routing that chooses isolation level per customer is a future operational layer; this ADR's decision composes cleanly into it.
- **Shared-SaaS deployment later** → a shared stack serving many tenants is safe precisely because the isolation this ADR confirms is multi-layer; ADR-0007's deployment shape and this ADR's isolation stack compose to make a future shared SaaS an *addition*, not a re-architecture.

### 4. Confirms ADR-0014's capability-vs-operation split, scoped

ADR-0014 §3 deferred the operational layer to this ADR. This ADR honors that deferral explicitly (Decision §6): the *capability* (data carries `tenant_id`, multi-layer isolation, no customer lock-in) is v1; the *operation* (self-service onboarding, org-admin, provisioning) is deferred. The split is preserved — this ADR does not accelerate or delay operational tenancy relative to ADR-0014; it names the boundary.

### 5. Consistent with §47 precedence and the existing ADR stream

This ADR sits beneath the Product Vision and ADR-0014 and confirms C2 rather than weakening it. It does not re-decide what `DATA_MODEL.md` and `SYSTEM_ARCHITECTURE.md` already lock; it ratifies and scopes. It relates to ADR-0007 (deployment) and ADR-0006 (plugins own no DDL, so `tenant_id` scoping lives in `core`'s one chokepoint) without overlapping their single responsibilities, keeping the ADR stream single-purpose (ADR-0012).

---

## Consequences

### Positive

- ✅ C2's "more than one layer" is satisfied with margin: application default + RLS + integration tests.
- ✅ v1 isolation runs under C1/C6 at minimum operational cost; one schema, one migration, one backup story.
- ✅ Cross-tenant leakage requires breaching two layers, not one — a meaningful security posture for a future organizational/government customer.
- ✅ Future silo/bridge/shared-SaaS isolation levels are reachable from this decision by extraction + routing, not by re-modeling.
- ✅ The membership-shaped identity model (not single-ownership) is ratified, so a user associated with several centers does not require a schema change later.
- ✅ Operational tenancy is scoped out of v1 by binding decision, not by ambiguity — the absence of an onboarding surface is intentional.

### Negative

- ❌ Subdomain-based tenant resolution couples v1 tenant identity to DNS / host configuration; adding custom domains (v2) is additional resolution work, not free.
- ❌ RLS adds a per-query policy-eval cost and a session-setting discipline (`SET LOCAL app.tenant_id` per request). On a 4 GB VPS this is well within the v1 SLO (p95 < 500 ms); it is a cost that earns C2's margin.
- ❌ Contributors must hold the capability-vs-operation distinction: ship multi-tenant *capability*, do not ship multi-tenant *operation*. The Decision §6 scope boundary is the discipline that keeps that productive (mirroring ADR-0014).

### Neutral

- 🔁 A `GLOBAL | TENANT` content ownership axis, control/data-plane separation, and a tenant↔deployment operational mapping are each recorded as future considerations (When-to-revisit), not v1 decisions — reachable without a rewrite but not built on speculation.
- 🔁 `audit_log` is tenant-scoped and append-only today (`DATA_MODEL.md`); a hash-chain / tamper-evident audit is a v2 consideration, unchanged by this ADR.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Shared schema + `tenant_id` + 3-layer enforcement (chosen)** | Accepted | Satisfies C2 with margin under C1/C6; minimal operational cost; future isolation levels reachable by extraction. Confirms `SYSTEM_ARCHITECTURE.md` §3 / `DATA_MODEL.md`. |
| **Schema per tenant (silo) from v1** | Rejected for v1 | N migrations, N backup axes, per-tenant pool pressure on a 4 GB VPS; C6 violation for one founder; no v1 customer requires it. Reachable later per Rationale §3. |
| **Database per tenant (silo) from v1** | Rejected for v1 | Strictest isolation, heaviest operationally; plain infeasible under C1 for more than a tiny tenant count; YAGNI. Reserved for the data-residency / regulatory-isolation trigger. |
| **Shared schema + `tenant_id` + single-layer enforcement (app `WHERE` only)** | Rejected | Violates C2's "more than one layer"; a single app bug omits the `WHERE` and leaks. RLS as the second layer is the load-bearing defense and the reason this is not acceptable. |
| **Full operational tenancy now (onboarding, org-admin, self-service provisioning)** | Rejected for v1 | ADR-0014 §3 defers it; no second customer exists; YAGNI / C6. Building it now is the violation ADR-0014 names, not the v1 scope. |
| **Bridge topology now (pool default + silo per customer + isolation-level router)** | Rejected for v1 | Correct pattern eventually; pure YAGNI cost with one customer and no second stack to route between. Reachable from the chosen decision without a rewrite. |

---

## When to revisit

- **A customer requires data residency or regulatory isolation a shared schema cannot satisfy.** This is the first concrete trigger for silo isolation (schema or DB per tenant) — the bridge model's first instance. A new ADR should record the isolation-level-per-customer decision and the routing before it is built.
- **A large/enterprise tenant's workload risks the shared pool** (noisy-neighbor, scale, or contractual isolation). Same trigger, same path.
- **A need for global / shared / tenant-customized content appears** (Content ownership axis: `GLOBAL` reusable + `TENANT`-owned + tenant-customized copies/inheritance). Fire a new ADR before adding a `GLOBAL | TENANT` ownership column or a content-inheritance model.
- **A user genuinely needs to act across tenants in production at scale** (e.g. an itinerant teacher across several centers) — confirm the membership model (`DATA_MODEL.md` `user_roles`) still holds; if the cross-tenant authorization surface needs shape beyond what the membership table gives, that is a new ADR.
- **Audit requirements harden** (compliance / tamper-evidence) → the deferred hash-chain audit (`DATA_MODEL.md` open question) becomes a new ADR.
- **A control/data-plane separation or a tenant↔deployment operational mapping is operationally justified** (multiple deployments, multiple stacks) → new ADRs; both are reachable from this decision but not built on speculation.

A new ADR is required to overturn this one.

---

## Escalation triggers

Decision §2 (three-layer enforcement), §6 (operational tenancy deferred), §7 (configuration not forks), and §8 (no premature abstraction) state *values*; concrete patterns are matched against them (per the ADR-0014 trigger convention and §58/§59). Before writing into `packages/core/src/db/`, `packages/core/src/api/` (the data-access chokepoint, ADR-0006), tenant-resolution middleware, RLS/migration SQL, or `tenants.config` shape, stop and propose an ADR-style alternative if the change would:

1. **Ship a tenant-scoped table without `tenant_id`, or weaken its enforcement.** Any tenant-scoped table lacking `tenant_id` + a composite index, or an RLS policy gap, re-opens C2's "more than one layer" guarantee. (The intended path is Decision §1/§2; a regression is the anti-pattern.)
2. **Omit or bypass the RLS session setting.** Setting `current_setting('app.tenant_id')` per request is what makes the database layer enforce; a path that reads/writes tenant-scoped rows without the session set collapses three layers to one.
3. **Build operational tenancy prematurely** — self-service onboarding, an org-admin surface above `center_admin`, per-tenant DB/schema provisioning, an automated tenant-provisioning pipeline — before a concrete requirement. (Deferred per Decision §6 / ADR-0014 §3; building it now is the violation, not the trigger.)
4. **Make content customer-global without a decision.** Adding a `GLOBAL | TENANT` ownership axis, a content-inheritance model, or shared-content assignment before a requirement exists — premature generalization (Decision §5 / §8).
5. **Fork the core or a plugin per customer** instead of `tenants.config` + feature flags + the plugin system — the isolation decision's configuration-not-forks rule (Decision §7), same anti-pattern as ADR-0014 trigger #4.

These are **triggers to propose, not to silently generalize**. On a trigger: do not proceed as written; do not add speculative abstraction "to be safe" (violates Decision §8); propose the minimal customer-agnostic alternative, record the trade-off, and route through §59 → §43 (ADR) before implementation.

Two anti-patterns are explicitly *not* triggers here:

- **Adding tenant-scoped tables with proper `tenant_id` + RLS for v1 features** — that is Decision §1/§2 in action, the intended work, not a violation.
- **Adding cross-tenant *capability* (membership rows) when the data model already supports it** — `user_roles` is already membership-shaped (Decision §4); populating it is correct. The trigger is *changing the model*, not *using the existing model*.

---

## References

- [`ADR-0014-reusable-platform-vision.md`](./ADR-0014-reusable-platform-vision.md) — §3 (capability-vs-operation split; this ADR owns the deferred operational layer), §1/§2 (configuration not hardcoding/embedding — reused at Decision §7), §5 (no premature abstraction — reused at Decision §8); escalation-trigger pattern reused.
- [`ADR-0007-hosting-deployment-model.md`](./ADR-0007-hosting-deployment-model.md) — owns the deployment shape; this ADR's isolation stack composes with it for any future shared-SaaS or bridge deployment.
- [`ADR-0006-plugin-architecture.md`](./ADR-0006-plugin-architecture.md) — `core` is the sole DB owner and the application-layer `tenant_id`-scope chokepoint (Decision §2 layer one).
- [`docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md) — C2 (multi-tenant, more-than-one-layer) this ADR satisfies with margin; C1/C6 it respects.
- [`docs/02-architecture/SYSTEM_ARCHITECTURE.md`](../02-architecture/SYSTEM_ARCHITECTURE.md) §3 — tenancy model (shared DB, shared schema, `tenant_id`, subdomain v1 / custom domain v2) this ADR confirms as binding.
- [`docs/02-architecture/DATA_MODEL.md`](../02-architecture/DATA_MODEL.md) — `tenant_id` on every tenant-scoped table, `users.tenant_id` NULL-for-super_admin, `user_roles` membership PK, `audit_log` tenant-scoped append-only, three-layer enforcement specification this ADR ratifies.
- [`docs/00-bootstrap/PROJECT_STATE.md`](../00-bootstrap/PROJECT_STATE.md) — open question Q6 this ADR closes.
- [`docs/03-development/ENGINEERING_PROTOCOL.md`](../03-development/ENGINEERING_PROTOCOL.md) — §11 (avoid unnecessary complexity), §43 (ADR amendment), §47 (precedence), §58/§59 (verify / governance before generation).
