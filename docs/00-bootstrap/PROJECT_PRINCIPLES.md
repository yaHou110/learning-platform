# PROJECT_PRINCIPLES.md

> **This document's responsibility:** State the long-term, *why*-shaped principles that guide every decision in this repository. Principles are binding intent; they are distinct from the hard limits in [`../02-architecture/ARCHITECTURE_CONSTRAINTS.md`](../02-architecture/ARCHITECTURE_CONSTRAINTS.md) and from the technology choices made in ADRs. When a principle and a convenience conflict, the principle wins.

---

## Binding principles

1. **API-first.** Every capability is exposed through an API, not baked into a specific UI.

2. **UI is just another API client.** The web interface has no privileged access to data or logic that an external client could not also have through the API.

3. **Self-host / OSS-first.** Prefer open-source, self-hostable components. Avoid proprietary SaaS where a self-hosted equivalent exists, per `ARCHITECTURE_CONSTRAINTS.md` (C3).

4. **Modular monolith.** Ship one deployable with clear internal boundaries. Do not distribute into services prematurely (see `ARCHITECTURE_CONSTRAINTS.md` C6).

5. **Plugins never access the database directly.** Plugins (built-in or future) reach data only through the core API. The DB handle is never exported outside core.

6. **Simplicity over premature extensibility.** Choose the smaller, maintainable design. Do not build generalization we do not yet need.

7. **Runtime plugins are NOT part of v1.** There is no runtime plugin loader, marketplace, or third-party plugin system in v1.

8. **Requirements drive technology, not the reverse.** Technology is chosen to satisfy documented product requirements and architectural constraints — never adopted first and then justified afterward.

9. **v1 plugin model = internal compile-time modularity only.** The "plugin system" in v1 means clearly separated, compile-time-registered internal modules with a typed manifest. No dynamic code loading, no marketplace, no third-party plugins (refines principles 5, 6, 7).

> These principles refine (and do not delete) related statements elsewhere, such as the plugin rules in [`../02-architecture/PLUGIN_MATRIX.md`](../02-architecture/PLUGIN_MATRIX.md) and the style in [`../02-architecture/SYSTEM_ARCHITECTURE.md`](../02-architecture/SYSTEM_ARCHITECTURE.md). Reconciliation with those docs happens during the relevant ADRs.
