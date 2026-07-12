# M4 — Security Hardening — Pre-work checklist (Session 013)

- [x] `pnpm audit --prod --json` captured (`audit-baseline.json`)
- [x] Severity summary documented (28 total: 2C / 8H / 14M / 4L)
- [x] Affected packages identified (`next@15.0.3`, `next-auth@5.0.0-beta.25`, `postcss<8.5.10` transitive)
- [x] Risk classified as CRITICAL per ADR-0013 §42
- [x] DoR + spec drafted (`M4-1-dependency-upgrade.md` — see backlog)
- [ ] **Founder approval** required before M4.1 implementation (per §41)
- [ ] Bump `next` to `>=15.5.16`
- [ ] Bump `next-auth` to `>=5.0.0-beta.30`
- [ ] Re-run all quality gates
- [ ] Re-run `pnpm audit` — expect zero high/critical
