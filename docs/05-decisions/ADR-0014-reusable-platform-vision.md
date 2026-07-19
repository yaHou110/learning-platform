# ADR-0014: Reusable platform vision (first customer, not the only customer)

- **Status:** Accepted
- **Date:** 2026-07-18
- **Deciders:** Founder

---

## Context

The first deployment of this platform is for an Islamic seminary organization. The
long-term product strategy, however, is to evolve this codebase into a **reusable learning
platform** that can later be deployed for more than one organization. The first customer is
*a first customer*, not *the only customer*.

This is a **directional vision recorded as a binding architectural intent**, not a commitment
to build every customer-facing feature now. It exists because several unforced architectural
choices — hardcoding a customer name, embedding customer-specific assumptions into shared code,
or picking a data shape that cannot later carry more than one organization — are cheap to
avoid today and expensive to undo later. ADR-0002 already requires decisions to be recorded
explicitly; this ADR records the reusable-platform intent so those choices are made on
purpose rather than by accident.

Two forces shape the decision:

1. **Reusability is a long-term value.** The shared core (authentication, authorization, user
   management, course engine, lesson engine, quiz engine, media, certificates, notifications,
   audit logging, search, CMS, admin, APIs, shared UI) should be customer-agnostic.
   Customer-specific behavior (branding, theme, logo, domain, terminology, custom workflows,
   reports, integrations, optional modules) should stay isolated where practical.

2. **YAGNI governs the present.** `ARCHITECTURE_PRINCIPLES.md` §11 and
   `PROJECT_PRINCIPLES.md` #6 both bind against premature abstraction, premature
   distribution, and rewriting stable code without clear long-term value. This vision must
   not become a pretext for speculative generalization.

### The tension this ADR settles

A genuine conflict exists between two existing binding surfaces, and this ADR resolves it:

- **`ARCHITECTURE_CONSTRAINTS.md` C2** is a hard constraint: *"Multi-tenant — One deployment
  serves multiple centers, isolated by `tenant_id`."*
- The **Product Vision** (`PRODUCT_BIBLE.md`) and the new reusable-platform sections state
  that real operational multi-tenancy is *deferred to ADR-0008* and not required for v1.

Read naively these contradict. They do not. The reconciliation is that **capability and
operation are different layers**:

- **C2 is an architectural constraint.** It means the code, data model, and isolation
  boundaries must not *foreclose* multi-tenancy. `tenant_id` is part of the data model from
  day one; customer names and customer-specific assumptions are not embedded in shared code;
  configuration is preferred over hardcoding. This stands unchanged.
- **ADR-0008 (deferred) is about operational multi-tenancy.** The onboarding flow for new
  centers, organization-level administration surfaces, self-service provisioning, and the
  specific *isolation mechanism* (subdomain vs tenant column vs schema) are not built in v1.
  Deferring those does not weaken C2; it scopes what v1 ships.

So v1 is **architecturally multi-tenant-capable** without being **operationally multi-tenant
in production**. C2 holds; the deferred work is the user-facing and provisioning layer, which
ADR-0008 owns.

---

## Decision

**We adopt a reusable-platform intent as binding architectural direction, scoped by YAGNI.**

1. **The project is a product platform, not a customer-specific build.** The shared core is
   authored as customer-agnostic; customer-specific behavior stays isolated where practical
   (branding, theme, domain, terminology, custom workflows, reports, integrations, optional
   modules).

2. **Configuration over hardcoding, wherever practical.** Feature flags, branding,
   localization, organization settings, and permission mappings are preferred over embedded
   constants. Customer names and customer-specific assumptions must not be embedded into
   shared code.

3. **Capability, not premature feature.** v1 keeps the multi-tenant *capability* required by
   C2 (data model, isolation boundaries, no customer lock-in) but does **not** build the
   operational multi-tenancy features (onboarding, org admin, self-service provisioning). Those
   are deferred to ADR-0008. This is the explicit reconciliation of C2 with the Product Vision.

4. **Deployment model is not decided here.** Whether the platform is later offered as SaaS,
   licensed, managed-hosting, or customer-specific is a deployment decision deferred to
   ADR-0007. This ADR records only the *intent* that the architecture must not lock out those
   deployment targets.

