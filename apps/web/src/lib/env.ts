/**
 * Environment variable validation.
 *
 * Called once at startup (import side-effect). Throws in production if
 * required variables are missing. In development, uses safe defaults
 * so the app boots without a `.env` file (with a console warning).
 */

const isProd = process.env.NODE_ENV === "production";

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

export const env = {
  AUTH_SECRET: requireEnv("AUTH_SECRET", "dev-secret-change-in-production"),
  DATABASE_URL: requireEnv(
    "DATABASE_URL",
    "postgres://learning_platform:learning_platform@localhost:5432/learning_platform"
  ),
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "true",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
} as const;
