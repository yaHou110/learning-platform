# ADR-0019: Current platform truth and evidence discipline

- **Status:** Accepted
- **Date:** 2026-08-07

## Context

The repository contains several historical product documents written before the Catalog/Learning slice, national-ID authentication, password recovery, and the Vercel + Railway deployment decision were implemented. Some documents therefore describe planned or superseded behavior as if it were current.

The product has also moved toward a family and cultural identity while the implemented domain model remains primarily course and lesson oriented. This creates a commercial and engineering risk: a reader may mistake UI direction, schemas, manifests, or historical evidence for complete end-to-end functionality.

## Decision

`docs/00-bootstrap/CURRENT_IMPLEMENTATION_TRUTH.md` is the canonical current-state snapshot for audits, demos, and commercial discussions.

Every capability claim must be classified as one of:

- Implemented
- Partial
- Planned
- Unverified

Claims must cite evidence and distinguish source code from tested, manually verified, and production-verified behavior.

The following are the current baseline facts:

1. Product name and direction: **رویش — سامانه فرهنگی، تربیتی حوزه و خانواده**.
2. Implemented core: Persian RTL modular learning platform with authentication, password recovery, tenant-scoped courses, lessons, enrollments, progress, certificate endpoints, observability, and deployment configuration.
3. Authentication: national ID + numeric center ID + password; Auth.js JWT sessions; bcrypt password hashing.
4. Family/cultural functionality: present in product direction and dashboard presentation, but persistent family, child, campaign, competition, trip, event, and participation domains remain planned.
5. Cloud deployment target: Vercel + Railway; Docker Compose is the local full-stack verification lane; production object storage is not wired in v1.
6. RLS is provisioned as defense-in-depth but is not represented as a fully activated non-owner runtime boundary until the documented activation work is complete.

Historical ADRs, changelogs, sprint evidence, and handover records remain append-only. They are not rewritten to erase history. When an older claim conflicts with the current baseline, the current truth document and this ADR take precedence for present-tense decisions.

## Consequences

- Commercial claims become more defensible and less likely to overstate the product.
- Future implementation work can target the largest gap: converting the family/cultural UI direction into a persisted domain model and real workflows.
- Historical documents remain useful as context but must not be treated as current status without cross-checking the truth document.
- Product and engineering contributors must update the truth document when a meaningful capability changes state.

## Non-goals

This ADR does not implement family-domain features, change authentication behavior, migrate sessions, enable RLS FORCE mode, or change deployment infrastructure.
