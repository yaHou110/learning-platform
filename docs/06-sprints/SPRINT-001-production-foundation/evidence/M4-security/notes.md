# M4 — Security Hardening — Audit baseline

> **Captured:** Session 013 (2026-07-12)
> **Tool:** `pnpm audit --prod --json` (full JSON in `audit-baseline.json`)
> **Severity summary:** 4 low · 14 moderate · 8 high · 2 critical · **28 total**

## Why this is a finding

While completing the M3 evidence gap, a routine `pnpm audit` was run as part of the M4 "secret management / vulnerability scanning" pre-work. It surfaced **28 known vulnerabilities** in the current dependency set, almost entirely in the framework layer (`next@15.0.3` and `next-auth@5.0.0-beta.25`).

## Top-of-list packages (full list in JSON)

| Package | Vulnerable range | Patched range | Notes |
|---|---|---|---|
| `next` | `>=15.0.0 <15.5.16` | `>=15.5.16` | DoS, SSRF, cache poisoning, CSP-nonce XSS, source code exposure |
| `next-auth` | `>=5.0.0-beta.0 <5.0.0-beta.30` | `>=5.0.0-beta.30` | Email misdelivery |
| `postcss` | `<8.5.10` | `>=8.5.10` | XSS via unescaped `</style>` in CSS stringifier (transitive via `next`) |

## Severity breakdown

- **2 CRITICAL** — see `audit-baseline.json` `metadata.vulnerabilities.critical` entries.
- **8 HIGH** — most are in `next` middleware/redirects and cache handling.
- **14 MODERATE** — DoS, image optimizer, server actions.
- **4 LOW** — dev-server origin checks, race conditions.

## Risk classification (ADR-0013 §42)

This finding is **CRITICAL** because:
1. It is a production-runtime vulnerability (not a dev-only issue).
2. The simplest fix (one bump) is non-trivial: `next@15.0.3 → 15.5.16` is 5 minor versions forward with potential breaking changes, and `next-auth@5.0.0-beta.25 → 5.0.0-beta.30` is still in beta.
3. Self-hosted LMS over the public internet = the attack surface is the entire user base.

## Required actions

1. **M4.0** — DoR + spec + risk matrix for the dependency upgrade (this session).
2. **M4.1** — Bump `next` to `15.5.16+` and `next-auth` to `5.0.0-beta.30+` in a dedicated branch.
3. **M4.2** — Re-run all five quality gates; fix any breaking-change fallout.
4. **M4.3** — Re-run `pnpm audit`; expect zero high or critical.
5. **M4.4** — Update CHANGELOG / handoff / commit.

## Files

- `audit-baseline.json` — full machine-readable pnpm audit output (28 advisories).

## Status

🔴 **M4 dependency upgrade required before M2 smoke test can resume** (the PostgreSQL blocker is real, but this security bug is higher priority).
