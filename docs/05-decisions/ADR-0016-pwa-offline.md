# ADR-0016: PWA / Offline Support

- **Status:** Accepted (decision recorded; implementation parked until M7 sign-off)
- **Date:** 2026-07-21
- **Deciders:** Founder

---

## Context

Open question **Q7 — "Offline / PWA support?"** ([`PROJECT_STATE.md`](../00-bootstrap/PROJECT_STATE.md)) has been carried as "founder, before MVP, ⏳ Pending" across every handover. It repeatedly surfaced as "still pending founder decision (yes/no)" in `PROJECT_BACKLOG.md` and again in M6 evidence notes, because the answer — though the founder had given it verbally — was never captured in any durable artifact. This re-litigation is itself the cost: each sprint the question must be re-asked.

Forces at play:

- **Founder directive 2026-07-11:** all new business features (Catalog, Learning, Credentials, Localization, Dashboard, Event Bus, **PWA**) are out of scope until M7 (Production Readiness Review) sign-off lifts the SPRINT-001 feature gate. So the *decision* can be recorded now, but the *work* cannot start until the gate lifts.
- The platform is an education product; offline-resilient access to course content (slides, transcripts, downloaded lessons) is a meaningful UX win for learners on unreliable connectivity — a stated reason the founder considers PWA necessary.
- PWA implies service-worker infra, a web manifest, caching strategy, and (per Q7's note) unlocks a new **"Learning" bounded context** distinct from the read-only Catalog.
- No deadline as such; it is gated by M7 rather than by a calendar date.

---

## Decision

**Build the platform as a PWA with offline support.** Q7 is decided **YES**.

The durable facts this locks in (so they stop being re-asked):

1. The web app will ship a **web app manifest** + **service worker** with a defined offline/cache strategy (app-shell + stale-while-revalidate for content, cache-first for static assets, network-first for auth/mutations).
2. The "Learning" bounded context (enrollment, progress, offline lesson state) is now **in scope as a future milestone**, gated behind M7 sign-off.
3. This ADR records the **decision** only. **No implementation starts until M7 sign-off** lifts the SPRINT-001 feature gate (per the 2026-07-11 directive).

---

## Rationale

- Several sprints of "Q7 pending" show that an un-recorded decision is, operationally, an undecided one — the friction is the repeated re-asking, not the implementation. Recording the yes now removes the re-litigation tax while still honoring the feature gate.
- Education content is the kind of asset that benefits most from offline-first (large media, read-mostly, low churn) — a strong fit for PWA's strengths and a poor fit for forcing a connectivity requirement.
- Choosing PWA over a separate native client keeps the self-hosted, single-VPS, low-operational-complexity posture (ADR-0007) — one codebase, web-standards, no app-store/release-train overhead.
- Reflects ADR-0014's reusable-platform vision: offline capability is a platform capability, not a per-tenant operation, so it composes cleanly with deferred multi-tenancy (ADR-0008).

---

## Consequences

### Positive
- Learners get resilient access to content on poor/unreliable networks.
- One web codebase serves all platforms; consistent with self-hosted single-VPS posture.
- "Learning" context can be designed offline-aware from the start (local progress sync, conflict-handling via the eventual Event Bus / background-job infra — ADR-0011).
- Re-litigation of Q7 ends here.

### Negative
- Adds a service-worker layer to build, test, and keep coherent with cache-invalidation/versioning (stale content risk after deploys).
- Offline write/progress sync needs a conflict strategy — adds complexity once the Learning context lands.
- Larger test surface (must exercise online/offline/transition states).

### Neutral
- Implementation date is decoupled from the decision date; gated by M7.
- Tech choice (e.g. next-pwa, Workbox, hand-rolled SW) is deferred to a follow-up/task-level decision at implementation time.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| PWA / offline (this ADR) | Accepted | Founder directive "PWA is necessary"; strong content-fit; consistent with low-ops self-hosted posture. |
| Browser-only (no SW, no offline) | Rejected | Loses the offline resilience the founder wants for learners; foregoes a clear product advantage. |
| Native mobile apps | Rejected | Adds app-store/release-train operational complexity antithetical to ADR-0007 (single VPS, low ops); duplicates codebase. |
| Defer the *decision* until M7 | Rejected | Perpetuates the re-litigation cost seen across prior sprints; decision and implementation can be staged independently. |

---

## When to revisit

- If M7 sign-off is repeatedly blocked or the platform pivots away from content-heavy delivery, re-open the **timing** — but the *capability* commitment stands.
- If offline sync conflicts prove intractable, a follow-up ADR could scope PWA down to offline-*read* only (drop offline progress write/sync) without overturning this decision.
- Overturning the yes/no answer entirely requires a new, superseding ADR.

---

## References

- [PROJECT_STATE.md](../00-bootstrap/PROJECT_STATE.md) — Q7 row.
- [PROJECT_BACKLOG.md](../00-bootstrap/PROJECT_BACKLOG.md) — Sprint-001 feature gate (2026-07-11 directive); M7 deferral.
- [ADR-0007](./ADR-0007-hosting-deployment-model.md) — self-hosted single-VPS posture this decision must respect.
- [ADR-0008](./ADR-0008-multi-tenant-isolation.md) — tenancy deferral; PWA is a capability, composes cleanly.
- [ADR-0014](./ADR-0014-reusable-platform-vision.md) — capability vs. operation split (PWA = capability).
- M6 evidence notes — "Q7 still pending founder decision" (now resolved by this ADR).
