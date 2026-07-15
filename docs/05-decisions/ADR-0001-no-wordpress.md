# ADR-0001: No WordPress — use a custom or framework-native stack

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founder

---

## Context

We need a content + learning platform for seminary families.
The path of least resistance historically has been WordPress + a LMS plugin (LearnDash, TutorLMS, LearnPress).

WordPress was considered for the following reasons:

- Mature ecosystem of LMS plugins.
- Non-developers can manage content via WP Admin.
- Many hosting providers support it out of the box.
- Large community, lots of tutorials in Farsi.

But WordPress was rejected. The reasons are below.

---

## Decision

**This project will not use WordPress — not as CMS, not as headless, not as a dependency.**

We will build on a modern, TypeScript-first, framework-native stack (to be selected in ADR-0003).

---

## Rationale

### 1. Wrong shape for what we are building

WordPress is a *page-based* CMS. Our product is *app-based*: multi-tenant, role-based, with custom workflows (enrollment, progress tracking, certificates, plugin system). We would be fighting WordPress at every turn.

### 2. Plugin hell & long-term maintainability

WP plugins are:
- Written in PHP (no TypeScript, no real types).
- Tightly coupled to WP core, hard to version.
- Often abandoned, breaking on WP upgrades.
- A constant source of CVEs (we are storing student PII).

A custom plugin system on a typed stack (see `PLUGIN_MATRIX.md`) is more work up front but orders of magnitude more maintainable.

### 3. Multi-tenancy

WordPress multi-site (WPMU) is notoriously hard to do well. We need **real data isolation** (see `DATA_MODEL.md` §"Multi-tenant data isolation"). Doing this in WP requires either Multisite (operationally painful) or a complex plugin (security risk).

### 4. Performance & resource cost

A typical WordPress + LMS plugin stack:
- Needs ≥ 1GB RAM for a small instance.
- 20+ plugins to get basic LMS features.
- Slow TTFB without aggressive caching (Redis, full-page cache, CDN).

A typed Node.js + Postgres stack can serve the same load on a fraction of the resources (NFR-009: ≤ 4GB RAM).

### 5. Lock-in & data ownership

WordPress's value proposition is the ecosystem. Our value proposition is **data ownership** (see `PRODUCT_BIBLE.md` §"Anti-vision"). WP and our goals are in tension.

### 6. Farsi/RTL is painful

WordPress themes & plugins are often English-first. Farsi/RTL support in popular themes ranges from "works" to "broken." Persian typography (ی/ک, half-space) is not handled consistently.

### 7. Team velocity

The team (founder + contributors) is TypeScript-fluent. PHP/WordPress is a productivity tax.

---

## Consequences

### Positive

- ✅ Full control over architecture.
- ✅ Strong typing end-to-end → fewer bugs.
- ✅ Cleaner multi-tenant story.
- ✅ Better long-term maintainability.
- ✅ Better Farsi/RTL experience (own components).
- ✅ Smaller resource footprint → lower hosting cost.

### Negative

- ❌ We must build what WordPress gives for free (auth, admin UI, media library, basic CRUD).
- ❌ Longer time to first deploy (M1 in `ROADMAP.md`).
- ❌ We must build our own plugin system (or pick a less-batteries-included option).
- ❌ We take on the responsibility of security updates ourselves.

### Neutral

- 🔁 We can still use headless CMS tools (Sanity, Strapi, Directus) for *content* in the future — they are not WordPress.
- 🔁 We can still use WP as a *blog* if we want a public marketing site. (Unlikely; current intent is custom.)

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **WordPress + LearnDash** | Rejected | All issues above. |
| **Moodle** | Rejected | Outdated UX, not designed for seminary communities, multi-tenant is a hack. |
| **Headless WP + custom frontend** | Rejected | Still inherits WP plugin problems; doubles the stack. |
| **Existing SaaS (Teachable, Thinkific)** | Rejected | Data ownership, no Farsi-first, no multi-tenant for centers. |
| **Custom (chosen)** | Accepted | Best fit for vision, scope, and ownership. |

---

## When to revisit

This decision should be revisited **only** if:

- The custom stack proves unsustainable (M7+ evaluation).
- A binding new requirement (e.g. "must integrate with the official seminary website which is on WP") appears.
- The team composition changes to be PHP-fluent.

A new ADR is required to overturn this one.
