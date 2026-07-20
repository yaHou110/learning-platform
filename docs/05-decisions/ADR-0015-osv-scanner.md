# ADR-0015: OSV Scanner for Dependency Vulnerability Scanning

- **Status:** Accepted
- **Date:** 2026-07-19
- **Deciders:** Founder

---

## Context

The project previously relied on `pnpm audit` (npm advisory endpoint) for dependency vulnerability scanning. The npm advisory endpoint has been deprecated (HTTP 410), making `pnpm audit` unreliable/unavailable.

We need a replacement that:
- Works with `pnpm-lock.yaml` (not just `package-lock.json`)
- Has no external API key requirement (zero-config for contributors)
- Integrates with GitHub Security tab (SARIF upload)
- Is deterministic and traceable (no runtime downloads)
- Aligns with the project's governance (ADR + Engineering Protocol + Governance checklist)

---

## Decision

**Adopt OSV Scanner (google/osv-scanner) as the dependency vulnerability scanning tool.**

Implementation details:
1. **Local command:** `pnpm security:audit` — wraps `osv-scanner scan --lockfile=pnpm-lock.yaml`
   - Requires `osv-scanner` binary in PATH (explicit install, no auto-download)
   - Clear install hint on missing binary
2. **CI:** Official GitHub Action (`google/osv-scanner@v1`)
   - Runs on push/PR touching `pnpm-lock.yaml` + weekly schedule
   - Uploads SARIF to GitHub Security tab
   - Prints table summary in workflow run
3. **Documentation:** Install instructions in `DEVELOPMENT_GUIDE.md`
4. **Script:** `scripts/security/audit.mjs` — PATH check + install hint, no magic

---

## Rationale

| Factor | Why OSV Scanner wins |
|--------|---------------------|
| **Lockfile support** | Native `pnpm-lock.yaml` support (not just npm) |
| **Zero-config** | No API key, no account, no rate limits — uses public OSV database |
| **CI integration** | Official GitHub Action + SARIF upload = GitHub Security tab visibility |
| **Governance fit** | Explicit PATH check = deterministic, traceable, air-gap friendly |
| **Maintenance** | Actively maintained by Google, used in production at scale |
| **Future-proof** | Supports `security:secrets`, `security:licenses` namespace expansion |

---

## Consequences

### Positive
- Reliable vulnerability scanning restored (npm endpoint deprecation solved)
- Results visible in GitHub Security tab (SARIF)
- Contributors install once, run anywhere — no hidden network calls
- Weekly scheduled scan catches new CVEs in locked deps
- Clean namespace (`pnpm security:audit`) for future security commands

### Negative
- Contributors must install `osv-scanner` manually (one-time)
- Not a Node.js native package (Go binary) — but official releases for all platforms exist
- Slightly larger CI job (downloads binary) — negligible on ubuntu-latest

### Neutral
- Replaces `pnpm audit` entirely (different output format, different DB)
- `pnpm audit` remains available but deprecated for this project

---

## Alternatives considered

| Option | Verdict | Why |
|--------|---------|-----|
| **Snyk CLI** | Rejected | Requires API key / account; free tier limits; commercial |
| **GitHub Dependabot alerts** | Rejected | Passive (alerts only), no local CLI, no SARIF upload control |
| **`pnpm audit` (wait for fix)** | Rejected | npm endpoint deprecated; no timeline for replacement |
| **Runtime auto-download osv-scanner** | Rejected | Supply-chain risk; non-deterministic; fails offline/air-gapped |
| **Commit osv-scanner.exe in repo** | Rejected | Cross-platform binary bloat; no verification; violates binary-free repo policy |

---

## When to revisit

- OSV Scanner adds native `pnpm audit` compatibility layer
- A Node.js-native vulnerability scanner with OSV support reaches maturity
- Project migrates off pnpm (unlikely)

---

## References

- OSV Scanner: https://github.com/google/osv-scanner
- OSV Database: https://osv.dev/
- GitHub Action: https://github.com/google/osv-scanner/tree/main/github-action
- SARIF format: https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning
- Governance: `DEVELOPMENT_GUIDE.md`, `ENGINEERING_PROTOCOL.md`, `GOVERNANCE_CHECKLIST.md`