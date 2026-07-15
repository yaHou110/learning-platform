#!/usr/bin/env node
/** Local governance check — skips PR body (use before opening a PR). */
process.env.SKIP_PR_BODY = "1";
process.env.GITHUB_EVENT_NAME = process.env.GITHUB_EVENT_NAME ?? "local";
await import("./validate.mjs");
