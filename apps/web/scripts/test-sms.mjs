/**
 * Standalone SMS smoke test — proves the Kaveh Negar setup end to end.
 *
 * Usage (from apps/web):
 *   pnpm sms:test --phone 09123456789
 *   pnpm sms:test --phone 09123456789 --message "رویش — پیام آزمایشی"
 *
 * Loads apps/web/.env (without overriding variables already set in the
 * environment), then sends a real SMS through the configured provider.
 * With SMS_PROVIDER=mock it prints what would be sent instead. Exits
 * non-zero on failure so it can be used in scripts/CI.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envFile = join(root, ".env");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? undefined : process.argv[i + 1];
}

const phone = arg("--phone");
if (!phone) {
  console.error("Usage: pnpm sms:test --phone 09xxxxxxxxx [--message \"...\"]");
  process.exit(2);
}

loadDotEnv();

const provider = process.env.SMS_PROVIDER || "mock";
const message =
  arg("--message") ?? "رویش — پیام آزمایشی ارسال پیامک ✅";

console.log(`[sms:test] provider=${provider} to=${phone}`);
console.log(`[sms:test] message=${message}`);

if (provider !== "kavenegar") {
  console.log("[sms:test] SMS_PROVIDER is not \"kavenegar\" — nothing sent. " +
    "Set SMS_PROVIDER=kavenegar and KAVENEGAR_API_KEY in .env to send a real SMS.");
  process.exit(0);
}

const apiKey = process.env.KAVENEGAR_API_KEY;
if (!apiKey) {
  console.error(
    "[sms:test] KAVENEGAR_API_KEY is not set. Add it to apps/web/.env " +
      "(kavenegar.com → پس از ورود → «API Key»)."
  );
  process.exit(1);
}

// Sender is optional — Kaveh Negar uses the account's default line.
const params = new URLSearchParams({ receptor: phone, message });
if (process.env.KAVENEGAR_SENDER) params.set("sender", process.env.KAVENEGAR_SENDER);

let res;
try {
  res = await fetch(
    `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    }
  );
} catch (err) {
  console.error("[sms:test] request failed:", err.message);
  process.exit(1);
}

const data = await res.json().catch(() => null);
const ret = data?.return ?? {};
if (res.ok && ret.status === 200) {
  console.log("[sms:test] ✓ sent (Kaveh Negar return 200)");
  process.exit(0);
}
console.error(
  `[sms:test] ✗ Kaveh Negar rejected the send: HTTP ${res.status}, ` +
    `return ${ret.status}: ${ret.message ?? "(no message)"}`
);
process.exit(1);