5. **No premature abstraction.** Nothing in this vision authorizes speculative refactors, a
   rewrite of stable code, or generalization without clear long-term value. Changes are made
   only where they provide clear long-term value (per §11 / Principle #6).

6. **Ownership.** Reusable-platform IP stays with the founder/creator in the long term;
   customer-specific customizations are kept separable where practical. Real ownership and
   licensing per deployment remain subject to the customer contract; this vision records intent
   only.

This ADR does **not** change product requirements, coding standards, or any technology choice.
It does not supersede C2, ADR-0007, or ADR-0008; it relates them.

---

## Rationale

### 1. Cheap today, expensive later

The architectural choices this vision protects against — embedding a customer name, locking a
single-tenant data shape — are nearly free to avoid now and very costly to reverse after code
stabilizes. Recording the intent as binding direction makes those choices deliberate rather
than incidental.

### 2. Compatible with YAGNI, not in tension with it

The obvious objection is Principle #6 / §11: "do not build generalization we do not yet need."
This ADR honors that by distinguishing **capability** from **feature**. Keeping `tenant_id` in
the data model and customer names out of shared code is a capability that costs almost nothing;
building onboarding flows and org-admin UI is a feature that is deferred. The vision creates no
demand for premature abstraction because it explicitly forbids it (Decision §5).

### 3. Resolves the C2 vs Product Vision surface conflict

Without this ADR, C2 and the Product Vision read as contradicting on whether v1 is
multi-tenant. The capability-vs-operation split gives both documents a single coherent reading,
and §47 precedence (Security > Product Vision > ADRs > …) is respected: this ADR sits beneath
the Product Vision and clarifies it, it does not override C2.

### 4. Consistent with §47 precedence and existing ADRs

This ADR changes no precedence rank. It points at ADR-0007 (deployment) and ADR-0008
(isolation mechanism) as the owners of the decisions it deliberately does not make, which keeps
the ADR stream single-responsibility (ADR-0012 §"one decision per ADR").

---

## Consequences

### Positive

- ✅ Reusability is protected from day one without speculative work.
- ✅ C2 and the Product Vision now read as one coherent position, removing a real surfacing conflict.
- ✅ Customer-specific behavior stays isolated, so future customers do not fork the core.
- ✅ Deployment targets (SaaS, licensed, managed, customer-specific) remain open, deferred to ADR-0007.

### Negative

- ❌ Some configuration indirection (branding, settings, permission mappings) is required even while only one customer exists — a small present cost for a future option.
- ❌ Contributors must hold two ideas at once: build for reusability, but do not build unused generalization. This ADR's capability-vs-feature framing is the rule that keeps that tension productive.

### Neutral

- 🔁 Real multi-tenancy (operational) still arrives via ADR-0008; this ADR does not accelerate or delay it.
- 🔁 Ownership/licensing per deployment remains contract-driven; this ADR records intent only.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Treat the platform as a customer-specific build for v1** | Rejected | Bakes customer assumptions into the core; very costly to reverse; contradicts the long-term product strategy. |
| **Build full operational multi-tenancy now** | Rejected | Violates §11 / Principle #6 (YAGNI); defers to ADR-0008 by design; premature onboarding/org-admin work without a second customer. |
| **Weaken C2 to a "target" to match the Product Vision** | Rejected | Loses the hard constraint that keeps multi-tenancy recoverable; the capability-vs-operation split preserves C2 without weakening it. |
| **Record reusable-platform intent as a non-ADR vision note** | Rejected | ADR-0002 requires binding decisions to be recorded as ADRs; `PRODUCT_BIBLE.md` and `PROJECT_ARCHITECTURE_CONTEXT.md` already reference ADR-0014 as the binding record. A non-ADR note would leave those references dangling. |
| **Reusable-platform intent scoped by YAGNI + capability/operation split (chosen)** | Accepted | Protects reusability, honors YAGNI, resolves the C2/Vision conflict, fits §47 precedence. |

---

## When to revisit

- **ADR-0008 lands** and decides the isolation mechanism → confirm this ADR's "capability, not feature" framing still holds; amend only if ADR-0008 materially changes v1's multi-tenant capability.
- **A second customer is signed** → the operational layer this ADR defers becomes real work; ADR-0008 (and possibly ADR-0007) execute it.
- **Evidence shows configuration indirection is costing more than the option is worth** → revisit whether to relax certain isolations (without embedding customer assumptions into shared code).
- **A future product-strategy shift away from reusability** → a new ADR would be required to overturn this one.

A new ADR is required to overturn this one.

---

## References

- [`ADR-0002-operating-manual.md`](./ADR-0002-operating-manual.md) — binding decisions must be recorded as ADRs; append-only history.
- [`ADR-0012-engineering-protocol.md`](./ADR-0012-engineering-protocol.md) — one decision per ADR.
- [`ADR-0013-engineering-protocol-v2.md`](./ADR-0013-engineering-protocol-v2.md) — §47 rule priority.
- [`DECISIONS.md`](./DECISIONS.md) — ADR-0007 (deployment) and ADR-0008 (multi-tenant isolation) are the owners of the decisions this ADR defers.
- [`docs/01-product/PRODUCT_BIBLE.md`](../01-product/PRODUCT_BIBLE.md) §2.1, §7.1–7.3 — the product-vision sections that reference this ADR.
- [`docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md) — C2 (multi-tenant hard constraint), C1 (single VPS).
- [`docs/02-architecture/ARCHITECTURE_PRINCIPLES.md`](../02-architecture/ARCHITECTURE_PRINCIPLES.md) — §11 (avoid unnecessary complexity).
- [`docs/00-bootstrap/PROJECT_PRINCIPLES.md`](../00-bootstrap/PROJECT_PRINCIPLES.md) — #6 (simplicity over premature extensibility).
