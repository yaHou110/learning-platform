/**
 * Environment variable validation.
 *
 * Called once at startup (import side-effect). Throws in production if
 * required variables are missing. In development, uses safe defaults
 * so the app boots without a `.env` file (with a console warning).
 */

const isProd = process.env.NODE_ENV === "production";

/**
 * Known insecure / placeholder `AUTH_SECRET` values that must never reach a
 * production boot. If an operator copies `.env.example` (which documents
 * `replace-me-in-production-32-bytes-minimum`) into a prod env file, this
 * denylist refuses to boot instead of issuing JWT/session tokens signed by a
 * publicly-known, repo-committed secret (⇒ token forgery = full takeover).
 */
const KNOWN_INSECURE_SECRETS = new Set([
  "dev-secret-change-in-production",
  "replace-me-in-production-32-bytes-minimum",
]);

/** Minimum secret length. Auth.js / JWT signing wants ≥32 bytes of entropy. */
const MIN_SECRET_BYTES = 32;

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    if (isProd) {
      throw new Error(
        `[env] Required environment variable "${name}" is not set. ` +
          "Set it in your deployment environment or .env file."
      );
    }
    console.warn(
      `[env] WARNING: "${name}" is not set. Using insecure dev default. ` +
        "Set this in .env or your environment before deploying."
    );
  }
  return value ?? "";
}

/**
 * Like `requireEnv`, but for the JWT signing secret. In production, refuses to
 * boot unless the value is unique (not a known placeholder) and at least
 * `MIN_SECRET_BYTES` long. In dev, warns when a placeholder/fallback is in use
 * so a forgotten `.env` doesn't silently ship a weak secret.
 */
function requireSecret(
  name: string,
  fallback: string
): string {
  const value = process.env[name] ?? fallback;
  if (isProd) {
    if (!value) {
      throw new Error(
        `[env] Required environment variable "${name}" is not set. ` +
          "Set it in your deployment environment or .env file."
      );
    }
    if (value.length < MIN_SECRET_BYTES) {
      throw new Error(
        `[env] "${name}" is shorter than ${MIN_SECRET_BYTES} bytes. ` +
          "Generate a unique secret with: openssl rand -base64 32"
      );
    }
    if (KNOWN_INSECURE_SECRETS.has(value)) {
      throw new Error(
        `[env] "${name}" is set to a known insecure placeholder (committed in ` +
          ".env.example / dev fallback). Generate a unique secret with: " +
          "openssl rand -base64 32"
      );
    }
  } else if (!value || KNOWN_INSECURE_SECRETS.has(value)) {
    console.warn(
      `[env] WARNING: "${name}" is using an insecure dev placeholder. ` +
        "Set a unique value (openssl rand -base64 32) before deploying."
    );
  }
  return value ?? "";
}

/**
 * Like `requireEnv`, but for `DATABASE_URL` — additionally sanity-checks the
 * URI form (`postgres://…`) so a password containing `/` / `@` / `:` / `%`
 * does not silently break `pg`'s connection-string parser with a cryptic
 * downstream connect error.
 *
 * Background (M7 data-layer audit, 2026-07-26): `pg` URL-decodes the
 * password segment of a `DATABASE_URL`, so special characters there MUST be
 * percent-encoded. A `/` in the password terminates the URL authority early,
 * so the parser sees no host and connect fails with an un-actionable error.
 * This happened in production debugging (lp-app 503; `/` in the DB password).
 * The local dev default password has no special chars, so dev never surfaces
 * it — Railway's generated passwords can and do.
 *
 * Behavior:
 * - Libpq key=value form (no `postgres://` scheme) is left untouched: it has
 *   no authority segment and `new URL` would false-positive on it.
 * - In production: throws with an actionable percent-encoding hint.
 * - In dev/test: warns only, so existing tests that import `auth` (which
 *   imports this module at startup) keep booting under the plain dev default.
 */
function requireDatabaseUrl(name: string, fallback: string): string {
  const value = requireEnv(name, fallback);
  if (!/^postgres(?:ql)?:\/\//i.test(value)) return value;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch (e) {
    if (isProd) {
      throw new Error(
        `[env] "${name}" is not a valid PostgreSQL connection URI: ${(e as Error).message}. ` +
          "If the DB password contains `/`, `@`, `:`, or `%`, percent-encode it " +
          "(`/` -> `%2F`, `@` -> `%40`, `:` -> `%3A`, `%` -> `%25`)."
      );
    }
    console.warn(
      `[env] WARNING: "${name}" failed URL parse. If the password has special chars, ` +
        "percent-encode them (`/` -> `%2F`, `@` -> `%40`)."
    );
    return value;
  }

  // An empty hostname means the authority terminated early — the classic
  // signal of an unencoded `/` or stray `@` inside the password segment.
  if (!parsed.hostname) {
    if (isProd) {
      throw new Error(
        `[env] "${name}" parsed with no host — the DB password likely contains an ` +
          "unencoded `/` or `@` that ends the URL authority before the host. " +
          "Percent-encode it in the connection string (`/` -> `%2F`, `@` -> `%40`)."
      );
    }
    console.warn(
      `[env] WARNING: "${name}" parsed with no host — likely an unencoded char in the ` +
        "DB password. Percent-encode it (see apps/web/.env.example)."
    );
  }
  return value;
}

export const env = {
  AUTH_SECRET: requireSecret("AUTH_SECRET", "dev-secret-change-in-production"),
  DATABASE_URL: requireDatabaseUrl(
    "DATABASE_URL",
    "postgres://learning_platform:learning_platform@localhost:5432/learning_platform"
  ),
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "true",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
} as const;
