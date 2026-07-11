# Changelog

All notable changes to the **Hawza Family Learning Platform** repository will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention**: each repo-level version is the documentation OS version (AI Project OS),
> not the product version. Product versions are tracked in `docs/01-product/ROADMAP.md`.

---

## [1.0.0] — 2026-07-10

### Added
- **AI Project OS v1.0** — documentation system is live.
- Repository skeleton: `README.md`, `AGENTS.md`, `LICENSE`, `CHANGELOG.md`.
- `docs/00-bootstrap/` — `PROJECT_BOOTSTRAP.md`, `MASTER_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_SESSION.md`.
- `docs/01-product/` — `PRODUCT_BIBLE.md`, `REQUIREMENTS.md`, `FEATURE_CATALOG.md`, `PERSONAS.md`, `ROADMAP.md`.
- `docs/02-architecture/` — `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
- `docs/03-development/` — `TECH_STACK.md` (skeleton).
- `docs/05-decisions/` — `DECISIONS.md`, `ADR-0001-no-wordpress.md`, `ADR-0002-ai-project-os.md`.
- `templates/` — `HANDOFF_TEMPLATE.md`, `SESSION_NOTES.md`, `ADR_TEMPLATE.md`, `FEATURE_REQUEST.md`.

### Changed
- Decision: this project will NOT use WordPress. Rationale in `ADR-0001`.
- Decision: documentation will be AI-native, agent-portable. Rationale in `ADR-0002`.

### Not yet done (intentionally)
- No source code yet. v1.0 is documentation only.
- No deployment artifacts. See `docs/07-deployment/` (not yet created).
- No CI/CD. See `docs/03-development/GIT_STRATEGY.md` (not yet created).

---

## How to add a new entry

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
```

Append-only. Never edit historical entries.
