# ADR-0007: Hosting & deployment model — self-hosted single VPS for v1, deployment shape kept abstract

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** founder

---

## Context

This ADR answers open question **Q5 — Hosting: self-hosted / VPS / Iranian host?** (`docs/00-bootstrap/PROJECT_STATE.md`), the question consumed by SPRINT-001 milestone **M6 (Deployment / CI-CD)**. It is also the decision `ADR-0014` deliberately left open: ADR-0014 §4 records only the *intent* that the architecture must not lock out future deployment targets (SaaS, licensed, managed-hosting, customer-specific); **this ADR** records the v1 deployment decision and the abstraction boundary that keeps those future targets reachable.

### Forces at play

- **C1 — single VPS (~4 GB RAM).** The entire system (app + DB + object storage) must run on one small server. No heavy runtimes, no multi-node assumptions. This is a hard constraint (`ARCHITECTURE_CONSTRAINTS.md`).
- **C3 — self-hosted.** Deployable on infrastructure we control. No proprietary backend-as-a-service as the primary store.
- **C6 — low operational complexity.** Minimal moving parts; one person can operate, back up, and upgrade it. A founder-run product cannot absorb a Kubernetes-grade operations burden in v1.
- **Modular monolith, one deployable.** `SYSTEM_ARCHITECTURE.md` §1 and `ADR-0006` already commit v1 to a single deployable produced by `pnpm --filter web build`. The deployment decision must not contradict that.
- **Reusable-platform intent (ADR-0014).** The first deployment is for an Islamic seminary organization, but the codebase is intended to become a reusable platform. `ADR-0014` §1 forbids baking a customer identity or assumption into the deployment; §4 forbids committing to a single deployment model in a way that forecloses SaaS / licensed / managed / customer-specific targets later. The two requirements are not in tension: *v1 ships one dedicated deployment*, while *the code and configuration do not assume that this is the only possible shape*.
- **YAGNI (§11 / Project Principle #6).** Do not build generalization that is not yet needed. There is exactly one confirmed customer. Operational SaaS infrastructure (multi-instance routing, provisioning, billing) is explicitly out of scope for v1 — it belongs, if ever, downstream of a second signed customer, not now.

### Key terms

- **Deployment** — one running installation of the platform (an app process + a DB + object storage), serving one or more tenants. Distinct from **Tenant** (a business/customer identity) and **Customer** (the contract signer); see ADR-0008 for that separation.
- **Deployment model** — *how* the artifact is delivered and operated: dedicated (one stack per customer), shared SaaS (many customers on one stack), licensed (artifact shipped to customer-operated infra), managed (we operate a dedicated stack on behalf of a customer). This ADR picks the v1 model and keeps the others reachable.

### Deadline

This decision is required before **M6 of SPRINT-001** can be planned and executed. It is overdue relative to the original target; recording it now unblocks M5/M6.

---

## Decision

**v1 deploys as one self-hosted dedicated deployment on a single VPS (~4 GB), operated by the founder. The deployment shape is kept abstract so SaaS / licensed / managed / customer-specific delivery is reachable later without a re-architecture — but none of those alternatives is built now.**

1. **Self-hosted, on infrastructure we control.** Honors C1 and C3 directly. The v1 target is a single host: app process + PostgreSQL + S3-compatible object storage. Datasite / hosting provider choice (Iranian host vs. offshore VPS) is an *operational* choice below this ADR — it does not change the architecture.

2. **One deployment for v1.** v1 serves the first customer on exactly one running stack. There is no second instance, no multi-instance routing, no provisioning surface, no per-customer deployment automation. Multi-instance operation is a future escalation, not v1 work.

3. **Dedicated shape, not SaaS.** The v1 deployment is *dedicated*: one stack for one customer. We do **not** operate a central SaaS serving multiple customers in v1. Building the SaaS control plane (tenant provisioning on shared infra, multi-instance operations, billing) is explicitly deferred — it is the operational layer ADR-0014 and ADR-0008 both defer.

4. **Deployment shape kept abstract — a configuration boundary, not a build — honoring C8 (one code artifact, different configuration).** The architectural commitments that keep future deployment targets reachable are deliberately *cheap config + identity hygiene*, not speculative infrastructure:
   - **No customer identity baked into code or config.** The deployed instance is parameterized by a tenant identifier and configuration (`tenants.config`, see `DATA_MODEL.md`), not by a hard-coded customer name, domain, logo, or organization-specific business rule. This is the ADR-0014 §1 / §2 abstractable boundary enforced at the *code* layer; this ADR extends the same boundary to the *deployment* layer: the deployment artifact is identical regardless of customer.
   - **Instance identity externalized to environment / configuration.** Which tenant(s) this deployment serves, the public domain, branding, and feature flags are runtime configuration, not build-time constants. A second dedicated deployment for a different customer is a *re-configuration*, not a *fork*.
   - **Single deployable artifact.** `pnpm --filter web build` produces one artifact (ADR-0006). That artifact runs identically whether it is the first customer's dedicated VPS today or a future managed deployment — the difference is configuration and surrounding infra, not code.

5. **No premature abstraction in the deployment layer.** Nothing in this ADR authorizes building a deployment-router, a control plane, an instance-provisioning service, or multi-tenant SaaS billing. The abstraction is *re-configurability and identity hygiene*, which is already required by ADR-0014 §1/§2 and costs nothing extra. We resist the converse error (speculative generalization) just as firmly as the embedding error (per ADR-0014 §5).

One decision per ADR. The *isolation mechanism* for the data the deployment serves (shared schema vs. per-tenant schema vs. per-tenant DB) is ADR-0008's decision, not this one's. This ADR decides only the *deployment shape*.

---

## Rationale

### 1. It is the only option that satisfies C1 + C3 + C6 simultaneously for one customer

A central SaaS for v1 is rejected by YAGNI (no second customer exists) and by C6 (provisioning and multi-instance operations are real operational load a founder should not absorb now). A licensed/managed shape is a *future* target, not a v1 starting point — it presupposes a packaged, documented, externally-operable product that v1 is not yet. Self-hosted single-VPS dedicated is the minimal shape that runs the actual product under the actual constraints.

### 2. It keeps ADR-0014's promise without paying for it twice

ADR-0014 already requires that the *architecture* not lock out future deployment targets. The cheapest way to keep that promise at the deployment layer is the boundary in Decision §4: identical artifact, customer identity in configuration not code. We do not need a deployment-control-plane to honor "the architecture does not foreclose SaaS" — we need *not to bake in the opposite assumption*. A deployment that is re-configurable rather than forked is exactly the capability/operation split, applied to deployment.

### 3. The future paths are reachable from this decision without a rewrite

- **Shared SaaS later** → a second stack instance serving multiple tenants is an *addition* (a new deployment + tenant routing), not a change to the artifact. The data-side isolation that makes a shared stack safe is ADR-0008's concern and is already capability-present.
- **Managed / customer-specific later** → the same artifact, re-configured, run by us or by the customer. Identity hygiene (Decision §4) is what makes "ship the artifact to customer-operated infra" a re-configuration rather than a fork.
- **Dedicated-per-large-customer later (bridge / silo model)** → one stack per qualifying customer, sharing nothing. Reachable because the artifact is identical across stacks; the routing/migration that *chooses* isolation level per customer is a future operational layer, not v1 code.

### 4. Consistent with §47 precedence and the existing ADR stream

This ADR sits beneath the Product Vision and ADR-0014. It does not weaken C1, C3, or C6; it realizes them. It does not decide the isolation mechanism (ADR-0008) or the operational tenancy layer (deferred); it keeps the ADR stream single-responsibility (one decision per ADR, per ADR-0012).

---

## Consequences

### Positive

- ✅ v1 runs under C1/C3/C6 as literally specified — one VPS, one process, self-hosted, one-person-operable.
- ✅ The deployment artifact is customer-agnostic by construction; future customers are re-configurations, not forks.
- ✅ Future deployment targets (SaaS, licensed, managed, dedicated-per-customer) remain open and reachable without an architecture rewrite.
- ✅ The deployment decision and the isolation decision (ADR-0008) are cleanly separable, so each can evolve independently.

### Negative

- ❌ Some deployment-time configuration indirection (domain, branding, which tenant(s) this stack serves) is required even while only one customer exists — a small present cost for a future option, consistent with ADR-0014's negative-consequence framing.
- ❌ Operators must hold two ideas at once: run one dedicated deployment now, while not hard-coding the assumption that there will only ever be one. The "re-configurable, not forked" rule is the discipline that keeps that productive.

### Neutral

- 🔁 The specific hosting provider (Iranian host vs. offshore VPS) is an operational choice beneath this ADR and may change per deployment without architectural impact.
- 🔁 TLS termination (the deferred HSTS from M4.2), CDN in front of static assets, and the backup-retention schedule (daily snapshot + 30-day, per `SYSTEM_ARCHITECTURE.md` §9) are deployment operational details owned by the M6 execution, not by this ADR.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Self-hosted single-VPS dedicated deployment, shape kept abstract (chosen)** | Accepted | Satisfies C1 + C3 + C6 for one customer; honors ADR-0014's "do not foreclose future targets" via re-configurability, not via speculative infrastructure; consistent with YAGNI. |
| **Central SaaS from day one** | Rejected for v1 | No second customer exists. Multi-instance provisioning, routing, and billing are operational load C6 forbids now and ADR-0014/A2 defers. The right shape eventually, not the v1 shape. |
| **Pure single-tenant deployment, no abstraction** | Rejected | Forecloses the deployment targets ADR-0014 §4 explicitly leaves open (SaaS, licensed, managed, customer-specific). Baking the one-customer assumption into the deployment is exactly the "lock a single deployment model" anti-pattern ADR-0014 §3 escalation trigger #3 names. |
| **Bridge / hybrid deployment topology (shared + dedicated coexisting) now** | Rejected for v1 | A real multi-topology operation (some tenants shared, some dedicated) with per-customer isolation routing. Correct *pattern* eventually; pure YAGNI cost now with one customer and no second stack to route between. Reachable from the chosen decision without a rewrite (Rationale §3). |
| **Customer-licensed / managed-hosting shape now** | Rejected for v1 | Presupposes a packaged, documented, externally-operable product v1 is not yet. Future target; not the v1 starting point. |

---

## When to revisit

- **A second customer is signed.** The operational layer this ADR defers (multi-instance routing, provisioning, possibly bridge/silo per-customer isolation) becomes real work; a new ADR (or a revision of this one) decides the multi-deployment topology. The artifact identity/re-configurability from Decision §4 is what makes that transition a *growth*, not a *rewrite*.
- **A customer requires data residency or regulatory isolation** that a shared-stack deployment cannot satisfy → trigger that customer onto a dedicated (silo) deployment. This is the bridge model's first concrete trigger; it should fire a new ADR before building the routing.
- **Operational complexity of running multiple dedicated stacks exceeds one person** → a control / management plane becomes justified by evidence (per §11 — scale based on evidence of need, not anticipated growth).
- **A product-strategy shift toward or away from reusability/SaaS** → a new ADR would be required to overturn this one's shape.

A new ADR is required to overturn this one.

---

## Escalation triggers

Decision §4 ("shape kept abstract — configuration boundary, not a build") and §5 ("no premature abstraction") state *values*; concrete patterns are matched against them (per the standing ADR-0014 trigger convention and §58/§59). Before changing deployment, build, or environment/configuration code (`apps/web/next.config.mjs`, `docker-compose.yml`, deployment manifests, `.env` handling, `apps/web/src/lib/env.ts`, or any new `docs/07-deployment/` artifact), stop and propose an ADR-style alternative if the change would:

1. **Bake a customer identity into the deployment** — a hard-coded customer name, domain, logo path, or organization-specific value embedded in build config, Docker image labels, environment defaults, or the artifact itself, rather than read from tenant configuration / environment at runtime. (The intended path is Decision §4; embedding is the anti-pattern.)
2. **Lock the deployment to a single model at the code layer** — build / runtime code that cannot later be operated as dedicated, managed, or shared-SaaS without a rewrite, foreclosing the targets ADR-0014 §4 and this ADR leave open.
3. **Introduce multi-instance operational infrastructure prematurely** — a deployment control plane, instance-provisioning service, multi-tenant routing layer, or per-deployment billing wiring built before a second deployment exists. (Deferred per Decision §3/§5 and ADR-0014/A2; building it now is itself the violation, not the trigger.)
4. **Fork the artifact per customer** — producing a customer-specific build or a customer-specific Docker image instead of one identical artifact parameterized by configuration.

These are **triggers to propose, not to silently generalize**. On a trigger: do not proceed as written; do not add speculative abstraction "to be safe" (that violates Decision §5); propose the minimal customer-agnostic alternative, record the trade-off, and if it changes architecture route through §59 → §43 (ADR) before implementation.

Two anti-patterns are explicitly *not* triggers here, to prevent this ADR from becoming a pretext for premature work:

- **Building the multi-deployment / SaaS control plane** — deferred; building it now is the violation, not the trigger.
- **Adding deployment re-configurability for a hypothetical second customer when the first needs nothing new** — YAGNI via §11 / Principle #6; the re-configurability already required by ADR-0014 §1/§2 is the cost ceiling for this ADR.

---

## References

- [`ADR-0014-reusable-platform-vision.md`](./ADR-0014-reusable-platform-vision.md) — §1 (no customer identity in shared code), §4 (deployment model deferred to this ADR), §5 (no premature abstraction); the escalation-trigger pattern reused here.
- [`ADR-0006-plugin-architecture.md`](./ADR-0006-plugin-architecture.md) — "one deployable" produced by `pnpm --filter web build`; this ADR's deployment shape rides on that single artifact.
- [`ADR-0008`](./ADR-0008-multi-tenant-isolation.md) — owns the data-isolation decision that complements this deployment decision; the two are cleanly separable.
- [`docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md) — C1 (single VPS ~4 GB), C3 (self-hosted), C6 (low operational complexity), **C8 (one code artifact, different configuration)** this decision satisfies.
- [`docs/02-architecture/SYSTEM_ARCHITECTURE.md`](../02-architecture/SYSTEM_ARCHITECTURE.md) §9 — deployment topology (single VPS, daily DB snapshot + 30-day retention, CDN in front of assets) this ADR confirms and leaves operational detail to M6.
- [`docs/02-architecture/DATA_MODEL.md`](../02-architecture/DATA_MODEL.md) — `tenants.config` JSONB is the configuration surface the deployment is parameterized through (Decision §4).
- [`docs/00-bootstrap/PROJECT_STATE.md`](../00-bootstrap/PROJECT_STATE.md) — open question Q5 this ADR closes.
- [`docs/03-development/ENGINEERING_PROTOCOL.md`](../03-development/ENGINEERING_PROTOCOL.md) — §11 (avoid unnecessary complexity), §43 (ADR amendment), §47 (precedence), §58/§59 (verify / governance before generation).
