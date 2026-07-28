-- Enable citext extension for case-insensitive email (must be before citext column references)
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" citext NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deactivated_at" timestamp with time zone,
	CONSTRAINT "users_role_check" CHECK ("users"."role" in ('super_admin','center_admin','teacher','student'))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_unique" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_email_unique" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "users" USING btree ("tenant_id");
-- Enable Row-Level Security
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- RLS policy: non-super_admin users can only see their own tenant's data.
-- NOTE (2026-07-22): switched from "TO authenticated" (Supabase pseudo-role) to "TO PUBLIC"
-- because the local/VPS PostgreSQL does NOT have an "authenticated" role — the RLS migration
-- would fail with "role 'authenticated' does not exist" and crash the app. PUBLIC is the
-- standard PG catch-all. v1 enforces tenant isolation at the application layer via WHERE
-- clauses anyway; these policies are defense-in-depth for future use.
--
-- NOTE (2026-07-26, M7 data-layer audit): `current_setting('app.tenant_id', true)` uses the
-- second `missing_ok` argument so an UNSET GUC returns NULL instead of raising
-- `unrecognized configuration parameter "app.tenant_id"`. v1's app path (getDb() in
-- client.ts) never sets app.tenant_id today — the deprecated withTenantDb is the only setter.
-- With missing_ok absent, a future least-privilege (non-owner) role — a natural M7 hardening
-- step — would hard-error on every users/tenants query instead of simply seeing zero rows.
-- NULL::uuid never equals tenant_id, so an unset GUC correctly hides all tenant-scoped rows.
-- The policies remain defense-in-depth (the table owner still bypasses RLS until FORCE ROW
-- LEVEL SECURITY is added; full RLS activation is a founder decision tracked in the M7
-- data-layer-hardening evidence note and the ADR-0008 escalation-trigger list).
--
-- CREATE POLICY is wrapped in DO $$ … EXCEPTION WHEN duplicate_object for idempotent
-- re-execution (manual DB reset / restore), mirroring the FK block above (lines 25-29).
DO $$ BEGIN
CREATE POLICY "tenant_isolation_users" ON "users"
  AS PERMISSIVE FOR ALL
  TO PUBLIC
  USING ("tenant_id" = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK ("tenant_id" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- tenants is FOR SELECT only: in v1 there is no tenant-creation path through app code that
-- a least-privilege role would exercise (tenants are seeded by the founder/migrate path,
-- which runs as owner and bypasses RLS). Insert/Update/Delete on tenants therefore have no
-- policy by design; a write path that needs it will add a matching FOR INSERT/UPDATE policy.
DO $$ BEGIN
CREATE POLICY "tenant_isolation_tenants" ON "tenants"
  AS PERMISSIVE FOR SELECT
  TO PUBLIC
  USING ("id" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;